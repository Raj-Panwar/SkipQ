package com.skipq.backend.service;

import com.skipq.backend.entity.Notification;
import com.skipq.backend.entity.Order;
import com.skipq.backend.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.skipq.backend.dto.NotificationResponse;
import java.util.List;
import java.util.Set;

@Service
public class NotificationService {

    // Only these transitions generate a student notification
    private static final Set<String> NOTIFIABLE_STATUSES = Set.of("READY", "COMPLETED", "CANCELLED");

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public void notifyStatusChange(Order order, String newStatus) {

        if (order.getStudent() == null) {
            return; // guest orders have no student to notify
        }

        if (!NOTIFIABLE_STATUSES.contains(newStatus)) {
            return;
        }

        String message = buildMessage(order.getTokenNumber(), newStatus);

        Notification notification = new Notification(
        order.getStudent(),
        order,
        newStatus,
        message
);

        notificationRepository.save(notification);
    }

    private String buildMessage(Integer tokenNumber, String status) {
        return switch (status) {
            case "READY" -> "Your order (Token #" + tokenNumber + ") is ready for pickup!";
            case "COMPLETED" -> "Your order (Token #" + tokenNumber + ") has been completed. Thank you!";
            case "CANCELLED" -> "Your order (Token #" + tokenNumber + ") has been cancelled.";
            default -> "Your order (Token #" + tokenNumber + ") status changed to " + status;
        };
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotificationsForStudent(Long studentId) {

    return notificationRepository
            .findByStudent_IdOrderByCreatedAtDesc(studentId)
            .stream()
            .map(notification -> new NotificationResponse(

                    notification.getId(),
                    notification.getOrder().getId(),
                    notification.getOrder().getTokenNumber(),
                    notification.getType(),
                    notification.getMessage(),
                    notification.isRead(),
                    notification.getCreatedAt()

            ))
            .toList();
}

    @Transactional(readOnly = true)
    public long getUnreadCount(Long studentId) {
        return notificationRepository.countByStudent_IdAndReadFalse(studentId);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + notificationId));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(Long studentId) {
        notificationRepository.markAllAsReadForStudent(studentId);
    }
}
