package com.workflow_automation.auth_service.dto.organization;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationMemberSyncRequest {
    private Long userId;
    private String name;
    private String email;
    private String role;
    private String department;
    private String jobTitle;
    private String status;
}
