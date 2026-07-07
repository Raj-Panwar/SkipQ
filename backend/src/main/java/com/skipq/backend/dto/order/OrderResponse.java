package com.skipq.backend.dto.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OrderResponse {

    private Long id;
    private String studentName;
    private Integer tokenNumber;
    private String status;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;

    private List<OrderItemResponse> items;

    public OrderResponse() {
    }

    public OrderResponse(Long id,
                         String studentName,
                         Integer tokenNumber,
                         String status,
                         BigDecimal totalAmount,
                         LocalDateTime createdAt,
                         List<OrderItemResponse> items) {

        this.id = id;
        this.studentName = studentName;
        this.tokenNumber = tokenNumber;
        this.status = status;
        this.totalAmount = totalAmount;
        this.createdAt = createdAt;
        this.items = items;
    }

    public Long getId() {
        return id;
    }

    public String getStudentName() {
        return studentName;
    }

    public Integer getTokenNumber() {
        return tokenNumber;
    }

    public String getStatus() {
        return status;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public List<OrderItemResponse> getItems() {
        return items;
    }
}