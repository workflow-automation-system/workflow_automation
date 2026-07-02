package com.workflow_automation.audit_service.service;

import com.workflow_automation.audit_service.entity.Notification;
import com.workflow_automation.audit_service.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public Notification createAndSendNotification(Long organizationId, Long userId, String type, String message) {
        Notification notification = Notification.builder()
                .organizationId(organizationId)
                .userId(userId)
                .type(type)
                .message(message)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);

        // Push via WebSocket
        if (userId != null) {
            messagingTemplate.convertAndSend("/topic/user." + userId + ".notifications", saved);
        } else {
            messagingTemplate.convertAndSend("/topic/org." + organizationId + ".notifications", saved);
        }

        return saved;
    }

    public List<Notification> getNotificationsForUserAndOrg(Long userId, Long organizationId) {
        // En pratique, on voudra mixer les notifs globales orga et spécifiques user
        // Pour faire simple ici on peut les récupérer séparément et les joindre, ou faire une query custom.
        // Faisons 2 queries pour l'instant:
        List<Notification> userNotifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<Notification> orgNotifs = notificationRepository.findByOrganizationIdAndUserIdIsNullOrderByCreatedAtDesc(organizationId);
        
        userNotifs.addAll(orgNotifs);
        userNotifs.sort((n1, n2) -> n2.getCreatedAt().compareTo(n1.getCreatedAt())); // Descending order
        return userNotifs;
    }

    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notif -> {
            notif.setRead(true);
            notificationRepository.save(notif);
        });
    }
}
