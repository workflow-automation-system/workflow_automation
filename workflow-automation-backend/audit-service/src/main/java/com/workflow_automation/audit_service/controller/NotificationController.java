package com.workflow_automation.audit_service.controller;

import com.workflow_automation.audit_service.dto.NotificationRequest;
import com.workflow_automation.audit_service.entity.Notification;
import com.workflow_automation.audit_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<Notification> sendNotification(@RequestBody NotificationRequest request) {
        Notification notification = notificationService.createAndSendNotification(
                request.getOrganizationId(),
                request.getUserId(),
                request.getType(),
                request.getMessage()
        );
        return ResponseEntity.ok(notification);
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(
            @RequestParam Long userId,
            @RequestParam Long organizationId) {
        
        List<Notification> notifications = notificationService.getNotificationsForUserAndOrg(userId, organizationId);
        return ResponseEntity.ok(notifications);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }
}
