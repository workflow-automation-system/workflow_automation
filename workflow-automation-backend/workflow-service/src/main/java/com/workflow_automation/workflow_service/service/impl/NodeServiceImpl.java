package com.workflow_automation.workflow_service.service.impl;

import com.workflow_automation.workflow_service.dto.request.NodeRequest;
import com.workflow_automation.workflow_service.dto.response.NodeResponse;
import com.workflow_automation.workflow_service.entity.Node;
import com.workflow_automation.workflow_service.entity.enums.NodeType;
import com.workflow_automation.workflow_service.entity.Workflow;
import com.workflow_automation.workflow_service.exception.WorkflowNotFoundException;
import com.workflow_automation.workflow_service.repository.NodeRepository;
import com.workflow_automation.workflow_service.repository.WorkflowRepository;
import com.workflow_automation.workflow_service.service.NodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NodeServiceImpl implements NodeService {

    private final WorkflowRepository workflowRepository;
    private final NodeRepository nodeRepository;

    @Override
    public NodeResponse addNode(Long workflowId, NodeRequest request) {
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new WorkflowNotFoundException(workflowId));
        Node node = new Node();
        node.setType(NodeType.valueOf(request.getType()));
        node.setName(request.getName());
        node.setConfig(request.getConfig());
        node.setPositionX(request.getPositionX());
        node.setPositionY(request.getPositionY());
        node.setWorkflow(workflow);
        node = nodeRepository.save(node);
        NodeResponse response = new NodeResponse();
        response.setId(node.getId());
        response.setType(node.getType().name());
        response.setName(node.getName());
        response.setConfig(node.getConfig());
        response.setPositionX(node.getPositionX());
        response.setPositionY(node.getPositionY());
        return response;
    }

    @Override
    public NodeResponse updateNode(Long workflowId, Long nodeId, NodeRequest request) {
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new WorkflowNotFoundException(workflowId));
        Node node = nodeRepository.findById(nodeId)
                .orElseThrow(() -> new IllegalArgumentException("Node not found: " + nodeId));
        if (node.getWorkflow() == null || !node.getWorkflow().getId().equals(workflow.getId())) {
            throw new IllegalArgumentException("Node does not belong to workflow: " + workflowId);
        }
        node.setName(request.getName());
        node.setConfig(request.getConfig());
        node.setType(NodeType.valueOf(request.getType()));
        node.setPositionX(request.getPositionX());
        node.setPositionY(request.getPositionY());
        node = nodeRepository.save(node);
        NodeResponse response = new NodeResponse();
        response.setId(node.getId());
        response.setType(node.getType().name());
        response.setName(node.getName());
        response.setConfig(node.getConfig());
        response.setPositionX(node.getPositionX());
        response.setPositionY(node.getPositionY());
        return response;
    }

    @Override
    public void deleteNode(Long workflowId, Long nodeId) {
        Node node = nodeRepository.findById(nodeId)
                .orElseThrow(() -> new IllegalArgumentException("Node not found: " + nodeId));
        if (node.getWorkflow() == null || !node.getWorkflow().getId().equals(workflowId)) {
            throw new IllegalArgumentException("Node does not belong to workflow: " + workflowId);
        }
        nodeRepository.delete(node);
    }
}
