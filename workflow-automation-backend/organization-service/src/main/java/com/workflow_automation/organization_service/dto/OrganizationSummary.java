package com.workflow_automation.organization_service.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationSummary {
    private Long id;
    private String name;
    private String domain;
    private Long memberCount;
}
