package com.workflow_automation.workflow_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GenerateWorkflowRequest {
    @NotBlank
    private String description;
}
