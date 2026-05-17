package com.workflow_automation.workflow_service.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class WorkflowResponse {
    private Long id;
    private Long userId;
    private String name;
    private String description;
    private String status;
    private List<NodeResponse> nodes;
    private List<ConnectionResponse> connections;

}
