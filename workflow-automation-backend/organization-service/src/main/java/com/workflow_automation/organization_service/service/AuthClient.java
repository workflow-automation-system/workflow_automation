package com.workflow_automation.organization_service.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
public class AuthClient {

    private final RabbitTemplate rabbitTemplate;

    public AuthClient(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void renameDepartment(Long organizationId, String oldName, String newName) {
        try {
            rabbitTemplate.convertAndSend("organization.exchange", "organization.department.renamed", Map.of(
                    "organizationId", organizationId,
                    "oldName", oldName,
                    "newName", newName
            ));
        } catch (Exception e) {
            log.warn("Failed to propagate department rename via RabbitMQ: {}", e.getMessage());
        }
    }

    public void deleteDepartment(Long organizationId, String name) {
        try {
            rabbitTemplate.convertAndSend("organization.exchange", "organization.department.deleted", Map.of(
                    "organizationId", organizationId,
                    "name", name
            ));
        } catch (Exception e) {
            log.warn("Failed to propagate department delete via RabbitMQ: {}", e.getMessage());
        }
    }
}
