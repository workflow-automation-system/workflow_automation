package com.workflow_automation.organization_service.controller;

import com.workflow_automation.organization_service.dto.*;
import com.workflow_automation.organization_service.service.OrganizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    @PostMapping("/internal/resolve")
    public ResponseEntity<?> resolveOrganization(@Valid @RequestBody OrganizationResolveRequest request) {
        try {
            return ResponseEntity.ok(organizationService.resolveOrganization(request));
        } catch (RuntimeException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        }
    }

    @GetMapping("/internal/{organizationId}/summary")
    public ResponseEntity<?> getOrganizationSummary(@PathVariable Long organizationId) {
        try {
            return ResponseEntity.ok(organizationService.getOrganizationSummary(organizationId));
        } catch (NoSuchElementException exception) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", exception.getMessage()));
        } catch (RuntimeException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        }
    }

    @PostMapping("/internal/{organizationId}/members/sync")
    public ResponseEntity<?> syncMember(@PathVariable Long organizationId, @Valid @RequestBody OrganizationMemberSyncRequest request) {
        try {
            return ResponseEntity.ok(organizationService.syncMember(organizationId, request));
        } catch (RuntimeException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        }
    }

    @GetMapping("/{organizationId}")
    public ResponseEntity<?> getOrganization(@PathVariable Long organizationId) {
        try {
            return ResponseEntity.ok(organizationService.getOrganization(organizationId));
        } catch (NoSuchElementException exception) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", exception.getMessage()));
        } catch (RuntimeException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "organization-service UP"));
    }

    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationExceptions(org.springframework.web.bind.MethodArgumentNotValidException ex) {
        String errorMessage = ex.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        if (errorMessage == null || errorMessage.isEmpty()) {
            errorMessage = "Validation failed for request.";
        }
        return ResponseEntity.badRequest().body(Map.of("message", errorMessage));
    }
}
