package com.skipq.backend.service;

import com.skipq.backend.repository.OrderRepository;
import org.springframework.stereotype.Service;

@Service
public class WaitTimeService {

    private static final long CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

    private final OrderRepository orderRepository;

    private volatile Double cachedAvgMinutes = null; // null = not enough data yet
    private volatile long lastComputedAt = 0;

    public WaitTimeService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    /**
     * Average preparation duration in minutes, based on historical
     * PREPARING -> READY transitions. Returns null if no data exists yet
     * (cold start) rather than a fabricated default.
     */
    public Double getAveragePreparationMinutes() {
        long now = System.currentTimeMillis();

        // Recompute if cache expired, or if we've never had valid data
        // (so a fresh completed order is picked up quickly instead of
        // being stuck behind a stale "no data" cache).
        if (cachedAvgMinutes == null || (now - lastComputedAt) > CACHE_TTL_MS) {
            recompute();
        }

        return cachedAvgMinutes;
    }
    public void invalidateCache() {
    cachedAvgMinutes = null;
    lastComputedAt = 0;
}

    private synchronized void recompute() {
        Double avgSeconds = orderRepository.findAveragePreparationSeconds();
        cachedAvgMinutes = (avgSeconds == null) ? null : avgSeconds / 60.0;
        lastComputedAt = System.currentTimeMillis();
    }
    
}