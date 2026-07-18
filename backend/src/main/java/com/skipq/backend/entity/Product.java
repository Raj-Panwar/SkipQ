package com.skipq.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import lombok.Data;
import com.skipq.backend.constants.InventoryConstants;
import jakarta.persistence.Transient;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "products")
@Data
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String category;

    private String description;
    @ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "college_id")
@JsonIgnore
private College college;

    private Double price;

    private Integer stock;

    private String status;

    @Column(name = "image_path", length = 255)
    private String imagePath;

    public College getCollege() {
        return college;
    }

    public void setCollege(College college) {
        this.college = college;
    }

    @Transient
    public StockStatus getStockStatus() {
        if (stock == 0) {
            return StockStatus.OUT_OF_STOCK;
        }

        if (stock <= InventoryConstants.LOW_STOCK_THRESHOLD) {
            return StockStatus.LOW_STOCK;
        }

        return StockStatus.IN_STOCK;
    }
}