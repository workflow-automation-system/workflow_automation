package com.workflow_automation.workflow_service.dto.response;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class WorkflowResponse {
    private Long id;
    private Long userId;
    private Long organizationId;
    private String name;
    private String description;
    private String status;
    private Integer nodeCount;
    private Integer executionCount;
    private LocalDateTime lastExecution;
    private Boolean ownedByCurrentUser;
    private Boolean canEdit;
    private Boolean canDelete;
    private Boolean canExecute;
    private Boolean canShare;
    private Boolean readOnly;
    private List<NodeResponse> nodes;
    private List<ConnectionResponse> connections;

}
