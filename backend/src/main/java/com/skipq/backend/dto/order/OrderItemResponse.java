package com.skipq.backend.dto.order;

import java.math.BigDecimal;

public class OrderItemResponse {

    private Long id;
    private String productName;
    private Integer quantity;
    private BigDecimal price;
    private String itemType;

    public OrderItemResponse() {
    }

    public OrderItemResponse(Long id,
                             String productName,
                             Integer quantity,
                             BigDecimal price,
                             String itemType) {
        this.id = id;
        this.productName = productName;
        this.quantity = quantity;
        this.price = price;
        this.itemType = itemType;
    }

    public Long getId() {
        return id;
    }

    public String getProductName() {
        return productName;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public BigDecimal getPrice() {
    return price;
}

    public String getItemType() {
        return itemType;
    }
}