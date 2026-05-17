package com.workflow_automation.auth_service.dto.organization;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationResolveRequest {
    private String name;
    private String domain;
}
