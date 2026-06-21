package com.workflow_automation.audit_service.dto;

import lombok.Data;

import java.util.Map;

@Data
public class AuditLogRequest {
    private Long userId;
    private String actorEmail;
    private Long organizationId;
    private String action;
    private String entityType;
    private Long entityId;
    private String outcome;
    private String ipAddress;
    private String userAgent;
    private Map<String, Object> metadata;
}
