package com.skipq.backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.skipq.backend.entity.College;
import com.skipq.backend.repository.CollegeRepository;
import com.skipq.backend.constants.InventoryConstants;
import com.skipq.backend.entity.Product;
import com.skipq.backend.repository.ProductRepository;

@Service
public class ProductService {

    @Autowired
    private ProductRepository repository;

    @Autowired
    private CollegeRepository collegeRepository;

    public List<Product> getAllProducts(Long collegeId) {

        College college = collegeRepository.findById(collegeId)
                .orElseThrow(() -> new RuntimeException("College not found"));

        return repository.findByCollege(college);
    }

    public Product saveProduct(Product product, Long collegeId) {

        College college = collegeRepository.findById(collegeId)
                .orElseThrow(() -> new RuntimeException("College not found"));

        product.setCollege(college);

        return repository.save(product);
    }

    public Product getProductById(Long id, Long collegeId) {
        College college = collegeRepository.findById(collegeId)
                .orElseThrow(() -> new RuntimeException("College not found"));

        Product product = repository.findById(id).orElse(null);

        if (product == null || !product.getCollege().getId().equals(collegeId)) {
            return null;
        }

        return product;
    }

    public Product updateProduct(Long id, Product updated, Long collegeId) {

        Product product = getProductById(id, collegeId);

        if (product == null) {
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

    public void deleteProduct(Long id, Long collegeId) {
        Product product = getProductById(id, collegeId);

        if (product == null) {
            throw new RuntimeException("Product not found");
        }

        repository.delete(product);
    }

    @Transactional(readOnly = true)
    public List<Product> getLowStockProducts() {
        return repository.findByStockLessThanEqualOrderByStockAsc(
                InventoryConstants.LOW_STOCK_THRESHOLD);
    }

    @Transactional(readOnly = true)
    public List<Product> getProductsByCollegeCode(String collegeCode) {

        College college = collegeRepository
                .findByCodeIgnoreCase(collegeCode.trim().toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid college code."));

        return repository.findByCollege(college);
    }
}
