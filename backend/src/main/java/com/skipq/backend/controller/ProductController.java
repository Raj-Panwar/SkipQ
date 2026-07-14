package com.skipq.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.skipq.backend.entity.Product;
import com.skipq.backend.security.AppUserPrincipal;
import com.skipq.backend.service.ProductService;

@RestController
@RequestMapping("/api/products")
@CrossOrigin("*")
public class ProductController {

    @Autowired
    private ProductService service;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<Product> getProducts(
            @AuthenticationPrincipal AppUserPrincipal admin) {

        return service.getAllProducts(admin.getCollegeId());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/low-stock")
    public List<Product> getLowStockProducts(
            @AuthenticationPrincipal AppUserPrincipal admin) {

        return service.getLowStockProducts(admin.getCollegeId());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public Product getProduct(
            @AuthenticationPrincipal AppUserPrincipal admin,
            @PathVariable Long id) {

        return service.getProductById(id, admin.getCollegeId());
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/college/{code}")
    public List<Product> getProductsByCollege(
            @AuthenticationPrincipal AppUserPrincipal student,
            @PathVariable String code) {

        requireOwnCollege(student, code);
        return service.getProductsByCollegeCode(code);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public Product addProduct(
            @AuthenticationPrincipal AppUserPrincipal admin,
            @RequestBody Product product) {

        return service.saveProduct(product, admin.getCollegeId());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public Product updateProduct(
            @AuthenticationPrincipal AppUserPrincipal admin,
            @PathVariable Long id,
            @RequestBody Product product) {

        return service.updateProduct(id, product, admin.getCollegeId());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void deleteProduct(
            @AuthenticationPrincipal AppUserPrincipal admin,
            @PathVariable Long id) {

        service.deleteProduct(id, admin.getCollegeId());
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/student/{id}")
    public Product getStudentProduct(
            @AuthenticationPrincipal AppUserPrincipal student,
            @PathVariable Long id,
            @RequestParam String collegeCode) {

        requireOwnCollege(student, collegeCode);
        return service.getProductByIdForCollegeCode(id, collegeCode);
    }

    /** Students may only browse the catalog of their own college. */
    private void requireOwnCollege(AppUserPrincipal student, String requestedCollegeCode) {
        if (!student.getCollegeCode().equalsIgnoreCase(requestedCollegeCode)) {
            throw new RuntimeException("You do not have access to this college's catalog.");
        }
    }

}