package com.skipq.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.skipq.backend.entity.Order;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("""
        SELECT DISTINCT o
        FROM Order o
        LEFT JOIN FETCH o.items
        LEFT JOIN FETCH o.student
        ORDER BY o.createdAt DESC
    """)
    List<Order> findAllByOrderByCreatedAtDesc();

    @Query("""
        SELECT MIN(o.tokenNumber)
        FROM Order o
        WHERE o.status IN ('PLACED', 'PREPARING','READY')
    """)
    Integer findCurrentServingToken();

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

    @Query("""
        SELECT DISTINCT o
        FROM Order o
        LEFT JOIN FETCH o.items
        LEFT JOIN FETCH o.student
        WHERE o.student.id = :studentId
        ORDER BY o.createdAt DESC
    """)
    List<Order> findByStudentIdOrderByCreatedAtDesc(@Param("studentId") Long studentId);
}