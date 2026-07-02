package com.workflow_automation.audit_service.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow_automation.audit_service.dto.AuditLogRequest;
import com.workflow_automation.audit_service.entity.AuditLog;
import com.workflow_automation.audit_service.repository.AuditLogRepository;
import com.workflow_automation.audit_service.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditServiceImpl implements AuditService {

    private final AuditLogRepository repository;
    private final com.workflow_automation.audit_service.service.NotificationService notificationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public AuditLog record(AuditLogRequest request) {
        AuditLog log = AuditLog.builder()
                .userId(request.getUserId())
                .actorEmail(request.getActorEmail())
                .organizationId(request.getOrganizationId())
                .action(request.getAction())
                .entityType(request.getEntityType())
                .entityId(request.getEntityId())
                .outcome(normalizeOutcome(request.getOutcome()))
                .timestamp(LocalDateTime.now())
                .build();

        if (request.getMetadata() != null) {
            try {
                log.setMetadata(objectMapper.writeValueAsString(request.getMetadata()));
            } catch (JsonProcessingException e) {
                log.setMetadata("{}");
            }
        }

        AuditLog savedLog = repository.save(log);

        return savedLog;
    }

    @Override
    public List<AuditLog> findByOrganization(Long organizationId) {
        return repository.findByOrganizationIdOrderByTimestampDesc(organizationId);
    }

    private String normalizeOutcome(String outcome) {
        if (outcome == null || outcome.isBlank()) {
            return "SUCCESS";
        }
        return outcome.trim().toUpperCase();
    }
}
