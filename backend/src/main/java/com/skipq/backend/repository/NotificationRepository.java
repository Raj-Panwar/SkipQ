package com.skipq.backend.repository;

import com.skipq.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // =========================
    // Student Notifications
    // =========================

    List<Notification> findByStudent_IdOrderByCreatedAtDesc(Long studentId);

    long countByStudent_IdAndReadFalse(Long studentId);

    // Ownership-scoped lookup used by markAsRead — guarantees a student can
    // only ever fetch (and therefore mutate) their own notification. Returns
    // empty if the id doesn't exist OR belongs to a different student.
    Optional<Notification> findByIdAndStudent_Id(Long id, Long studentId);

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

    // Ownership-scoped lookup used by markAsRead for admins — the notification
    // must belong to the admin's college AND be an admin-facing notification
    // (student IS NULL) so an admin can't reach into a student's notification
    // by id even within their own college.
    Optional<Notification> findByIdAndCollege_IdAndStudentIsNull(Long id, Long collegeId);

    @Modifying
    @Query("""
            UPDATE Notification n
            SET n.read = true
            WHERE n.college.id = :collegeId
            AND n.student IS NULL
            AND n.read = false
            """)
    void markAllAsReadForCollege(@Param("collegeId") Long collegeId);

    // =========================
    // Scheduled Cleanup
    // =========================
    // Cutoff is computed by the caller (NotificationCleanupService) from
    // configurable retention properties, not hardcoded here. Each query
    // explicitly distinguishes student vs. admin notifications via the
    // student-null discriminator already used elsewhere in this repository,
    // and only ever touches rows older than the given cutoff — so isolation
    // across colleges is preserved automatically by the createdAt filter,
    // and student rows are never mixed with admin rows.

    @Modifying
    @Query("""
            DELETE FROM Notification n
            WHERE n.student IS NOT NULL
            AND n.createdAt < :cutoff
            """)
    int deleteExpiredStudentNotifications(@Param("cutoff") LocalDateTime cutoff);

    @Modifying
    @Query("""
            DELETE FROM Notification n
            WHERE n.student IS NULL
            AND n.createdAt < :cutoff
            """)
    int deleteExpiredAdminNotifications(@Param("cutoff") LocalDateTime cutoff);
}