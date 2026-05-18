package com.workflow_automation.auth_service.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private Long id;
    private String token;
    private String email;
    private String name;
    private String department;
    private String jobTitle;
    private String role;
    private OrganizationSummary organization;
}
