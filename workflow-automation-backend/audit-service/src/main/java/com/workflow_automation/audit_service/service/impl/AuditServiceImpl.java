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
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public AuditLog record(AuditLogRequest request) {
        AuditLog log = AuditLog.builder()
                .userId(request.getUserId())
                .organizationId(request.getOrganizationId())
                .action(request.getAction())
                .entityType(request.getEntityType())
                .entityId(request.getEntityId())
                .timestamp(LocalDateTime.now())
                .build();

        if (request.getMetadata() != null) {
            try {
                log.setMetadata(objectMapper.writeValueAsString(request.getMetadata()));
            } catch (JsonProcessingException e) {
                log.setMetadata("{}");
            }
        }

        return repository.save(log);
    }

    @Override
    public List<AuditLog> findByOrganization(Long organizationId) {
        return repository.findByOrganizationIdOrderByTimestampDesc(organizationId);
    }
}
