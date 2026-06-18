package com.workflow_automation.workflow_service.dto.audit;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
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
