package com.workflow_automation.organization_service.dto;

public record DepartmentResponse(
        Long id,
        String name,
        long memberCount,
        long adminCount
) {
}
