package com.workflow_automation.template_service.controller;

import com.workflow_automation.template_service.dto.request.TemplateRequest;
import com.workflow_automation.template_service.dto.request.UseTemplateRequest;
import com.workflow_automation.template_service.dto.response.TemplateResponse;
import com.workflow_automation.template_service.dto.response.WorkflowResponse;
import com.workflow_automation.template_service.service.TemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final TemplateService templateService;

    @PostMapping
    public ResponseEntity<TemplateResponse> create(@RequestBody TemplateRequest request) {
        throw new UnsupportedOperationException("Template creation is disabled.");
    }

    @GetMapping
    public ResponseEntity<List<TemplateResponse>> getPublishedTemplates() {
        return ResponseEntity.ok(templateService.getPublishedTemplates());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TemplateResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(templateService.getById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TemplateResponse>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(templateService.getTemplatesByUser(userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TemplateResponse> update(
            @PathVariable Long id,
            @RequestBody TemplateRequest request
    ) {
        throw new UnsupportedOperationException("Template modification is disabled.");
    }

    @DeleteMapping("/{id}/organization/{organizationId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @PathVariable Long organizationId
    ) {
        throw new UnsupportedOperationException("Template deletion is disabled.");
    }

    @PostMapping("/{id}/use")
    public ResponseEntity<WorkflowResponse> useTemplate(
            @PathVariable Long id,
            @RequestBody UseTemplateRequest request
    ) {
        return ResponseEntity.ok(templateService.useTemplate(id, request));
    }

    @GetMapping("/organization/{organizationId}")
    public ResponseEntity<List<TemplateResponse>> getPublishedByOrganization(
            @PathVariable Long organizationId
    ) {
        return ResponseEntity.ok(templateService.getPublishedTemplatesByOrganization(organizationId));
    }

    @GetMapping("/organization/{organizationId}/all")
    public ResponseEntity<List<TemplateResponse>> getAllByOrganization(
            @PathVariable Long organizationId
    ) {
        return ResponseEntity.ok(templateService.getTemplatesByOrganization(organizationId));
    }
}
