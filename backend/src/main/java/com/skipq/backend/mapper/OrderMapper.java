package com.skipq.backend.mapper;

import com.skipq.backend.dto.order.OrderItemResponse;
import com.skipq.backend.dto.order.OrderResponse;
import com.skipq.backend.entity.Order;
import com.skipq.backend.entity.OrderItem;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class OrderMapper {

    public OrderResponse toResponse(Order order) {

        List<OrderItemResponse> items = order.getItems()
                .stream()
                .map(this::toItemResponse)
                .toList();

        return new OrderResponse(
                order.getId(),
                order.getStudentName(),
                order.getTokenNumber(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getCreatedAt(),
                items
        );
    }

    private OrderItemResponse toItemResponse(OrderItem item) {

        return new OrderItemResponse(
                item.getId(),
                item.getProductName(),
                item.getQuantity(),
                item.getPrice(),
                item.getItemType()
        );
    }
}