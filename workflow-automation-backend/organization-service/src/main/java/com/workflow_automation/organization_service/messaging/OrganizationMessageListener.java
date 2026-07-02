package com.workflow_automation.organization_service.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow_automation.organization_service.config.OrganizationRabbitMQConfig;
import com.workflow_automation.organization_service.dto.OrganizationMemberSyncRequest;
import com.workflow_automation.organization_service.service.OrganizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;
import org.springframework.amqp.support.AmqpHeaders;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrganizationMessageListener {

    private final OrganizationService organizationService;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = OrganizationRabbitMQConfig.MEMBER_EVENTS_QUEUE)
    public void handleMemberEvent(Map<String, Object> payload, @Header(AmqpHeaders.RECEIVED_ROUTING_KEY) String routingKey) {
        try {
            Long organizationId = ((Number) payload.get("organizationId")).longValue();

            if ("organization.member.sync".equals(routingKey)) {
                Map<String, Object> requestMap = (Map<String, Object>) payload.get("request");
                OrganizationMemberSyncRequest request = objectMapper.convertValue(requestMap, OrganizationMemberSyncRequest.class);
                organizationService.syncMember(organizationId, request);
                log.info("Successfully synced member {} for organization {}", request.getUserId(), organizationId);

            } else if ("organization.member.remove".equals(routingKey)) {
                Long userId = ((Number) payload.get("userId")).longValue();
                organizationService.removeMember(organizationId, userId);
                log.info("Successfully removed member {} from organization {}", userId, organizationId);
            }
        } catch (Exception e) {
            log.error("Failed to process member event for routingKey: {}", routingKey, e);
        }
    }
}
