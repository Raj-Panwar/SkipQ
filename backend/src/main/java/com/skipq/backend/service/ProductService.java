package com.skipq.backend.service;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
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

    @Autowired
    private ProductImageStorageService productImageStorageService;

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
             throw new RuntimeException("Product not found");
        }

        return product;
    }

    public Product updateProduct(Long id, Product updated, Long collegeId) {

        Product product = getProductById(id, collegeId);


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

        try {
            productImageStorageService.deleteProductImage(product.getImagePath());
        } catch (IOException ex) {
            throw new RuntimeException("Failed to delete product image: " + ex.getMessage());
        }

        repository.delete(product);
    }

    /**
     * Uploads (or replaces) the image for a product, scoped to the calling
     * admin's college via the existing getProductById check. If the product
     * already has an image, the previous file is deleted from disk before
     * the new one is stored, so no orphan files accumulate.
     */
    public Product updateProductImage(Long id, Long collegeId, MultipartFile file) throws IOException {
        Product product = getProductById(id, collegeId);

        String previousImagePath = product.getImagePath();

        String newImagePath = productImageStorageService.storeProductImage(file);
        product.setImagePath(newImagePath);

        Product saved = repository.save(product);

        if (previousImagePath != null && !previousImagePath.equals(newImagePath)) {
            productImageStorageService.deleteProductImage(previousImagePath);
        }

        return saved;
    }

   @Transactional(readOnly = true)
public List<Product> getLowStockProducts(Long collegeId) {

    College college = collegeRepository.findById(collegeId)
            .orElseThrow(() -> new RuntimeException("College not found"));

    return repository.findByCollegeAndStockLessThanEqualOrderByStockAsc(
            college,
            InventoryConstants.LOW_STOCK_THRESHOLD);
}
    @Transactional(readOnly = true)
    public List<Product> getProductsByCollegeCode(String collegeCode) {

        College college = collegeRepository
                .findByCodeIgnoreCase(collegeCode.trim().toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid college code."));

        return repository.findByCollege(college);
    }
    public Product getProductByIdForCollegeCode(Long id, String collegeCode) {

    College college = collegeRepository
            .findByCodeIgnoreCase(collegeCode.trim().toUpperCase())
            .orElseThrow(() -> new RuntimeException("College not found"));

    Product product = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Product not found"));

    if (!product.getCollege().getId().equals(college.getId())) {
        throw new RuntimeException("Product does not belong to this college.");
    }

    return product;
}
}