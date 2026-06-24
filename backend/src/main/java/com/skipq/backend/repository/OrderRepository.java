package com.skipq.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.skipq.backend.entity.Order;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findAllByOrderByCreatedAtDesc();
}
