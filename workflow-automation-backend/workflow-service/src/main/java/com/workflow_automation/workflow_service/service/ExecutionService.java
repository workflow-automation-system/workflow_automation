package com.workflow_automation.workflow_service.service;

import java.util.Map;

public interface ExecutionService {
    void executeWorkflow(Long workflowId, Map<String, Object> input);
}
