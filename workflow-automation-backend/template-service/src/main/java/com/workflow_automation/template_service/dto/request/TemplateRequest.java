package com.workflow_automation.template_service.dto.request;

import lombok.Data;

@Data
public class TemplateRequest {

    private Long userId;

    private Long organizationId;

    private String name;

    private String description;

    private String category;

    private Object content;

    private Boolean active;
}