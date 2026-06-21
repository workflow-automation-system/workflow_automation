package com.workflow_automation.workflow_service.service;

import com.workflow_automation.workflow_service.security.AccessContext;

import java.util.Map;

public interface ExecutionService {
    void queueWorkflow(Long workflowId, AccessContext accessContext, Map<String, Object> input);

    void executeWorkflow(Long workflowId, AccessContext accessContext, Map<String, Object> input);
}