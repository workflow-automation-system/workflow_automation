package com.workflow_automation.workflow_service.service;

import com.workflow_automation.workflow_service.dto.request.CreateWorkflowRequest;
import com.workflow_automation.workflow_service.dto.request.UpdateWorkflowRequest;
import com.workflow_automation.workflow_service.dto.response.WorkflowConfigurationResponse;
import com.workflow_automation.workflow_service.dto.response.WorkflowResponse;

import java.util.List;

public interface WorkflowService {

    WorkflowResponse create(CreateWorkflowRequest request);

    List<WorkflowResponse> getAll();

    List<WorkflowResponse> getByUserId(Long userId);

    WorkflowResponse getById(Long workflowId);

    WorkflowResponse getByIdAndUserId(Long workflowId, Long userId);

    WorkflowResponse update(Long workflowId, Long userId, UpdateWorkflowRequest request);

    void delete(Long workflowId, Long userId);

    WorkflowConfigurationResponse getConfiguration();
}