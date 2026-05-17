package com.workflow_automation.workflow_service.controller;

import com.workflow_automation.workflow_service.dto.request.CreateWorkflowRequest;
import com.workflow_automation.workflow_service.dto.request.NodeRequest;
import com.workflow_automation.workflow_service.dto.request.UpdateWorkflowRequest;
import com.workflow_automation.workflow_service.dto.response.WorkflowConfigurationResponse;
import com.workflow_automation.workflow_service.dto.response.NodeResponse;
import com.workflow_automation.workflow_service.dto.response.WorkflowResponse;
import com.workflow_automation.workflow_service.service.NodeService;
import com.workflow_automation.workflow_service.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workflows")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowService workflowService;
    private final NodeService nodeService;

    @PostMapping
    public ResponseEntity<WorkflowResponse> create(@RequestBody CreateWorkflowRequest request) {
        return ResponseEntity.ok(workflowService.create(request));
    }

    @GetMapping("/configuration")
    public ResponseEntity<WorkflowConfigurationResponse> getConfiguration() {
        return ResponseEntity.ok(workflowService.getConfiguration());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<WorkflowResponse>> getByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(workflowService.getByUserId(userId));
    }

    @GetMapping("/{workflowId:\\d+}/user/{userId:\\d+}")
    public ResponseEntity<WorkflowResponse> getByIdAndUserId(
            @PathVariable Long workflowId,
            @PathVariable Long userId
    ) {
        return ResponseEntity.ok(workflowService.getByIdAndUserId(workflowId, userId));
    }

    @PutMapping("/{workflowId:\\d+}/user/{userId:\\d+}")
    public ResponseEntity<WorkflowResponse> update(
            @PathVariable Long workflowId,
            @PathVariable Long userId,
            @RequestBody UpdateWorkflowRequest request
    ) {
        return ResponseEntity.ok(workflowService.update(workflowId, userId, request));
    }

    @DeleteMapping("/{workflowId:\\d+}/user/{userId:\\d+}")
    public ResponseEntity<Void> delete(
            @PathVariable Long workflowId,
            @PathVariable Long userId
    ) {
        workflowService.delete(workflowId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{workflowId:\\d+}/nodes")
    public ResponseEntity<NodeResponse> addNode(
            @PathVariable Long workflowId,
            @RequestBody NodeRequest request
    ) {
        return ResponseEntity.ok(nodeService.addNode(workflowId, request));
    }

    @PutMapping("/{workflowId:\\d+}/nodes/{nodeId:\\d+}")
    public ResponseEntity<NodeResponse> updateNode(
            @PathVariable Long workflowId,
            @PathVariable Long nodeId,
            @RequestBody NodeRequest request
    ) {
        return ResponseEntity.ok(nodeService.updateNode(workflowId, nodeId, request));
    }

    @DeleteMapping("/{workflowId:\\d+}/nodes/{nodeId:\\d+}")
    public ResponseEntity<Void> deleteNode(
            @PathVariable Long workflowId,
            @PathVariable Long nodeId
    ) {
        nodeService.deleteNode(workflowId, nodeId);
        return ResponseEntity.noContent().build();
    }
}