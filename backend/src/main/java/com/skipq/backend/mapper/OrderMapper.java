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

    OrderItemResponse dto = new OrderItemResponse();

    dto.setId(item.getId());
    dto.setProductName(item.getProductName());
    dto.setQuantity(item.getQuantity());
    dto.setPrice(item.getPrice());
    dto.setItemType(item.getItemType());

    // Print job fields
    dto.setFileName(item.getFileName());
    dto.setOriginalFileName(item.getOriginalFileName());
    dto.setPages(item.getPages());
    dto.setCopies(item.getCopies()); // one print item = number of copies
    dto.setColorMode(item.getColorMode());
    dto.setPaperSize(item.getPaperSize());
    dto.setSided(item.getSided());

    return dto;
}
}