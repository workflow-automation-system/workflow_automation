package com.workflow_automation.workflow_service.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow_automation.workflow_service.entity.Node;
import com.workflow_automation.workflow_service.entity.Workflow;
import com.workflow_automation.workflow_service.entity.enums.NodeType;
import com.workflow_automation.workflow_service.entity.enums.WorkflowStatus;
import com.workflow_automation.workflow_service.repository.WorkflowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class WorkflowInitializer {

    private final WorkflowRepository workflowRepository;
    private final WorkflowSchedulingService schedulingService;
    private final ObjectMapper objectMapper;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initializeSchedules() {
        log.info("Initializing scheduled workflows...");
        List<Workflow> activeWorkflows = workflowRepository.findAll().stream()
                .filter(w -> w.getStatus() == WorkflowStatus.ACTIVE)
                .toList();

        for (Workflow workflow : activeWorkflows) {
            scheduleIfRequired(workflow);
        }
        log.info("Finished initializing scheduled workflows.");
    }

    public void scheduleIfRequired(Workflow workflow) {
        if (workflow.getStatus() != WorkflowStatus.ACTIVE) {
            schedulingService.cancelSchedule(workflow.getId());
            return;
        }

        Node triggerNode = workflow.getNodes().stream()
                .filter(n -> n.getType() == NodeType.TRIGGER)
                .findFirst()
                .orElse(null);

        if (triggerNode == null || triggerNode.getConfig() == null) {
            schedulingService.cancelSchedule(workflow.getId());
            return;
        }

        try {
            JsonNode configNode = objectMapper.valueToTree(triggerNode.getConfig());
            JsonNode settingsNode = configNode.path("settings");
            String eventType = settingsNode.path("eventType").asText(configNode.path("eventType").asText(""));
            String cronExpression = settingsNode.path("cronExpression").asText(configNode.path("cronExpression").asText(""));

            if ("schedule".equals(eventType) && !cronExpression.isBlank()) {
                schedulingService.scheduleWorkflow(workflow, cronExpression);
            } else {
                schedulingService.cancelSchedule(workflow.getId());
            }
        } catch (Exception e) {
            log.warn("Failed to parse trigger config for workflow ID: {}", workflow.getId(), e);
            schedulingService.cancelSchedule(workflow.getId());
        }
    }
}
