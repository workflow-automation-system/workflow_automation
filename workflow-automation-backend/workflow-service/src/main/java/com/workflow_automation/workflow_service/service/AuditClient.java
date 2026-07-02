package com.workflow_automation.workflow_service.service;

import com.workflow_automation.workflow_service.dto.audit.AuditLogRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class AuditClient {

    private final RabbitTemplate rabbitTemplate;

    public AuditClient(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void record(AuditLogRequest request) {
        try {
            rabbitTemplate.convertAndSend("audit.exchange", "audit.log.create", request);
        } catch (Exception exception) {
            log.warn("Unable to record audit log action={} entityType={} entityId={}",
                    request.getAction(), request.getEntityType(), request.getEntityId(), exception);
        }
    }

    public void sendNotification(Long organizationId, Long userId, String type, String message) {
        try {
            java.util.Map<String, Object> requestBody = new java.util.HashMap<>();
            requestBody.put("organizationId", organizationId);
            requestBody.put("userId", userId);
            requestBody.put("type", type);
            requestBody.put("message", message);

            rabbitTemplate.convertAndSend("notification.exchange", "notification.send", requestBody);
        } catch (Exception exception) {
            log.warn("Unable to send notification type={}", type, exception);
        }
    }
}
