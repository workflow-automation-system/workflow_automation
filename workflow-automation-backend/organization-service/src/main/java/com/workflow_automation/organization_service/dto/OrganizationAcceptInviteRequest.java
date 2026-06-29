package com.workflow_automation.organization_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrganizationAcceptInviteRequest {
    @NotBlank
    private String token;
    @NotNull
    private Long userId;
    @NotBlank
    private String email;
    private String name;
}
