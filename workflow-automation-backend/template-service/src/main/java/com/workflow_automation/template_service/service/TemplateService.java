package com.workflow_automation.template_service.service;

import com.workflow_automation.template_service.dto.request.UseTemplateRequest;
import com.workflow_automation.template_service.dto.response.TemplateResponse;
import com.workflow_automation.template_service.dto.response.WorkflowResponse;

import java.util.List;

public interface TemplateService {

    List<TemplateResponse> getPublishedTemplates();

    List<TemplateResponse> getTemplatesByUser(Long userId);

    TemplateResponse getById(Long id);

    WorkflowResponse useTemplate(Long id, UseTemplateRequest request);

    List<TemplateResponse> getPublishedTemplatesByOrganization(Long organizationId);

    List<TemplateResponse> getTemplatesByOrganization(Long organizationId);
}
