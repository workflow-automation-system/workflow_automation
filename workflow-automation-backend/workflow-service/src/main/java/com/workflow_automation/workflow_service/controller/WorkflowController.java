package com.workflow_automation.workflow_service.controller;

import com.workflow_automation.workflow_service.dto.request.CreateWorkflowRequest;
import com.workflow_automation.workflow_service.dto.request.NodeRequest;
import com.workflow_automation.workflow_service.dto.request.UpdateWorkflowRequest;
import com.workflow_automation.workflow_service.dto.response.NodeResponse;
import com.workflow_automation.workflow_service.dto.response.WorkflowConfigurationResponse;
import com.workflow_automation.workflow_service.dto.response.WorkflowResponse;
import com.workflow_automation.workflow_service.entity.Workflow;
import com.workflow_automation.workflow_service.security.AccessContext;
import com.workflow_automation.workflow_service.service.NodeService;
import com.workflow_automation.workflow_service.service.WorkflowAccessService;
import com.workflow_automation.workflow_service.service.WorkflowService;
import jakarta.servlet.http.HttpServletRequest;
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
    private final WorkflowAccessService workflowAccessService;

    @PostMapping
    public ResponseEntity<WorkflowResponse> create(
            @RequestBody CreateWorkflowRequest request,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(workflowService.create(request, accessContext(userId, organizationId, role, httpRequest)));
    }

    @GetMapping
    public ResponseEntity<List<WorkflowResponse>> getAll(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(workflowService.getAll(accessContext(userId, organizationId, role, httpRequest)));
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
            @RequestHeader("X-Role") String role,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(workflowService.getByUserId(userId, accessContext(currentUserId, organizationId, role, httpRequest)));
    }

    @GetMapping("/{workflowId:\\d+}")
    public ResponseEntity<WorkflowResponse> getById(
            @PathVariable Long workflowId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(workflowService.getById(workflowId, accessContext(userId, organizationId, role, httpRequest)));
    }

    @GetMapping("/{workflowId:\\d+}/user/{userId:\\d+}")
    public ResponseEntity<WorkflowResponse> getByIdAndUserId(
            @PathVariable Long workflowId,
            @PathVariable Long userId,
            @RequestHeader("X-User-Id") Long currentUserId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(
                workflowService.getByIdAndUserId(workflowId, userId, accessContext(currentUserId, organizationId, role, httpRequest))
        );
    }

    @PutMapping("/{workflowId:\\d+}")
    public ResponseEntity<WorkflowResponse> update(
            @PathVariable Long workflowId,
            @RequestBody UpdateWorkflowRequest request,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(workflowService.update(workflowId, request, accessContext(userId, organizationId, role, httpRequest)));
    }

    @PutMapping("/{workflowId:\\d+}/user/{userId:\\d+}")
    public ResponseEntity<WorkflowResponse> updateByUser(
            @PathVariable Long workflowId,
            @PathVariable Long userId,
            @RequestBody UpdateWorkflowRequest request,
            @RequestHeader("X-User-Id") Long currentUserId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(workflowService.update(workflowId, request, accessContext(currentUserId, organizationId, role, httpRequest)));
    }

    @DeleteMapping("/{workflowId:\\d+}")
    public ResponseEntity<Void> delete(
            @PathVariable Long workflowId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role,
            HttpServletRequest httpRequest
    ) {
        workflowService.delete(workflowId, accessContext(userId, organizationId, role, httpRequest));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{workflowId:\\d+}/user/{userId:\\d+}")
    public ResponseEntity<Void> deleteByUser(
            @PathVariable Long workflowId,
            @PathVariable Long userId,
            @RequestHeader("X-User-Id") Long currentUserId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role,
            HttpServletRequest httpRequest
    ) {
        workflowService.delete(workflowId, accessContext(currentUserId, organizationId, role, httpRequest));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{workflowId:\\d+}/nodes")
    public ResponseEntity<NodeResponse> addNode(
            @PathVariable Long workflowId,
            @RequestBody NodeRequest request,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role,
            HttpServletRequest httpRequest
    ) {
        Workflow workflow = workflowAccessService.getAccessibleWorkflow(workflowId, accessContext(userId, organizationId, role, httpRequest));
        workflowAccessService.assertCanEdit(workflow, accessContext(userId, organizationId, role, httpRequest));
        return ResponseEntity.ok(nodeService.addNode(workflowId, request));
    }

    @PutMapping("/{workflowId:\\d+}/nodes/{nodeId:\\d+}")
    public ResponseEntity<NodeResponse> updateNode(
            @PathVariable Long workflowId,
            @PathVariable Long nodeId,
            @RequestBody NodeRequest request,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role,
            HttpServletRequest httpRequest
    ) {
        Workflow workflow = workflowAccessService.getAccessibleWorkflow(workflowId, accessContext(userId, organizationId, role, httpRequest));
        workflowAccessService.assertCanEdit(workflow, accessContext(userId, organizationId, role, httpRequest));
        return ResponseEntity.ok(nodeService.updateNode(workflowId, nodeId, request));
    }

    @DeleteMapping("/{workflowId:\\d+}/nodes/{nodeId:\\d+}")
    public ResponseEntity<Void> deleteNode(
            @PathVariable Long workflowId,
            @PathVariable Long nodeId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role,
            HttpServletRequest httpRequest
    ) {
        Workflow workflow = workflowAccessService.getAccessibleWorkflow(workflowId, accessContext(userId, organizationId, role, httpRequest));
        workflowAccessService.assertCanEdit(workflow, accessContext(userId, organizationId, role, httpRequest));
        nodeService.deleteNode(workflowId, nodeId);
        return ResponseEntity.noContent().build();
    }

    private AccessContext accessContext(Long userId, Long organizationId, String role) {
        return AccessContext.of(userId, organizationId, role);
    }

    private AccessContext accessContext(Long userId, Long organizationId, String role, HttpServletRequest request) {
        return AccessContext.of(userId, organizationId, role, clientIp(request), request.getHeader("User-Agent"));
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
