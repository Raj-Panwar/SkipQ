package com.skipq.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.skipq.backend.entity.Product;
import com.skipq.backend.service.ProductService;

@RestController
@RequestMapping("/api/products")
@CrossOrigin("*")
public class ProductController {

    @Autowired
    private ProductService service;

   @GetMapping
    public List<Product> getProducts() {
        return service.getAllProducts();
    }
    @GetMapping("/{id}")
        public Product getProduct(@PathVariable Long id){
            return service.getProductById(id);
        }

    @PostMapping
    public Product addProduct(@RequestBody Product product) {
        return service.saveProduct(product);
    }
    @PutMapping("/{id}")
public Product updateProduct(
        @PathVariable Long id,
        @RequestBody Product product) {

    return service.updateProduct(id, product);
    }
    @DeleteMapping("/{id}")
public void deleteProduct(@PathVariable Long id) {
    service.deleteProduct(id);
}
}
