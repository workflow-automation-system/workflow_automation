package com.workflow_automation.template_service.dto.response;

import lombok.Data;

@Data
public class WorkflowResponse {

    private Long id;

    private Long userId;

    private String name;

    private String description;

    private String status;
}