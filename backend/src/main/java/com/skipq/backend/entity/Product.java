package com.skipq.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import com.skipq.backend.constants.InventoryConstants;
import jakarta.persistence.Transient;

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

    private Double price;

    private Integer stock;

    private String status;

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
