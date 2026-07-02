package com.skipq.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    public String storeFile(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty.");}
        if (!"application/pdf".equals(file.getContentType())) {
                throw new RuntimeException("Only PDF files are allowed.");
        }
        if (file.getSize() > 25 * 1024 * 1024) {
    throw new RuntimeException("Maximum size is 25 MB.");
}
        

        Path uploadPath = Paths.get(uploadDir);

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalName = file.getOriginalFilename();

        String extension = "";

        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf("."));
        }

        String storedFileName = UUID.randomUUID().toString() + extension;

        Path destination = uploadPath.resolve(storedFileName);

        Files.copy(
                file.getInputStream(),
                destination,
                StandardCopyOption.REPLACE_EXISTING);

        return storedFileName;
    }

    public Path loadFile(String storedFileName) {

        return Paths.get(uploadDir)
                .resolve(storedFileName);
    }
    public void deleteFile(String fileName)
        throws IOException {

    Files.deleteIfExists(
        loadFile(fileName)
    );
}
}
