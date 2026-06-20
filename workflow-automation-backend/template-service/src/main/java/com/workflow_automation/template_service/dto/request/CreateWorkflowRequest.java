package com.workflow_automation.template_service.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class CreateWorkflowRequest {

    private Long userId;

    private String name;

    private String description;

    private String status;

    private List<NodeRequest> nodes;

    private List<ConnectionRequest> connections;
}