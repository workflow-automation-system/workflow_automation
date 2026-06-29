package com.workflow_automation.organization_service.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationMemberResponse {
    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String role;
    private String department;
    private String jobTitle;
    private String status;
    private Long organizationId;
}
