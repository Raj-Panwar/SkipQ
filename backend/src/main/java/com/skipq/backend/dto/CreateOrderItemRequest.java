package com.skipq.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class CreateOrderItemRequest {
    private String itemType;

private String fileName;
private Integer pages;
private Integer copies;
private String colorMode;
private String sided;
private String paperSize;
private Double totalPrice;
    public String getItemType() {
    return itemType;
}

public void setItemType(String itemType) {
    this.itemType = itemType;
}

public String getFileName() {
    return fileName;
}

public void setFileName(String fileName) {
    this.fileName = fileName;
}

public Integer getPages() {
    return pages;
}

public void setPages(Integer pages) {
    this.pages = pages;
}

public Integer getCopies() {
    return copies;
}

public void setCopies(Integer copies) {
    this.copies = copies;
}

public String getColorMode() {
    return colorMode;
}

public void setColorMode(String colorMode) {
    this.colorMode = colorMode;
}

public String getSided() {
    return sided;
}

public void setSided(String sided) {
    this.sided = sided;
}

public String getPaperSize() {
    return paperSize;
}

public void setPaperSize(String paperSize) {
    this.paperSize = paperSize;
}

public Double getTotalPrice() {
    return totalPrice;
}

public void setTotalPrice(Double totalPrice) {
    this.totalPrice = totalPrice;
}
 
    private Long productId;

    private Integer quantity;

    public CreateOrderItemRequest() {}

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
