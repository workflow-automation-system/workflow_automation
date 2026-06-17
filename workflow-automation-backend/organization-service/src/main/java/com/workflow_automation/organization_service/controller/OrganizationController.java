package com.workflow_automation.organization_service.controller;

import com.workflow_automation.organization_service.dto.*;
import com.workflow_automation.organization_service.service.OrganizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    // ================= ORGANIZATION =================

    @PostMapping("/internal/resolve")
    public ResponseEntity<?> resolve(@Valid @RequestBody OrganizationResolveRequest request) {
        return ResponseEntity.ok(organizationService.resolveOrganization(request));
    }

    @GetMapping("/internal/{id}/summary")
    public ResponseEntity<?> summary(@PathVariable Long id) {
        return ResponseEntity.ok(organizationService.getOrganizationSummary(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(
            @PathVariable Long id,
            @RequestHeader("X-Organization-Id") Long currentOrganizationId
    ) {
        requireOrganizationAccess(id, currentOrganizationId);
        return ResponseEntity.ok(organizationService.getOrganization(id));
    }

    // ================= MEMBERS =================

    @PostMapping("/internal/{id}/members/sync")
    public ResponseEntity<?> sync(
            @PathVariable Long id,
            @Valid @RequestBody OrganizationMemberSyncRequest request
    ) {
        return ResponseEntity.ok(organizationService.syncMember(id, request));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<?> members(
            @PathVariable Long id,
            @RequestHeader("X-Organization-Id") Long currentOrganizationId
    ) {
        requireOrganizationAccess(id, currentOrganizationId);
        return ResponseEntity.ok(organizationService.getMembers(id));
    }

    @GetMapping("/internal/{id}/members/{userId}")
    public ResponseEntity<?> member(
            @PathVariable Long id,
            @PathVariable Long userId
    ) {
        return ResponseEntity.ok(organizationService.getMember(id, userId));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> deleteMember(
            @PathVariable Long id,
            @PathVariable Long userId,
            @RequestHeader("X-Organization-Id") Long currentOrganizationId,
            @RequestHeader("X-Role") String currentRole
    ) {
        requireAdminAccess(id, currentOrganizationId, currentRole);
        organizationService.removeMember(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/members/{userId}/role")
    public ResponseEntity<Void> updateRole(
            @PathVariable Long id,
            @PathVariable Long userId,
            @RequestBody @Valid UpdateRoleRequest request,
            @RequestHeader("X-Organization-Id") Long currentOrganizationId,
            @RequestHeader("X-Role") String currentRole
    ) {
        requireAdminAccess(id, currentOrganizationId, currentRole);
        organizationService.updateRole(id, userId, request.getRole());
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/internal/{id}/members/{userId}/role")
    public ResponseEntity<Void> internalUpdateRole(
            @PathVariable Long id,
            @PathVariable Long userId,
            @RequestBody @Valid UpdateRoleRequest request
    ) {
        organizationService.updateRole(id, userId, request.getRole());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/internal/{id}/members/{userId}")
    public ResponseEntity<Void> internalDeleteMember(
            @PathVariable Long id,
            @PathVariable Long userId
    ) {
        organizationService.removeMember(id, userId);
        return ResponseEntity.noContent().build();
    }

    // ================= HEALTH =================

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }

    // ================= ERROR HANDLING =================

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<?> handleNotFound(NoSuchElementException ex) {
        return ResponseEntity.status(404)
                .body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntime(RuntimeException ex) {
        return ResponseEntity.badRequest()
                .body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> handleResponseStatus(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode())
                .body(Map.of("message", ex.getReason() != null ? ex.getReason() : "Request failed"));
    }

    private void requireOrganizationAccess(Long requestedOrganizationId, Long currentOrganizationId) {
        if (currentOrganizationId == null || !requestedOrganizationId.equals(currentOrganizationId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cross-organization access is not allowed");
        }
    }

    private void requireAdminAccess(Long requestedOrganizationId, Long currentOrganizationId, String currentRole) {
        requireOrganizationAccess(requestedOrganizationId, currentOrganizationId);
        if (currentRole == null || !"ADMIN".equalsIgnoreCase(currentRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin role is required");
        }
    }
}
