package com.workflow_automation.workflow_service.dto.request;

import lombok.Data;
import java.util.Map;

@Data
public class ExecuteWorkflowRequest {
    private Map<String, Object> input;
}
