package com.workflow_automation.workflow_service.dto;

import com.workflow_automation.workflow_service.entity.enums.PermissionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GrantPermissionRequest {
    private Long workflowId;
    private Long userId;
    private Set<PermissionType> permissions;
}
