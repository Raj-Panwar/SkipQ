package com.skipq.backend.service;

import com.skipq.backend.entity.Notification;
import com.skipq.backend.entity.Order;
import com.skipq.backend.entity.Product;
import com.skipq.backend.repository.NotificationRepository;
import com.skipq.backend.security.AppUserPrincipal;

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
    private final AdminService adminService;

    public NotificationService(
            NotificationRepository notificationRepository,
            AdminService adminService) {

        this.notificationRepository = notificationRepository;
        this.adminService = adminService;
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
                message);

        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyNewOrder(Order order) {

        String message = "New order received. Token #" + order.getTokenNumber();

        Notification notification = new Notification(
                order.getCollege(),
                order,
                "NEW_ORDER",
                message);

        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyOrderCancelled(Order order) {
 

        String message = order.getStudent().getFullName()
                + " cancelled Token #"
                + order.getTokenNumber();

        Notification notification = new Notification(

                order.getCollege(),
                order,
                "ORDER_CANCELLED",
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
    public void markAsRead(Long notificationId,
                       AppUserPrincipal principal) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + notificationId));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(Long studentId) {
        notificationRepository.markAllAsReadForStudent(studentId);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotificationsForCollege(Long collegeId) {

        return notificationRepository
                .findByCollege_IdAndStudentIsNullOrderByCreatedAtDesc(collegeId)
                .stream()
                .map(notification -> new NotificationResponse(
                        notification.getId(),
                        notification.getOrder() != null ? notification.getOrder().getId() : null,
                        notification.getOrder() != null ? notification.getOrder().getTokenNumber() : null,
                        notification.getType(),
                        notification.getMessage(),
                        notification.isRead(),
                        notification.getCreatedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCountForCollege(Long collegeId) {
        return notificationRepository.countByCollege_IdAndStudentIsNullAndReadFalse(collegeId);
    }

    @Transactional(readOnly = true)
    public long getUnreadCountForAdmin(Long adminId) {

        Long collegeId = adminService
                .getAdminById(adminId)
                .getCollege()
                .getId();

        return getUnreadCountForCollege(collegeId);
    }

    @Transactional
    public void markAllAsReadForCollege(Long collegeId) {
        notificationRepository.markAllAsReadForCollege(collegeId);
    }

    @Transactional
    public void markAllAsReadForAdmin(Long adminId) {

        Long collegeId = adminService
                .getAdminById(adminId)
                .getCollege()
                .getId();

        markAllAsReadForCollege(collegeId);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotificationsForAdmin(Long adminId) {

        Long collegeId = adminService
                .getAdminById(adminId)
                .getCollege()
                .getId();

        return getNotificationsForCollege(collegeId);
    }

    @Transactional
    public void notifyLowStock(Product product) {

        Notification notification = new Notification(

                product.getCollege(),
                null,
                "LOW_STOCK",
                product.getName() + " is running low (" + product.getStock() + " left)."

        );

        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyOutOfStock(Product product) {

        Notification notification = new Notification(

                product.getCollege(),
                null,
                "OUT_OF_STOCK",
                product.getName() + " is out of stock."

        );

        notificationRepository.save(notification);
    }
}
