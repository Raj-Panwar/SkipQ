package com.skipq.backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.skipq.backend.entity.Product;
import com.skipq.backend.repository.ProductRepository;

@Service
public class ProductService {

    @Autowired
    private ProductRepository repository;

    public List<Product> getAllProducts() {
        return repository.findAll();
    }

    public Product saveProduct(Product product) {
        return repository.save(product);
    }
    public Product getProductById(Long id){
    return repository.findById(id).orElse(null);
    
    }
    public Product updateProduct(Long id, Product updated) {

    Product product = repository.findById(id).orElse(null);

    if(product == null) {
        return null;
    }

    product.setName(updated.getName());
    product.setCategory(updated.getCategory());
    product.setDescription(updated.getDescription());
    product.setPrice(updated.getPrice());
    product.setStock(updated.getStock());
    product.setStatus(updated.getStatus());

    return repository.save(product);
    }
    public void deleteProduct(Long id) {
    repository.deleteById(id);
}
}
