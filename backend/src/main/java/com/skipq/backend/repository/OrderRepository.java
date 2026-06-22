package com.skipq.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.skipq.backend.entity.Order;

public interface OrderRepository extends JpaRepository<Order, Long> {
}
