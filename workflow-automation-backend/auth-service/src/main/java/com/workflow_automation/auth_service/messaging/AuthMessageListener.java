package com.workflow_automation.auth_service.messaging;

import com.workflow_automation.auth_service.config.AuthRabbitMQConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;
import org.springframework.amqp.support.AmqpHeaders;

import java.util.Map;

@Component
@Slf4j
public class AuthMessageListener {

    @RabbitListener(queues = AuthRabbitMQConfig.DEPARTMENT_EVENTS_QUEUE)
    public void handleDepartmentEvent(Map<String, Object> payload, @Header(AmqpHeaders.RECEIVED_ROUTING_KEY) String routingKey) {
        try {
            Long organizationId = ((Number) payload.get("organizationId")).longValue();

            if ("organization.department.renamed".equals(routingKey)) {
                String oldName = (String) payload.get("oldName");
                String newName = (String) payload.get("newName");
                log.info("Received department renamed event in organization {}: '{}' to '{}'", organizationId, oldName, newName);
                // No local state update required in auth-service for department renames.
            } else if ("organization.department.deleted".equals(routingKey)) {
                String name = (String) payload.get("name");
                log.info("Received department deleted event in organization {}: '{}'", organizationId, name);
                // No local state update required in auth-service for department deletions.
            }
        } catch (Exception e) {
            log.error("Failed to process department event for routingKey: {}", routingKey, e);
        }
    }
}
