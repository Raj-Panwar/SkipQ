package com.skipq.backend.controller;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.skipq.backend.entity.Product;
import com.skipq.backend.security.AppUserPrincipal;
import com.skipq.backend.service.ProductService;

@RestController
@RequestMapping("/api/admin/products")
@CrossOrigin("*")
public class ProductImageController {

    @Autowired
    private ProductService service;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/image")
    public Product uploadProductImage(
            @AuthenticationPrincipal AppUserPrincipal admin,
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {

        return service.updateProductImage(id, admin.getCollegeId(), file);
    }
}