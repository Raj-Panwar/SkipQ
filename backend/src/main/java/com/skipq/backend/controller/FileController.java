package com.skipq.backend.controller;
import java.nio.file.Path;
import com.skipq.backend.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
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
}