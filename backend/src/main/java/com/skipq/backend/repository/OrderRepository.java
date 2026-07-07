package com.skipq.backend.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.EntityGraph;

import com.skipq.backend.entity.Order;

public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

  @Query("""
          SELECT DISTINCT o
          FROM Order o
          LEFT JOIN FETCH o.items
          LEFT JOIN FETCH o.student
          WHERE o.college.id = :collegeId
          ORDER BY o.createdAt DESC
      """)
  List<Order> findAllByCollegeIdOrderByCreatedAtDesc(
      @Param("collegeId") Long collegeId);

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
      SELECT COALESCE(MAX(o.tokenNumber), 0)
      FROM Order o
      WHERE o.college.id = :collegeId
      """)
  Integer findMaxTokenNumberByCollegeId(@Param("collegeId") Long collegeId);

  @Query("""
          SELECT DISTINCT o
          FROM Order o
          LEFT JOIN FETCH o.items
          LEFT JOIN FETCH o.student
          WHERE o.student.id = :studentId
          ORDER BY o.createdAt DESC
      """)

  List<Order> findByStudentIdOrderByCreatedAtDesc(@Param("studentId") Long studentId);

  @Query(value = """
      SELECT AVG(prep_time)
      FROM (
          SELECT TIMESTAMPDIFF(SECOND, preparing_at, ready_at) AS prep_time
          FROM orders
          WHERE preparing_at IS NOT NULL
            AND ready_at IS NOT NULL
            AND TIMESTAMPDIFF(SECOND, preparing_at, ready_at) BETWEEN 30 AND 3600
          ORDER BY ready_at DESC
          LIMIT 50
      ) recent_orders
      """, nativeQuery = true)
  Double findAveragePreparationSeconds();

  @Query("""
      SELECT COUNT(o)
      FROM Order o
      WHERE o.status IN ('PLACED','PREPARING')
      """)
  long countActiveOrders();

  @Query("""
SELECT COUNT(o)
FROM Order o
WHERE o.college.id = :collegeId
  AND o.status IN ('PLACED','PREPARING')
""")
long countActiveOrdersByCollegeId(
        @Param("collegeId") Long collegeId);

  @Query("""
      SELECT o
      FROM Order o
      WHERE o.id = :orderId
        AND o.student.id = :studentId
      """)
  java.util.Optional<Order> findByIdAndStudentId(
      @Param("orderId") Long orderId,
      @Param("studentId") Long studentId);

  @EntityGraph(attributePaths = { "student", "items" })
  Page<Order> findAll(
      org.springframework.data.jpa.domain.Specification<Order> spec,
      org.springframework.data.domain.Pageable pageable);

  @Query("""
          SELECT o
          FROM Order o
          WHERE o.id = :id
            AND o.college.id = :collegeId
      """)
  Optional<Order> findByIdAndCollegeId(
      @Param("id") Long id,
      @Param("collegeId") Long collegeId);

  @Query("""
      SELECT MIN(o.tokenNumber)
      FROM Order o
      WHERE o.college.id = :collegeId
        AND o.status IN ('PLACED', 'PREPARING', 'READY')
      """)
  Integer findCurrentServingTokenByCollegeId(
      @Param("collegeId") Long collegeId);

  @Query("""
      SELECT COUNT(o)
      FROM Order o
      WHERE o.college.id = :collegeId
        AND o.tokenNumber < :token
        AND o.status IN ('PLACED','PREPARING','READY')
      """)
  long countPeopleAheadByCollegeId(
      @Param("collegeId") Long collegeId,
      @Param("token") Integer token);

    

  @Query("""
SELECT o
FROM Order o
LEFT JOIN FETCH o.items
LEFT JOIN FETCH o.student
WHERE o.student.id = :studentId
AND o.status IN ('PLACED','PREPARING','READY')
ORDER BY o.createdAt DESC
""")
List<Order> findActiveOrdersByStudentId(
        @Param("studentId") Long studentId);
}