package com.skipq.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.skipq.backend.entity.OrderItem;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}