package com.skipq.backend.repository;

import com.skipq.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // =========================
    // Student Notifications
    // =========================

    List<Notification> findByStudent_IdOrderByCreatedAtDesc(Long studentId);

    long countByStudent_IdAndReadFalse(Long studentId);

    @Modifying
    @Query("""
            UPDATE Notification n
            SET n.read = true
            WHERE n.student.id = :studentId
            AND n.read = false
            """)
    void markAllAsReadForStudent(@Param("studentId") Long studentId);

    // =========================
    // Admin Notifications
    // =========================

    List<Notification> findByCollege_IdAndStudentIsNullOrderByCreatedAtDesc(Long collegeId);

    long countByCollege_IdAndStudentIsNullAndReadFalse(Long collegeId);

    @Modifying
    @Query("""
            UPDATE Notification n
            SET n.read = true
            WHERE n.college.id = :collegeId
            AND n.student IS NULL
            AND n.read = false
            """)
    void markAllAsReadForCollege(@Param("collegeId") Long collegeId);
}