package com.workflow_automation.organization_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DepartmentRenameRequest {

    @NotBlank
    private String newName;
}
