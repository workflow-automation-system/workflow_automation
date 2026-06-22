package com.workflow_automation.auth_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DepartmentRenameRequest {

    @NotNull
    private Long organizationId;

    @NotBlank
    private String oldName;

    @NotBlank
    private String newName;
}
