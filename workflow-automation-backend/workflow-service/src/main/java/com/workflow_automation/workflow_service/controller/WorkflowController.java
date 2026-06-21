package com.workflow_automation.workflow_service.controller;

import com.workflow_automation.workflow_service.dto.request.CreateWorkflowRequest;
import com.workflow_automation.workflow_service.dto.request.GenerateWorkflowRequest;
import com.workflow_automation.workflow_service.dto.request.NodeRequest;
import com.workflow_automation.workflow_service.dto.request.UpdateWorkflowRequest;
import com.workflow_automation.workflow_service.dto.response.NodeResponse;
import com.workflow_automation.workflow_service.dto.response.WorkflowConfigurationResponse;
import com.workflow_automation.workflow_service.dto.response.WorkflowResponse;
import com.workflow_automation.workflow_service.service.AiWorkflowService;
import com.workflow_automation.workflow_service.service.NodeService;
import com.workflow_automation.workflow_service.service.WorkflowAccessService;
import com.workflow_automation.workflow_service.service.WorkflowService;
import com.workflow_automation.workflow_service.entity.Workflow;
import com.workflow_automation.workflow_service.security.AccessContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workflows")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowService workflowService;
    private final NodeService nodeService;
    private final AiWorkflowService aiWorkflowService;
    private final WorkflowAccessService workflowAccessService;

    @PostMapping("/generate-ai")
    public ResponseEntity<?> generateWorkflow(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody GenerateWorkflowRequest request
    ) {
        try {
            WorkflowResponse workflow = aiWorkflowService.generateFromDescription(
                    request.getDescription(),
                    userId
            );
            return ResponseEntity.ok(workflow);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to generate workflow: " + e.getMessage()));
        }
    }


    @PostMapping
    public ResponseEntity<WorkflowResponse> create(
            @RequestBody CreateWorkflowRequest request,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role
    ) {
        return ResponseEntity.ok(workflowService.create(request, accessContext(userId, organizationId, role)));
    }

    @GetMapping
    public ResponseEntity<List<WorkflowResponse>> getAll(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role
    ) {
        return ResponseEntity.ok(workflowService.getAll(accessContext(userId, organizationId, role)));
    }

    @GetMapping("/configuration")
    public ResponseEntity<WorkflowConfigurationResponse> getConfiguration() {
        return ResponseEntity.ok(workflowService.getConfiguration());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<WorkflowResponse>> getByUserId(
            @PathVariable Long userId,
            @RequestHeader("X-User-Id") Long currentUserId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role
    ) {
        return ResponseEntity.ok(workflowService.getByUserId(userId, accessContext(currentUserId, organizationId, role)));
    }

    @GetMapping("/{workflowId:\\d+}")
    public ResponseEntity<WorkflowResponse> getById(
            @PathVariable Long workflowId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role
    ) {
        return ResponseEntity.ok(workflowService.getById(workflowId, accessContext(userId, organizationId, role)));
    }

    @GetMapping("/{workflowId:\\d+}/user/{userId:\\d+}")
    public ResponseEntity<WorkflowResponse> getByIdAndUserId(
            @PathVariable Long workflowId,
            @PathVariable Long userId,
            @RequestHeader("X-User-Id") Long currentUserId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role
    ) {
        return ResponseEntity.ok(
                workflowService.getByIdAndUserId(workflowId, userId, accessContext(currentUserId, organizationId, role))
        );
    }

    @PutMapping("/{workflowId:\\d+}")
    public ResponseEntity<WorkflowResponse> update(
            @PathVariable Long workflowId,
            @RequestBody UpdateWorkflowRequest request,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role
    ) {
        return ResponseEntity.ok(workflowService.update(workflowId, request, accessContext(userId, organizationId, role)));
    }

    @PutMapping("/{workflowId:\\d+}/user/{userId:\\d+}")
    public ResponseEntity<WorkflowResponse> updateByUser(
            @PathVariable Long workflowId,
            @PathVariable Long userId,
            @RequestBody UpdateWorkflowRequest request,
            @RequestHeader("X-User-Id") Long currentUserId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role
    ) {
        return ResponseEntity.ok(workflowService.update(workflowId, request, accessContext(currentUserId, organizationId, role)));
    }

    @DeleteMapping("/{workflowId:\\d+}")
    public ResponseEntity<Void> delete(
            @PathVariable Long workflowId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role
    ) {
        workflowService.delete(workflowId, accessContext(userId, organizationId, role));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{workflowId:\\d+}/user/{userId:\\d+}")
    public ResponseEntity<Void> deleteByUser(
            @PathVariable Long workflowId,
            @PathVariable Long userId,
            @RequestHeader("X-User-Id") Long currentUserId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role
    ) {
        workflowService.delete(workflowId, accessContext(currentUserId, organizationId, role));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{workflowId:\\d+}/nodes")
    public ResponseEntity<NodeResponse> addNode(
            @PathVariable Long workflowId,
            @RequestBody NodeRequest request,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role
    ) {
        Workflow workflow = workflowAccessService.getAccessibleWorkflow(workflowId, accessContext(userId, organizationId, role));
        workflowAccessService.assertCanEdit(workflow, accessContext(userId, organizationId, role));
        return ResponseEntity.ok(nodeService.addNode(workflowId, request));
    }

    @PutMapping("/{workflowId:\\d+}/nodes/{nodeId:\\d+}")
    public ResponseEntity<NodeResponse> updateNode(
            @PathVariable Long workflowId,
            @PathVariable Long nodeId,
            @RequestBody NodeRequest request,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role
    ) {
        Workflow workflow = workflowAccessService.getAccessibleWorkflow(workflowId, accessContext(userId, organizationId, role));
        workflowAccessService.assertCanEdit(workflow, accessContext(userId, organizationId, role));
        return ResponseEntity.ok(nodeService.updateNode(workflowId, nodeId, request));
    }

    @DeleteMapping("/{workflowId:\\d+}/nodes/{nodeId:\\d+}")
    public ResponseEntity<Void> deleteNode(
            @PathVariable Long workflowId,
            @PathVariable Long nodeId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role
    ) {
        Workflow workflow = workflowAccessService.getAccessibleWorkflow(workflowId, accessContext(userId, organizationId, role));
        workflowAccessService.assertCanEdit(workflow, accessContext(userId, organizationId, role));
        nodeService.deleteNode(workflowId, nodeId);
        return ResponseEntity.noContent().build();
    }

    private AccessContext accessContext(Long userId, Long organizationId, String role) {
        return AccessContext.of(
                userId,
                organizationId,
                role,
                null,
                null
        );
    }
}
