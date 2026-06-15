package com.workflow_automation.auth_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AcceptInvitationRequest {

    @NotBlank
    private String token;

    @NotBlank
    @Size(min = 6)
    private String password;
}
