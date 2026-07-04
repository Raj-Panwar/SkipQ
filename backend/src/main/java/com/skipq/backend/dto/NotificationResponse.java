package com.skipq.backend.dto;

import java.time.LocalDateTime;

public class NotificationResponse {

    private Long id;
    private Long orderId;
    private Integer tokenNumber;
    private String type;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;

    public NotificationResponse() {
    }

    public NotificationResponse(Long id,
                                Long orderId,
                                Integer tokenNumber,
                                String type,
                                String message,
                                boolean read,
                                LocalDateTime createdAt) {
        this.id = id;
        this.orderId = orderId;
        this.tokenNumber = tokenNumber;
        this.type = type;
        this.message = message;
        this.read = read;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Integer getTokenNumber() {
        return tokenNumber;
    }

    public void setTokenNumber(Integer tokenNumber) {
        this.tokenNumber = tokenNumber;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}