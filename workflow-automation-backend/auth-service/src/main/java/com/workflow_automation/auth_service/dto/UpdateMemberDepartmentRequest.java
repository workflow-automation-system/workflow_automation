package com.workflow_automation.auth_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateMemberDepartmentRequest {

    @NotBlank
    private String type;

    private String department;
}
