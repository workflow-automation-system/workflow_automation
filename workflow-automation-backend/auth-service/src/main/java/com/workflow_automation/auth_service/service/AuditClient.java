package com.workflow_automation.auth_service.service;

import com.workflow_automation.auth_service.dto.audit.AuditLogRequest;
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
}