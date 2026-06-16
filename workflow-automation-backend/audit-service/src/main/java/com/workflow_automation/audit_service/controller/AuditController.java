package com.workflow_automation.audit_service.controller;

import com.workflow_automation.audit_service.dto.AuditLogRequest;
import com.workflow_automation.audit_service.entity.AuditLog;
import com.workflow_automation.audit_service.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    @PostMapping
    public ResponseEntity<AuditLog> record(@RequestBody AuditLogRequest request) {
        return ResponseEntity.ok(auditService.record(request));
    }

    @GetMapping("/organization/{organizationId}")
    public ResponseEntity<List<AuditLog>> byOrganization(@PathVariable Long organizationId) {
        return ResponseEntity.ok(auditService.findByOrganization(organizationId));
    }
}
