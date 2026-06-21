package com.workflow_automation.audit_service.service;

import com.workflow_automation.audit_service.dto.AuditLogRequest;
import com.workflow_automation.audit_service.entity.AuditLog;

import java.util.List;

public interface AuditService {
    AuditLog record(AuditLogRequest request);
    List<AuditLog> findByOrganization(Long organizationId);
}
