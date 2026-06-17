package com.workflow_automation.workflow_service.service;

import com.workflow_automation.workflow_service.dto.request.CreateWorkflowRequest;
import com.workflow_automation.workflow_service.dto.request.UpdateWorkflowRequest;
import com.workflow_automation.workflow_service.dto.response.WorkflowConfigurationResponse;
import com.workflow_automation.workflow_service.dto.response.WorkflowResponse;
import com.workflow_automation.workflow_service.security.AccessContext;

import java.util.List;

public interface WorkflowService {

    WorkflowResponse create(CreateWorkflowRequest request, AccessContext accessContext);

    List<WorkflowResponse> getAll(AccessContext accessContext);

    List<WorkflowResponse> getByUserId(Long userId, AccessContext accessContext);

    WorkflowResponse getById(Long workflowId, AccessContext accessContext);

    WorkflowResponse getByIdAndUserId(Long workflowId, Long userId, AccessContext accessContext);

    WorkflowResponse update(Long workflowId, UpdateWorkflowRequest request, AccessContext accessContext);

    void delete(Long workflowId, AccessContext accessContext);

    WorkflowConfigurationResponse getConfiguration();
}
