package com.skipq.backend.repository;

import java.time.LocalDateTime;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.skipq.backend.entity.OrderItem;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
List<OrderItem> findByUploadedAtBefore(LocalDateTime dateTime);
}
