package com.workflow_automation.template_service.service;

import com.workflow_automation.template_service.dto.request.TemplateRequest;
import com.workflow_automation.template_service.dto.request.UseTemplateRequest;
import com.workflow_automation.template_service.dto.response.TemplateResponse;
import com.workflow_automation.template_service.dto.response.WorkflowResponse;

import java.util.List;

public interface TemplateService {

    TemplateResponse create(TemplateRequest request);

    List<TemplateResponse> getPublishedTemplates();

    List<TemplateResponse> getTemplatesByUser(Long userId);

    TemplateResponse getById(Long id);

    TemplateResponse update(Long id, TemplateRequest request);

    void delete(Long id);

    WorkflowResponse useTemplate(Long id, UseTemplateRequest request);

    List<TemplateResponse> getPublishedTemplatesByOrganization(Long organizationId);

    List<TemplateResponse> getTemplatesByOrganization(Long organizationId);
    void delete(Long id, Long organizationId);
}