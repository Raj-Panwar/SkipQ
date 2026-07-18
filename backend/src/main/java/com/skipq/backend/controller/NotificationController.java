package com.skipq.backend.controller;

import com.skipq.backend.dto.NotificationResponse;
import com.skipq.backend.security.AppUserPrincipal;
import com.skipq.backend.service.NotificationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/student/me")
    public List<NotificationResponse> getNotifications(@AuthenticationPrincipal AppUserPrincipal student) {
        return notificationService.getNotificationsForStudent(student.getId());
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/student/me/unread-count")
    public Map<String, Long> getUnreadCount(@AuthenticationPrincipal AppUserPrincipal student) {
        return Map.of("unreadCount", notificationService.getUnreadCount(student.getId()));
    }

    // Shared by both the student and admin notification panels (no
    // separate admin markAsRead endpoint exists), so both roles are
    // allowed to call this route. NotificationService.markAsRead enforces
    // per-caller ownership internally (student → own notification only,
    // admin → own college's admin-facing notifications only), so this
    // shared route can't be used to touch another student's or another
    // college's notifications.
    @PreAuthorize("hasAnyRole('STUDENT','ADMIN')")
    @PutMapping("/{id}/read")
public Map<String, String> markAsRead(
        @AuthenticationPrincipal AppUserPrincipal principal,
        @PathVariable Long id) {

    notificationService.markAsRead(id, principal);

    return Map.of("message", "Marked as read");
}

    @PreAuthorize("hasRole('STUDENT')")
    @PutMapping("/student/me/read-all")
    public Map<String, String> markAllAsRead(@AuthenticationPrincipal AppUserPrincipal student) {
        notificationService.markAllAsRead(student.getId());
        return Map.of("message", "All notifications marked as read");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin")
    public List<NotificationResponse> getAdminNotifications(
            @AuthenticationPrincipal AppUserPrincipal admin) {

        return notificationService.getNotificationsForAdmin(admin.getId());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/unread-count")
    public Map<String, Long> getAdminUnreadCount(
            @AuthenticationPrincipal AppUserPrincipal admin) {

        return Map.of(
                "unreadCount",
                notificationService.getUnreadCountForAdmin(admin.getId())
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/read-all")
    public Map<String, String> markAllAdminNotificationsAsRead(
            @AuthenticationPrincipal AppUserPrincipal admin) {

        notificationService.markAllAsReadForAdmin(admin.getId());

        return Map.of(
                "message",
                "All notifications marked as read"
        );
    }
}