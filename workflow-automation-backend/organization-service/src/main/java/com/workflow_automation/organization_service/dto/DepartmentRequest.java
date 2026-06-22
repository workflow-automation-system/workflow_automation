package com.workflow_automation.organization_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DepartmentRequest {

    @NotBlank
    private String name;
}
