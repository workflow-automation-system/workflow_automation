package com.workflow_automation.workflow_service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowExecutionMessage implements Serializable {
    private Long workflowId;
    private Long userId;
    private Long organizationId;
    private String role;
    private String ipAddress;
    private String userAgent;
    private Map<String, Object> input;
}