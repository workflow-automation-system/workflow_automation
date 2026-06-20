package com.workflow_automation.template_service.dto.request;

import lombok.Data;

@Data
public class ConnectionRequest {

    private Long sourceNodeId;

    private Long targetNodeId;

    private String sourceClientId;

    private String targetClientId;
}