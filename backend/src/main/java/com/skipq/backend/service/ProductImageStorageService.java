package com.skipq.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.Iterator;
import java.util.Set;
import java.util.UUID;

/**
 * Handles product image uploads: validation, optimization and storage.
 *
 * Deliberately kept separate from FileStorageService (which only ever
 * handles print-job PDFs) so the two upload types never share a folder
 * and each keeps its own, format-specific validation rules. Both write
 * under the same root {@code file.upload-dir}, but product images live
 * in a dedicated "products" subdirectory:
 *
 *   uploads/
 *     &lt;print PDFs, flat, unchanged&gt;
 *     products/
 *       &lt;uuid&gt;.jpg / .png
 */
@Service
public class ProductImageStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    private static final String PRODUCTS_SUBDIR = "products";

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp");

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "webp");

    private static final long MAX_UPLOAD_SIZE_BYTES = 5L * 1024 * 1024; // 5 MB
    private static final int MAX_DIMENSION_PX = 1200;
    private static final float JPEG_QUALITY = 0.82f;

    /**
     * Validates, decodes, optimizes and stores a product image.
     * Returns the relative path to persist on Product.imagePath
     * (e.g. "products/3f2c-....jpg") — never a full URL, so the frontend
     * builds the actual URL for whatever environment it's running in.
     */
    public String storeProductImage(MultipartFile file) throws IOException {

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Image file is empty.");
        }

        if (file.getSize() > MAX_UPLOAD_SIZE_BYTES) {
            throw new RuntimeException("Maximum image size is 5 MB.");
        }

        String extension = extractExtension(file.getOriginalFilename());
        if (extension == null || !ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new RuntimeException(
                    "Only JPG, JPEG, PNG and WEBP images are allowed.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new RuntimeException(
                    "Invalid image content type. Only JPG, PNG and WEBP are allowed.");
        }

        // The real proof the upload is an image: fully decode it. A
        // renamed non-image file, or a corrupt one, fails here even
        // though its extension and declared content-type look correct.
        BufferedImage original;
        try {
            original = ImageIO.read(file.getInputStream());
        } catch (IOException ex) {
            throw new RuntimeException("Uploaded file could not be read as an image.");
        }

        if (original == null) {
            throw new RuntimeException("Uploaded file is not a valid, decodable image.");
        }

        BufferedImage optimized = resizeIfNeeded(original);
        boolean hasAlpha = optimized.getColorModel().hasAlpha();
        String outputFormat = hasAlpha ? "png" : "jpg";

        Path uploadPath = Paths.get(uploadDir, PRODUCTS_SUBDIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String storedFileName = UUID.randomUUID() + "." + outputFormat;
        Path destination = uploadPath.resolve(storedFileName);

        writeImage(optimized, outputFormat, destination);

        return PRODUCTS_SUBDIR + "/" + storedFileName;
    }

    /**
     * Deletes a previously stored product image given its relative path
     * (as returned by storeProductImage / persisted on Product.imagePath).
     * Silently no-ops if the path is null/blank or the file is already gone
     * — callers (replace / delete product) don't need special-case logic
     * for "no image was ever set".
     */
    public void deleteProductImage(String relativeImagePath) throws IOException {
        if (relativeImagePath == null || relativeImagePath.isBlank()) {
            return;
        }

        Files.deleteIfExists(resolveSafely(relativeImagePath));
    }

    /** Resolves a stored file name (within the products subdirectory) for serving. */
    public Path loadProductImage(String fileName) {
        return resolveSafely(PRODUCTS_SUBDIR + "/" + fileName);
    }

    /**
     * Resolves a relative path so it can only ever point inside the
     * products subdirectory — defense-in-depth against path traversal,
     * on top of the strict filename pattern enforced at the controller.
     */
    private Path resolveSafely(String relativePath) {
        Path base = Paths.get(uploadDir, PRODUCTS_SUBDIR).normalize().toAbsolutePath();
        Path candidate = Paths.get(uploadDir).resolve(relativePath).normalize().toAbsolutePath();

        if (!candidate.startsWith(base)) {
            throw new RuntimeException("Invalid image path.");
        }

        return candidate;
    }

    private BufferedImage resizeIfNeeded(BufferedImage source) {
        int width = source.getWidth();
        int height = source.getHeight();

        if (width <= MAX_DIMENSION_PX && height <= MAX_DIMENSION_PX) {
            return source;
        }

        double scale = Math.min(
                (double) MAX_DIMENSION_PX / width,
                (double) MAX_DIMENSION_PX / height);

        int scaledWidth = Math.max(1, (int) Math.round(width * scale));
        int scaledHeight = Math.max(1, (int) Math.round(height * scale));

        int imageType = source.getColorModel().hasAlpha()
                ? BufferedImage.TYPE_INT_ARGB
                : BufferedImage.TYPE_INT_RGB;

        BufferedImage resized = new BufferedImage(scaledWidth, scaledHeight, imageType);
        Graphics2D g2d = resized.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.drawImage(source, 0, 0, scaledWidth, scaledHeight, null);
        g2d.dispose();

        return resized;
    }

    private void writeImage(BufferedImage image, String format, Path destination) throws IOException {
        if ("jpg".equals(format)) {
            writeJpegWithCompression(image, destination);
            return;
        }

        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        ImageIO.write(image, "png", buffer);
        Files.write(destination, buffer.toByteArray(),
                StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
    }

    private void writeJpegWithCompression(BufferedImage image, Path destination) throws IOException {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
        if (!writers.hasNext()) {
            throw new IOException("No JPEG writer available.");
        }

        ImageWriter writer = writers.next();
        ImageWriteParam param = writer.getDefaultWriteParam();
        param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        param.setCompressionQuality(JPEG_QUALITY);

        try (OutputStream os = Files.newOutputStream(destination,
                StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
             ImageOutputStream ios = ImageIO.createImageOutputStream(os)) {

            writer.setOutput(ios);
            writer.write(null, new IIOImage(image, null, null), param);

        } finally {
            writer.dispose();
        }
    }

    private String extractExtension(String originalFileName) {
        if (originalFileName == null || !originalFileName.contains(".")) {
            return null;
        }
        return originalFileName.substring(originalFileName.lastIndexOf('.') + 1);
    }
}