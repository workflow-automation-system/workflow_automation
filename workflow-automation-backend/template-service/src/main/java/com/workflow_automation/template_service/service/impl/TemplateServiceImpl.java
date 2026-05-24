package com.workflow_automation.template_service.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow_automation.template_service.client.WorkflowClient;
import com.workflow_automation.template_service.dto.request.CreateWorkflowRequest;
import com.workflow_automation.template_service.dto.request.TemplateRequest;
import com.workflow_automation.template_service.dto.request.UseTemplateRequest;
import com.workflow_automation.template_service.dto.response.TemplateResponse;
import com.workflow_automation.template_service.dto.response.WorkflowResponse;
import com.workflow_automation.template_service.entity.WorkflowTemplate;
import com.workflow_automation.template_service.repository.WorkflowTemplateRepository;
import com.workflow_automation.template_service.service.TemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class TemplateServiceImpl implements TemplateService {

    private final WorkflowTemplateRepository templateRepository;
    private final WorkflowClient workflowClient;
    private final ObjectMapper objectMapper;

    @Override
    public TemplateResponse create(TemplateRequest request) {
        try {
            LocalDateTime now = LocalDateTime.now();

            WorkflowTemplate template = WorkflowTemplate.builder()
                    .userId(request.getUserId())
                    .organizationId(request.getOrganizationId())
                    .name(request.getName())
                    .description(request.getDescription())
                    .category(request.getCategory())
                    .content(objectMapper.writeValueAsString(request.getContent()))
                    .active(request.getActive() != null ? request.getActive() : true)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();

            return toResponse(templateRepository.save(template));
        } catch (Exception e) {
            throw new RuntimeException("Cannot create template", e);
        }
    }

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

    @Override
    public TemplateResponse update(Long id, TemplateRequest request) {
        try {
            WorkflowTemplate template = findTemplate(id);

            template.setName(request.getName());
            if (request.getOrganizationId() != null) {
                template.setOrganizationId(request.getOrganizationId());
            }
            template.setDescription(request.getDescription());
            template.setCategory(request.getCategory());
            template.setContent(objectMapper.writeValueAsString(request.getContent()));
            template.setActive(request.getActive() != null ? request.getActive() : template.getActive());
            template.setUpdatedAt(LocalDateTime.now());

            return toResponse(templateRepository.save(template));
        } catch (Exception e) {
            throw new RuntimeException("Cannot update template", e);
        }
    }

    @Override
    public void delete(Long id) {
        templateRepository.delete(findTemplate(id));
    }

    @Override
    public WorkflowResponse useTemplate(Long id, UseTemplateRequest request) {
        try {
            WorkflowTemplate template = findTemplate(id);

            if (request.getOrganizationId() != null
                    && !Objects.equals(template.getOrganizationId(), request.getOrganizationId())) {
                throw new RuntimeException("Template not found");
            }

            if (!Boolean.TRUE.equals(template.getActive())) {
                throw new RuntimeException("Template is not active");
            }

            CreateWorkflowRequest workflowRequest =
                    objectMapper.readValue(template.getContent(), CreateWorkflowRequest.class);

            workflowRequest.setUserId(request.getUserId());
            workflowRequest.setName(
                    request.getName() != null && !request.getName().isBlank()
                            ? request.getName()
                            : template.getName()
            );
            workflowRequest.setDescription(template.getDescription());
            workflowRequest.setStatus("ACTIVE");

            return workflowClient.createWorkflow(workflowRequest);
        } catch (Exception e) {
            throw new RuntimeException("Cannot use template", e);
        }
    }
    @Override
    public List<TemplateResponse> getPublishedTemplatesByOrganization(Long organizationId) {
        return templateRepository.findByOrganizationIdAndActiveTrue(organizationId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<TemplateResponse> getTemplatesByOrganization(Long organizationId) {
        return templateRepository.findByOrganizationId(organizationId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public void delete(Long id, Long organizationId) {
        WorkflowTemplate template = templateRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        templateRepository.delete(template);
    }

    private WorkflowTemplate findTemplate(Long id) {
        return templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found"));
    }

    private TemplateResponse toResponse(WorkflowTemplate template) {
        try {
            Object parsedContent = template.getContent() != null
                    ? objectMapper.readValue(template.getContent(), Object.class)
                    : null;

            return TemplateResponse.builder()
                    .id(template.getId())
                    .userId(template.getUserId())
                    .organizationId(template.getOrganizationId())
                    .name(template.getName())
                    .description(template.getDescription())
                    .category(template.getCategory())
                    .content(parsedContent)
                    .active(template.getActive())
                    .createdAt(template.getCreatedAt())
                    .updatedAt(template.getUpdatedAt())
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Cannot parse template content", e);
        }
    }
}
