package com.workflow_automation.workflow_service.service;

import com.workflow_automation.workflow_service.dto.response.TemplateResponse;

import java.util.List;

public interface TemplateService {
    List<TemplateResponse> getPublishedTemplates();
    List<TemplateResponse> getTemplatesByUser(Long userId);
    TemplateResponse getById(Long id);
}
