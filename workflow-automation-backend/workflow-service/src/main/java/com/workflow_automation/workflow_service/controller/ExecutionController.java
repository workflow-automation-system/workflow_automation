package com.workflow_automation.workflow_service.controller;

import com.workflow_automation.workflow_service.dto.request.ExecuteWorkflowRequest;
import com.workflow_automation.workflow_service.entity.Execution;
import com.workflow_automation.workflow_service.entity.ExecutionStep;
import com.workflow_automation.workflow_service.entity.Workflow;
import com.workflow_automation.workflow_service.repository.ExecutionRepository;
import com.workflow_automation.workflow_service.repository.ExecutionStepRepository;
import com.workflow_automation.workflow_service.security.AccessContext;
import com.workflow_automation.workflow_service.service.ExecutionService;
import com.workflow_automation.workflow_service.service.WorkflowAccessService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ExecutionController {

    private final ExecutionService executionService;
    private final ExecutionRepository executionRepository;
    private final ExecutionStepRepository executionStepRepository;
    private final WorkflowAccessService workflowAccessService;

    @PostMapping("/api/workflows/{workflowId}/execute")
    public ResponseEntity<Map<String, Object>> execute(
            @PathVariable Long workflowId,
            @RequestBody ExecuteWorkflowRequest request,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role,
            HttpServletRequest httpRequest
    ) {
        executionService.queueWorkflow(
                workflowId,
                accessContext(userId, organizationId, role, httpRequest),
                request.getInput()
        );

        return ResponseEntity.accepted().body(Map.of(
                "message", "Workflow execution queued successfully",
                "workflowId", workflowId,
                "status", "QUEUED"
        ));
    }

    @GetMapping("/api/executions/workflow/{workflowId}")
    public ResponseEntity<List<Map<String, Object>>> getByWorkflow(
            @PathVariable Long workflowId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role
    ) {
        AccessContext accessContext = AccessContext.of(userId, organizationId, role);
        Workflow workflow = workflowAccessService.getAccessibleWorkflow(workflowId, accessContext);

        List<Map<String, Object>> executions = executionRepository.findByWorkflowIdOrderByStartedAtDesc(workflow.getId())
                .stream()
                .map(this::toExecutionResponse)
                .toList();
        return ResponseEntity.ok(executions);
    }

    @GetMapping("/api/executions/{executionId}/steps")
    public ResponseEntity<List<Map<String, Object>>> getSteps(
            @PathVariable Long executionId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-Organization-Id") Long organizationId,
            @RequestHeader("X-Role") String role
    ) {
        AccessContext accessContext = AccessContext.of(userId, organizationId, role);
        Execution execution = executionRepository.findById(executionId)
                .orElseThrow(() -> new IllegalArgumentException("Execution not found"));

        workflowAccessService.getAccessibleWorkflow(execution.getWorkflow().getId(), accessContext);

        List<Map<String, Object>> steps = executionStepRepository.findByExecutionIdOrderByExecutedAtAsc(executionId)
                .stream()
                .map(this::toStepResponse)
                .toList();
        return ResponseEntity.ok(steps);
    }

    private Map<String, Object> toExecutionResponse(Execution execution) {
        return Map.of(
                "id", execution.getId(),
                "status", execution.getStatus() != null ? execution.getStatus().name() : "UNKNOWN",
                "startedAt", execution.getStartedAt(),
                "finishedAt", execution.getFinishedAt() != null ? execution.getFinishedAt() : ""
        );
    }

    private Map<String, Object> toStepResponse(ExecutionStep step) {
        return Map.of(
                "id", step.getId(),
                "nodeId", step.getNodeId() != null ? step.getNodeId() : "",
                "nodeName", step.getNodeName() != null ? step.getNodeName() : "Node",
                "status", step.getStatus() != null ? step.getStatus() : "UNKNOWN",
                "executedAt", step.getExecutedAt(),
                "logMessage", step.getLogMessage() != null ? step.getLogMessage() : ""
        );
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
