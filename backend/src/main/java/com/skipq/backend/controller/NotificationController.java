package com.skipq.backend.controller;

import com.skipq.backend.dto.NotificationResponse;
import com.skipq.backend.service.NotificationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/student/{studentId}")
    public List<NotificationResponse> getNotifications(@PathVariable Long studentId) {
        return notificationService.getNotificationsForStudent(studentId);
    }

    @GetMapping("/student/{studentId}/unread-count")
    public Map<String, Long> getUnreadCount(@PathVariable Long studentId) {
        return Map.of("unreadCount", notificationService.getUnreadCount(studentId));
    }

    @PutMapping("/{id}/read")
    public Map<String, String> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return Map.of("message", "Marked as read");
    }

    @PutMapping("/student/{studentId}/read-all")
    public Map<String, String> markAllAsRead(@PathVariable Long studentId) {
        notificationService.markAllAsRead(studentId);
        return Map.of("message", "All notifications marked as read");
    }

  @GetMapping("/admin")
public List<NotificationResponse> getAdminNotifications(
        @RequestHeader("X-Admin-Id") Long adminId) {

    return notificationService.getNotificationsForAdmin(adminId);
}

    @GetMapping("/admin/unread-count")
public Map<String, Long> getAdminUnreadCount(
        @RequestHeader("X-Admin-Id") Long adminId) {

    return Map.of(
            "unreadCount",
            notificationService.getUnreadCountForAdmin(adminId)
    );
}
    @PutMapping("/admin/read-all")
public Map<String, String> markAllAdminNotificationsAsRead(
        @RequestHeader("X-Admin-Id") Long adminId) {

    notificationService.markAllAsReadForAdmin(adminId);

    return Map.of(
            "message",
            "All notifications marked as read"
    );
}
}
