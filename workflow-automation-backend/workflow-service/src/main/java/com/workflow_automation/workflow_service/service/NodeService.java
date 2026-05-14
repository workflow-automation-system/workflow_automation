package com.workflow_automation.workflow_service.service;

import com.workflow_automation.workflow_service.dto.request.NodeRequest;
import com.workflow_automation.workflow_service.dto.response.NodeResponse;

public interface NodeService {

    NodeResponse addNode(Long workflowId, NodeRequest request);

    NodeResponse updateNode(Long workflowId, Long nodeId, NodeRequest request);

    void deleteNode(Long workflowId, Long nodeId);
}

