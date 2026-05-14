package com.workflow_automation.workflow_service.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class UpdateWorkflowRequest {
    private String name;
    private String description;
    private String status;
    private List<NodeRequest> nodes;
    private List<ConnectionRequest> connections;
}
