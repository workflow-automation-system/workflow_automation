package com.workflow_automation.auth_service.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank private String name;
    @NotBlank @Email private String email;
    @NotBlank private String organizationName;
    @NotBlank private String department;
    private String jobTitle;
    @NotBlank @Size(min = 8, message = "Password must be at least 8 characters long") private String password;
}
