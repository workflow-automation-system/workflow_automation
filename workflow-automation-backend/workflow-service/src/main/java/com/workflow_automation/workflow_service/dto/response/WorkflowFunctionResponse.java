package com.workflow_automation.workflow_service.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class WorkflowFunctionResponse {
    private String key;
    private String label;
    private String entity;
    private String description;
    private String icon;
    private String color;
    private Map<String, Object> defaultData;
}
