package com.workflow_automation.audit_service.messaging;

import com.workflow_automation.audit_service.config.AuditRabbitMQConfig;
import com.workflow_automation.audit_service.dto.AuditLogRequest;
import com.workflow_automation.audit_service.dto.NotificationRequest;
import com.workflow_automation.audit_service.service.AuditService;
import com.workflow_automation.audit_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuditMessageListener {

    private final AuditService auditService;
    private final NotificationService notificationService;

    @RabbitListener(queues = AuditRabbitMQConfig.AUDIT_QUEUE)
    public void handleAuditLog(AuditLogRequest request) {
        try {
            auditService.record(request);
        } catch (Exception e) {
            log.error("Failed to process audit log event", e);
        }
    }

    @RabbitListener(queues = AuditRabbitMQConfig.NOTIFICATION_QUEUE)
    public void handleNotification(Map<String, Object> requestBody) {
        try {
            Long organizationId = ((Number) requestBody.get("organizationId")).longValue();
            Long userId = ((Number) requestBody.get("userId")).longValue();
            String type = (String) requestBody.get("type");
            String message = (String) requestBody.get("message");

            notificationService.createAndSendNotification(organizationId, userId, type, message);
        } catch (Exception e) {
            log.error("Failed to process notification event", e);
        }
    }
}
