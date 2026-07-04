package com.skipq.backend.dto;

public class WaitEstimateDTO {

    private long ordersAhead;
    private Integer estimatedWaitMinutes; // null = not enough data yet

    public WaitEstimateDTO(long ordersAhead, Integer estimatedWaitMinutes) {
        this.ordersAhead = ordersAhead;
        this.estimatedWaitMinutes = estimatedWaitMinutes;
    }

    public long getOrdersAhead() { return ordersAhead; }
    public void setOrdersAhead(long ordersAhead) { this.ordersAhead = ordersAhead; }

    public Integer getEstimatedWaitMinutes() { return estimatedWaitMinutes; }
    public void setEstimatedWaitMinutes(Integer estimatedWaitMinutes) { this.estimatedWaitMinutes = estimatedWaitMinutes; }
}