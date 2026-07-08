package com.skipq.backend.service;

import com.skipq.backend.entity.College;
import com.skipq.backend.exception.TokenPoolExhaustedException;
import com.skipq.backend.repository.OrderRepository;
import com.skipq.backend.repository.CollegeRepository;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;

@Service
public class TokenAllocationService {
private static final int MIN_TOKEN = 1;
private static final int MAX_TOKEN = 999;

    private final OrderRepository orderRepository;
    private final CollegeRepository collegeRepository;

    public TokenAllocationService(
        OrderRepository orderRepository,
        CollegeRepository collegeRepository) {

    this.orderRepository = orderRepository;
    this.collegeRepository = collegeRepository;
}
    /**
     * Allocates the next token number for the given college.
     *
     * Step 2: if the college hasn't reached the max token yet, keep
     * incrementing as before. Once the max is hit, roll over: fetch
     * every currently-active token in a single query, then search
     * in memory from 1..999 for the first token that isn't active.
     *
     * COMPLETED and CANCELLED orders are not considered active, so
     * their token numbers are free for reuse after rollover.
     */
    public Integer allocateNextToken(College college) {

    Long collegeId = college.getId();

    Set<Integer> activeTokens = new HashSet<>(
            orderRepository.findActiveTokenNumbersByCollegeId(collegeId));

    int candidate = college.getLastAllocatedToken() + 1;

    if (candidate > MAX_TOKEN) {
        candidate = MIN_TOKEN;
    }

    int start = candidate;

    while (activeTokens.contains(candidate)) {

        candidate++;

        if (candidate > MAX_TOKEN) {
            candidate = MIN_TOKEN;
        }

        if (candidate == start) {
            throw new TokenPoolExhaustedException(
                    "All " + MAX_TOKEN + " tokens are currently active.");
        }
    }

    college.setLastAllocatedToken(candidate);
    collegeRepository.save(college);

    return candidate;
}
}