package com.workflow_automation.workflow_service.controller;

import com.workflow_automation.workflow_service.dto.GrantPermissionRequest;
import com.workflow_automation.workflow_service.dto.WorkflowPermissionDTO;
import com.workflow_automation.workflow_service.entity.enums.PermissionType;
import com.workflow_automation.workflow_service.security.AccessContext;
import com.workflow_automation.workflow_service.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/workflows/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;

    @PostMapping("/grant")
    public ResponseEntity<WorkflowPermissionDTO> grantPermission(
            @RequestBody GrantPermissionRequest request,
            @RequestHeader("X-User-Id") Long currentUserId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role
    ) {
        WorkflowPermissionDTO permission = permissionService.grantPermission(
                request,
                AccessContext.of(currentUserId, organizationId, role)
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(permission);
    }

    @GetMapping("/{workflowId}")
    public ResponseEntity<List<WorkflowPermissionDTO>> getWorkflowPermissions(
            @PathVariable Long workflowId,
            @RequestHeader("X-User-Id") Long currentUserId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role
    ) {
        return ResponseEntity.ok(permissionService.getWorkflowPermissions(
                workflowId,
                AccessContext.of(currentUserId, organizationId, role)
        ));
    }

    @GetMapping("/{workflowId}/user/{userId}")
    public ResponseEntity<WorkflowPermissionDTO> getUserPermission(
            @PathVariable Long workflowId,
            @PathVariable Long userId,
            @RequestHeader("X-User-Id") Long currentUserId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role
    ) {
        Optional<WorkflowPermissionDTO> permission = permissionService.getUserPermission(
                workflowId,
                userId,
                AccessContext.of(currentUserId, organizationId, role)
        );
        return permission.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{workflowId}/user/{userId}/check/{permissionType}")
    public ResponseEntity<Boolean> checkPermission(
            @PathVariable Long workflowId,
            @PathVariable Long userId,
            @PathVariable PermissionType permissionType,
            @RequestHeader("X-User-Id") Long currentUserId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role
    ) {
        boolean hasPermission = permissionService.hasPermission(
                workflowId,
                userId,
                permissionType,
                AccessContext.of(currentUserId, organizationId, role)
        );
        return ResponseEntity.ok(hasPermission);
    }

    @PutMapping("/{workflowId}/user/{userId}")
    public ResponseEntity<WorkflowPermissionDTO> updatePermission(
            @PathVariable Long workflowId,
            @PathVariable Long userId,
            @RequestBody List<PermissionType> permissions,
            @RequestHeader("X-User-Id") Long currentUserId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role
    ) {
        WorkflowPermissionDTO updated = permissionService.updatePermission(
                workflowId,
                userId,
                permissions,
                AccessContext.of(currentUserId, organizationId, role)
        );
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{workflowId}/user/{userId}")
    public ResponseEntity<Void> revokePermission(
            @PathVariable Long workflowId,
            @PathVariable Long userId,
            @RequestHeader("X-User-Id") Long currentUserId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role
    ) {
        permissionService.revokePermission(
                workflowId,
                userId,
                AccessContext.of(currentUserId, organizationId, role)
        );
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/org/{organizationId}/user/{userId}/permission/{permissionType}")
    public ResponseEntity<List<Long>> getWorkflowsByPermission(
            @PathVariable Long organizationId,
            @PathVariable Long userId,
            @PathVariable PermissionType permissionType,
            @RequestHeader("X-User-Id") Long currentUserId,
            @RequestHeader("X-Organization-Id") Long currentOrganizationId,
            @RequestHeader("X-Role") String role
    ) {
        List<Long> workflowIds = permissionService.getWorkflowsByPermission(
                userId,
                organizationId,
                permissionType,
                AccessContext.of(currentUserId, currentOrganizationId, role)
        );
        return ResponseEntity.ok(workflowIds);
    }
}
