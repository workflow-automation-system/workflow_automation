package com.workflow_automation.workflow_service.dto.organization;

import lombok.Data;

@Data
public class OrganizationMemberResponse {
    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String role;
    private String department;
    private String jobTitle;
    private String status;
}
