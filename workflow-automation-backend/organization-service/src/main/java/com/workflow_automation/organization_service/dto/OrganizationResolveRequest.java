package com.workflow_automation.organization_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationResolveRequest {
    @NotBlank
    private String name;
    private String domain;
}
