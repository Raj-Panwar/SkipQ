package com.skipq.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.skipq.backend.service.AdminService;
import com.skipq.backend.entity.Product;
import com.skipq.backend.service.ProductService;

@RestController
@RequestMapping("/api/products")
@CrossOrigin("*")
public class ProductController {

    @Autowired
    private ProductService service;

    @Autowired
    private AdminService adminService;

    @GetMapping
    public List<Product> getProducts(
            @RequestHeader("X-Admin-Id") Long adminId) {

        Long collegeId = adminService
                .getById(adminId)
                .getCollege()
                .getId();

        return service.getAllProducts(collegeId);
    }

    @GetMapping("/low-stock")
    public List<Product> getLowStockProducts() {
        return service.getLowStockProducts();
    }

    @GetMapping("/{id}")
    public Product getProduct(
            @RequestHeader("X-Admin-Id") Long adminId,
            @PathVariable Long id) {

        Long collegeId = adminService
                .getById(adminId)
                .getCollege()
                .getId();

        return service.getProductById(id, collegeId);
    }

    @GetMapping("/college/{code}")
    public List<Product> getProductsByCollege(
            @PathVariable String code) {

        return service.getProductsByCollegeCode(code);
    }

    @PostMapping
    public Product addProduct(
            @RequestHeader("X-Admin-Id") Long adminId,
            @RequestBody Product product) {

        Long collegeId = adminService
                .getById(adminId)
                .getCollege()
                .getId();

        return service.saveProduct(product, collegeId);
    }

    @PutMapping("/{id}")
    public Product updateProduct(
            @RequestHeader("X-Admin-Id") Long adminId,
            @PathVariable Long id,
            @RequestBody Product product) {

        Long collegeId = adminService
                .getById(adminId)
                .getCollege()
                .getId();

        return service.updateProduct(id, product, collegeId);
    }

    @DeleteMapping("/{id}")
    public void deleteProduct(
            @RequestHeader("X-Admin-Id") Long adminId,
            @PathVariable Long id) {

        Long collegeId = adminService
                .getById(adminId)
                .getCollege()
                .getId();

        service.deleteProduct(id, collegeId);
    }

}
