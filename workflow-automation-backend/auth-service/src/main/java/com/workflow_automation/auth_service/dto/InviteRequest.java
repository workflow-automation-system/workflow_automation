package com.workflow_automation.auth_service.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class InviteRequest {

    @NotBlank @Email private String email;
    @NotBlank private String name;
    private String department;
    private String jobTitle;
}
