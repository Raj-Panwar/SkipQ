package com.skipq.backend.repository;

import com.skipq.backend.entity.Order;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class OrderSpecifications {

    private OrderSpecifications() {}

    /**
     * Unified search: matches token number OR order ID (exact, if query parses
     * as a number) OR student name (partial, case-insensitive).
     */
    public static Specification<Order> matchesQuery(String query) {
        return (root, cq, cb) -> {
            if (query == null || query.isBlank()) {
                return cb.conjunction(); // no-op filter
            }

            List<Predicate> predicates = new ArrayList<>();
            String trimmed = query.trim();

            predicates.add(cb.like(cb.lower(root.get("studentName")), "%" + trimmed.toLowerCase() + "%"));

            try {
                Integer tokenVal = Integer.parseInt(trimmed);
                predicates.add(cb.equal(root.get("tokenNumber"), tokenVal));
            } catch (NumberFormatException ignored) { /* not a token number */ }

            try {
                Long idVal = Long.parseLong(trimmed);
                predicates.add(cb.equal(root.get("id"), idVal));
            } catch (NumberFormatException ignored) { /* not an order id */ }

            return cb.or(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<Order> hasStatus(String status) {
        return (root, cq, cb) -> {
            if (status == null || status.isBlank()) {
                return cb.conjunction();
            }
            return cb.equal(root.get("status"), status);
        };
    }

    public static Specification<Order> createdOnDate(LocalDate date) {
        return (root, cq, cb) -> {
            if (date == null) {
                return cb.conjunction();
            }
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();
            return cb.between(root.get("createdAt"), startOfDay, endOfDay);
        };
    }
    public static Specification<Order> belongsToCollege(Long collegeId) {
    return (root, query, cb) -> {

        if (collegeId == null) {
            return cb.conjunction();
        }

        return cb.equal(
                root.get("college").get("id"),
                collegeId
        );
    };
}
}
