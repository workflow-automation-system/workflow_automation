package com.workflow_automation.organization_service.controller;

import com.workflow_automation.organization_service.dto.*;
import com.workflow_automation.organization_service.service.OrganizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
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

    @GetMapping("/internal/{id}/departments/exists")
    public ResponseEntity<Boolean> departmentExists(
            @PathVariable Long id,
            @RequestParam String name
    ) {
        return ResponseEntity.ok(organizationService.departmentExists(id, name));
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

    @GetMapping("/internal/{id}/members")
    public ResponseEntity<?> internalMembers(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(organizationService.getMembers(id));
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

    // ================= INVITATIONS =================

    @GetMapping("/internal/invitations/token")
    public ResponseEntity<?> getMemberByToken(@RequestParam String token) {
        return ResponseEntity.ok(organizationService.getMemberByToken(token));
    }

    @PostMapping("/internal/invitations/accept")
    public ResponseEntity<?> acceptInvitation(@Valid @RequestBody OrganizationAcceptInviteRequest request) {
        return ResponseEntity.ok(organizationService.acceptInvitation(
                request.getToken(),
                request.getUserId(),
                request.getEmail(),
                request.getName()
        ));
    }

    @PostMapping("/internal/{id}/invitations")
    public ResponseEntity<?> createInvitation(
            @PathVariable Long id,
            @Valid @RequestBody OrganizationInviteRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(organizationService.inviteMember(
                id,
                request.getEmail(),
                request.getName(),
                request.getRole(),
                request.getDepartment(),
                request.getJobTitle(),
                request.getInvitedByUserId()
        ));
    }

    @GetMapping("/internal/{id}/invitations")
    public ResponseEntity<?> listPendingInvitations(@PathVariable Long id) {
        return ResponseEntity.ok(organizationService.listPendingInvitations(id));
    }

    @DeleteMapping("/internal/{id}/invitations/{inviteId}")
    public ResponseEntity<Void> cancelInvitation(
            @PathVariable Long id,
            @PathVariable Long inviteId
    ) {
        organizationService.cancelInvitation(id, inviteId);
        return ResponseEntity.noContent().build();
    }

    // ================= DEPARTMENTS =================

    @GetMapping("/{id}/departments")
    public ResponseEntity<List<DepartmentResponse>> listDepartments(
            @PathVariable Long id,
            @RequestHeader("X-Organization-Id") Long currentOrganizationId
    ) {
        requireOrganizationAccess(id, currentOrganizationId);
        return ResponseEntity.ok(organizationService.listDepartmentDetails(id));
    }

    @PostMapping("/{id}/departments")
    public ResponseEntity<DepartmentResponse> createDepartment(
            @PathVariable Long id,
            @RequestHeader("X-Organization-Id") Long currentOrganizationId,
            @RequestHeader("X-Role") String currentRole,
            @Valid @RequestBody DepartmentRequest request
    ) {
        requireAdminAccess(id, currentOrganizationId, currentRole);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(organizationService.createDepartment(id, request.getName()));
    }

    @PatchMapping("/{id}/departments/{departmentId}")
    public ResponseEntity<DepartmentResponse> renameDepartment(
            @PathVariable Long id,
            @PathVariable Long departmentId,
            @RequestHeader("X-Organization-Id") Long currentOrganizationId,
            @RequestHeader("X-Role") String currentRole,
            @Valid @RequestBody DepartmentRenameRequest request
    ) {
        requireAdminAccess(id, currentOrganizationId, currentRole);
        String currentName = organizationService.getDepartmentNameById(id, departmentId);
        return ResponseEntity.ok(organizationService.renameDepartment(id, currentName, request.getNewName()));
    }

    @DeleteMapping("/{id}/departments/{departmentId}")
    public ResponseEntity<Void> deleteDepartment(
            @PathVariable Long id,
            @PathVariable Long departmentId,
            @RequestHeader("X-Organization-Id") Long currentOrganizationId,
            @RequestHeader("X-Role") String currentRole
    ) {
        requireAdminAccess(id, currentOrganizationId, currentRole);
        String name = organizationService.getDepartmentNameById(id, departmentId);
        organizationService.deleteDepartment(id, name);
        return ResponseEntity.noContent().build();
    }
}


