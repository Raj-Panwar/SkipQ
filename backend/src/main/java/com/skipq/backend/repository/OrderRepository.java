package com.skipq.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.skipq.backend.entity.Order;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findAllByOrderByCreatedAtDesc();

    // Lowest active token currently being processed
    @Query("""
                SELECT MIN(o.tokenNumber)
                FROM Order o
                WHERE o.status IN ('PLACED', 'PREPARING','READY')
            """)
    Integer findCurrentServingToken();

    // Number of active orders ahead of a token
    @Query("""
                SELECT COUNT(o)
                FROM Order o
                WHERE o.tokenNumber < :token
                AND o.status IN ('PLACED', 'PREPARING','READY')
            """)
    long countPeopleAhead(@Param("token") Integer token);

    @Query("""
            SELECT COALESCE(MAX(o.tokenNumber),0)
            FROM Order o
            """)
    Integer findMaxTokenNumber();

}
