package com.skipq.backend.service;

import com.skipq.backend.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;

@Service
public class WaitTimeService {

    private static final long CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

    private final OrderRepository orderRepository;

    /**
     * Key = collegeId
     * Value = average preparation time (minutes)
     */
    private final ConcurrentHashMap<Long, Double> averageCache = new ConcurrentHashMap<>();

    /**
     * Key = collegeId
     * Value = cache creation timestamp
     */
    private final ConcurrentHashMap<Long, Long> timestampCache = new ConcurrentHashMap<>();

    public WaitTimeService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    /**
     * Returns the cached average preparation time for the given college.
     * Recomputes it if the cache has expired or doesn't exist yet.
     */
    public Double getAveragePreparationMinutes(Long collegeId) {

        long now = System.currentTimeMillis();

        Double cachedAverage = averageCache.get(collegeId);
        Long cachedAt = timestampCache.get(collegeId);

        if (cachedAverage == null
                || cachedAt == null
                || (now - cachedAt) > CACHE_TTL_MS) {

            recompute(collegeId);

            cachedAverage = averageCache.get(collegeId);
        }
        cachedAverage = averageCache.get(collegeId);
        return cachedAverage;
    }

    /**
     * Invalidates the cache for a single college.
     */
    public void invalidateCache(Long collegeId) {
        averageCache.remove(collegeId);
        timestampCache.remove(collegeId);
    }

    /**
     * Recomputes the average preparation time for one college only.
     */
    private synchronized void recompute(Long collegeId) {

        Double avgSeconds = orderRepository.findAveragePreparationSecondsByCollegeId(collegeId);

        if (avgSeconds == null) {
            averageCache.remove(collegeId);
        } else {
            averageCache.put(collegeId, avgSeconds / 60.0);
        }

        timestampCache.put(collegeId, System.currentTimeMillis());
    }
}