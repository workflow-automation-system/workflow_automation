package com.workflow_automation.organization_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationMemberSyncRequest {
    @NotNull
    private Long userId;
    @NotBlank
    private String name;
    @NotBlank
    private String email;
    @NotBlank
    private String role;
    private String department;
    private String jobTitle;
    private String status;
}
