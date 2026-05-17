package com.workflow_automation.organization_service.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationResponse {
    private Long id;
    private String name;
    private String domain;
    private LocalDateTime createdAt;
    private Long memberCount;
    private Long activeMemberCount;
    private Long privilegedRoleCount;
    private List<OrganizationMemberResponse> members;
}
