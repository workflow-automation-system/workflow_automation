package com.workflow_automation.workflow_service.dto.response;

import lombok.Data;

@Data
public class ConnectionResponse {

    private Long id;
    private String sourceNodeId;
    private String targetNodeId;
}