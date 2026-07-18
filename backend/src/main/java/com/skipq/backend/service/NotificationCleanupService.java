package com.skipq.backend.service;

import com.skipq.backend.repository.NotificationRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Periodically deletes expired notifications so they don't pile up forever.
 * Retention windows are configurable via application.properties; the
 * cutoff timestamp for each run is computed here (not passed in as a
 * duration), and handed to the repository as an explicit LocalDateTime.
 *
 * Student and admin notifications are cleaned up with two separate,
 * explicit bulk-delete queries (see NotificationRepository) so the two
 * categories are never conflated, and every run stays scoped purely by
 * createdAt — no college is ever specifically targeted or skipped.
 */
@Service
public class NotificationCleanupService {

    private static final Logger log = LoggerFactory.getLogger(NotificationCleanupService.class);

    private final NotificationRepository notificationRepository;

    @Value("${notification.retention.student-hours:24}")
    private long studentRetentionHours;

    @Value("${notification.retention.admin-hours:1}")
    private long adminRetentionHours;

    public NotificationCleanupService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Scheduled(cron = "${notification.cleanup.cron:0 */15 * * * *}")
    @Transactional
    public void cleanupExpiredNotifications() {

        LocalDateTime studentCutoff = LocalDateTime.now().minusHours(studentRetentionHours);

        LocalDateTime adminCutoff = LocalDateTime.now().minusHours(adminRetentionHours);

        int studentDeleted = notificationRepository.deleteExpiredStudentNotifications(studentCutoff);
        int adminDeleted = notificationRepository.deleteExpiredAdminNotifications(adminCutoff);

        log.info(
                "Notification cleanup run complete — removed {} student notification(s) older than {}h, " +
                        "{} admin notification(s) older than {}h",
                studentDeleted, studentRetentionHours, adminDeleted, adminRetentionHours);
    }
}
