package com.skipq.backend.entity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDateTime;
@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long productId;

    private String productName;

    private Integer quantity;
    private Integer copies;

    private BigDecimal price;
    private String itemType;
    private String fileName;
    private Integer pages;
    private String colorMode;
    private String sided;
    private String paperSize;
    @Column(name = "uploaded_at", nullable = false)
private LocalDateTime uploadedAt;

@PrePersist
public void onCreate() {

    if (uploadedAt == null) {
        uploadedAt = LocalDateTime.now();
    }

}
public LocalDateTime getUploadedAt() {
    return uploadedAt;
}

public void setUploadedAt(LocalDateTime uploadedAt) {
    this.uploadedAt = uploadedAt;
}
    @Column(name = "original_file_name")
    private String originalFileName;
    public String getOriginalFileName(){
        return originalFileName;
    }
    public void setOriginalFileName(String originalFileName){
        this.originalFileName = originalFileName;
    }
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

    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;

    public OrderItem() {}

    public Long getId() { return id; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    
    @JsonIgnore
    public Order getOrder() { return order; }

    public void setOrder(Order order) { this.order = order; }
}

