package com.workflow_automation.workflow_service.exception;

public class WorkflowNotFoundException extends RuntimeException {
    public WorkflowNotFoundException(Long id) {
        super("Workflow not found: " + id);
    }
}
