package com.workflow_automation.template_service.dto.request;

import lombok.Data;

@Data
public class UseTemplateRequest {

    private Long userId;

    private Long organizationId;
    
    private String name;
}