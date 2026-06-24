package com.workflow_automation.workflow_service.controller;

import com.workflow_automation.workflow_service.dto.response.TemplateResponse;
import com.workflow_automation.workflow_service.service.TemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final TemplateService templateService;

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
}
