package com.workflow_automation.organization_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateRoleRequest {

    @NotBlank(
            message = "Role required"
    )
    private String role;

}