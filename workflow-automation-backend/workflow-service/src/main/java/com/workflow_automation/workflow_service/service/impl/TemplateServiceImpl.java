package com.workflow_automation.workflow_service.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow_automation.workflow_service.dto.response.TemplateResponse;
import com.workflow_automation.workflow_service.entity.WorkflowTemplate;
import com.workflow_automation.workflow_service.repository.WorkflowTemplateRepository;
import com.workflow_automation.workflow_service.service.TemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TemplateServiceImpl implements TemplateService {

    private final WorkflowTemplateRepository templateRepository;
    private final ObjectMapper objectMapper;

    @Override
    public List<TemplateResponse> getPublishedTemplates() {
        return templateRepository.findByActiveTrue()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<TemplateResponse> getTemplatesByUser(Long userId) {
        return templateRepository.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public TemplateResponse getById(Long id) {
        return toResponse(findTemplate(id));
    }

    private WorkflowTemplate findTemplate(Long id) {
        return templateRepository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Template not found"));
    }

    private TemplateResponse toResponse(WorkflowTemplate template) {
        try {
            Object parsedContent = template.getContent() != null
                    ? objectMapper.readValue(template.getContent(), Object.class)
                    : null;

            return TemplateResponse.builder()
                    .id(template.getId())
                    .userId(template.getUserId())
                    .name(template.getName())
                    .description(template.getDescription())
                    .category(template.getCategory())
                    .content(parsedContent)
                    .active(template.getActive())
                    .createdAt(template.getCreatedAt())
                    .updatedAt(template.getUpdatedAt())
                    .build();
        } catch (Exception e) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, "Cannot parse template content", e);
        }
    }
}
