package com.workflow_automation.workflow_service.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class WorkflowConfigurationResponse {
    private List<String> entities;
    private List<WorkflowFunctionResponse> functions;
}
