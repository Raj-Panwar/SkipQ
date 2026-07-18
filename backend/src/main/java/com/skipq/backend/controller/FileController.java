package com.skipq.backend.controller;
import java.nio.file.Path;
import java.util.regex.Pattern;
import com.skipq.backend.service.FileStorageService;
import com.skipq.backend.service.ProductImageStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileController {

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private ProductImageStorageService productImageStorageService;

    // Product images are always stored by ProductImageStorageService as
    // <uuid>.jpg or <uuid>.png — this pattern is a hard allow-list, so no
    // filename outside that exact shape can ever be resolved on disk here.
    private static final Pattern PRODUCT_IMAGE_FILENAME_PATTERN =
            Pattern.compile("^[a-fA-F0-9-]+\\.(jpg|png)$");

   @PostMapping("/upload")
public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {

    System.out.println("==== Upload request received ====");
    System.out.println("Original file: " + file.getOriginalFilename());

    try {
        String fileName = fileStorageService.storeFile(file);

        System.out.println("Stored as: " + fileName);

        return ResponseEntity.ok(
                Map.of(
                        "fileName", fileName,
                        "message", "Uploaded successfully"));

    } catch (Exception e) {
        e.printStackTrace();

        return ResponseEntity.badRequest().body(
                Map.of("message", e.getMessage()));
    }
}
    @GetMapping("/{fileName}")
public ResponseEntity<org.springframework.core.io.Resource> downloadFile(
        @PathVariable String fileName) throws Exception {

    Path path = fileStorageService.loadFile(fileName);

    org.springframework.core.io.Resource resource =
            new org.springframework.core.io.UrlResource(path.toUri());

    if (!resource.exists()) {
        return ResponseEntity.notFound().build();
    }

    return ResponseEntity.ok()
            .header(
                    "Content-Disposition",
                    "attachment; filename=\"" + fileName + "\"")
            .body(resource);
}

    /**
     * Serves product images stored under uploads/products. Deliberately a
     * separate route from downloadFile above (which is print-PDF specific,
     * unchanged) — displayed inline (not as an attachment) since it's
     * rendered directly in <img> tags on the student menu and admin
     * inventory pages, which cannot send an Authorization header, hence
     * this route must stay public (see SecurityConfig).
     */
    @GetMapping("/products/{fileName}")
    public ResponseEntity<org.springframework.core.io.Resource> downloadProductImage(
            @PathVariable String fileName) throws Exception {

        if (!PRODUCT_IMAGE_FILENAME_PATTERN.matcher(fileName).matches()) {
            return ResponseEntity.badRequest().build();
        }

        Path path = productImageStorageService.loadProductImage(fileName);

        org.springframework.core.io.Resource resource =
                new org.springframework.core.io.UrlResource(path.toUri());

        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        MediaType mediaType = fileName.endsWith(".png") ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG;

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header("Content-Disposition", "inline; filename=\"" + fileName + "\"")
                .body(resource);
    }
}