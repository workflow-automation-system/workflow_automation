package com.workflow_automation.audit_service.dto;

import lombok.Data;

import java.util.Map;

@Data
public class AuditLogRequest {
    private Long userId;
    private Long organizationId;
    private String action;
    private String entityType;
    private Long entityId;
    private Map<String, Object> metadata;
}
