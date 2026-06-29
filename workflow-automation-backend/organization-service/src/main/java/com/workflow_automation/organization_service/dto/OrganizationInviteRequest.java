package com.workflow_automation.organization_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OrganizationInviteRequest {
    @NotBlank
    @Email
    private String email;
    private String name;
    private String role;
    private String department;
    private String jobTitle;
    private Long invitedByUserId;
}
