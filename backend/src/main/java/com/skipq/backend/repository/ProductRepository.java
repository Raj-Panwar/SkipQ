package com.skipq.backend.repository;

import java.util.List;
import com.skipq.backend.entity.College;
import org.springframework.data.jpa.repository.JpaRepository;
import com.skipq.backend.entity.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByStockLessThanEqualOrderByStockAsc(int threshold);

    List<Product> findByCollege(College college);

    List<Product> findByCollegeAndStockLessThanEqualOrderByStockAsc(
        College college,
        Integer stock);
}
