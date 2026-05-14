package com.workflow_automation.workflow_service.controller;

import com.workflow_automation.workflow_service.dto.request.ExecuteWorkflowRequest;
import com.workflow_automation.workflow_service.entity.Execution;
import com.workflow_automation.workflow_service.entity.ExecutionStep;
import com.workflow_automation.workflow_service.repository.ExecutionRepository;
import com.workflow_automation.workflow_service.repository.ExecutionStepRepository;
import com.workflow_automation.workflow_service.service.ExecutionService;
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

    @PostMapping("/api/workflows/{workflowId}/execute")
    public ResponseEntity<Void> execute(
            @PathVariable Long workflowId,
            @RequestBody ExecuteWorkflowRequest request
    ) {
        executionService.executeWorkflow(workflowId, request.getInput());
        return ResponseEntity.accepted().build();
    }

    @GetMapping("/api/executions/workflow/{workflowId}")
    public ResponseEntity<List<Map<String, Object>>> getByWorkflow(@PathVariable Long workflowId) {
        List<Map<String, Object>> executions = executionRepository.findByWorkflowIdOrderByStartedAtDesc(workflowId)
                .stream()
                .map(this::toExecutionResponse)
                .toList();
        return ResponseEntity.ok(executions);
    }

    @GetMapping("/api/executions/{executionId}/steps")
    public ResponseEntity<List<Map<String, Object>>> getSteps(@PathVariable Long executionId) {
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
}
