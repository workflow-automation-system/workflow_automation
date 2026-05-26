package com.workflow_automation.workflow_service.service.impl;

import com.workflow_automation.workflow_service.entity.Connection;
import com.workflow_automation.workflow_service.entity.Execution;
import com.workflow_automation.workflow_service.entity.ExecutionStep;
import com.workflow_automation.workflow_service.entity.Node;
import com.workflow_automation.workflow_service.entity.Workflow;
import com.workflow_automation.workflow_service.entity.enums.ExecutionStatus;
import com.workflow_automation.workflow_service.entity.enums.NodeType;
import com.workflow_automation.workflow_service.repository.ExecutionRepository;
import com.workflow_automation.workflow_service.repository.ExecutionStepRepository;
import com.workflow_automation.workflow_service.service.ExecutionService;
import com.workflow_automation.workflow_service.service.WorkflowAccessService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.workflow_automation.workflow_service.integration.ApplicationActionHandler;
import com.workflow_automation.workflow_service.integration.ApplicationActionRegistry;
import com.workflow_automation.workflow_service.security.AccessContext;


import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExecutionServiceImpl implements ExecutionService {

    private static final Pattern VARIABLE_PATTERN = Pattern.compile("\\{\\{\\s*([a-zA-Z0-9_.-]+)\\s*}}");

    private final ExecutionRepository executionRepository;
    private final ExecutionStepRepository executionStepRepository;
    private final ApplicationActionRegistry actionRegistry;
    private final ObjectMapper objectMapper;
    private final WorkflowAccessService workflowAccessService;

    @Override
    @Transactional
    public void executeWorkflow(Long workflowId, AccessContext accessContext, Map<String, Object> input) {
        Workflow workflow = workflowAccessService.getAccessibleWorkflow(workflowId, accessContext);
        workflowAccessService.assertCanExecute(workflow, accessContext);

        Execution execution = Execution.builder()
                .workflow(workflow)
                .status(ExecutionStatus.RUNNING)
                .startedAt(LocalDateTime.now())
                .build();
        execution = executionRepository.save(execution);

        try {
            log.info("Starting execution for workflow: {} (ID: {})", workflow.getName(), workflowId);
            
            Node triggerNode = workflow.getNodes().stream()
                    .filter(n -> n.getType() == NodeType.TRIGGER)
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("No TRIGGER node found in workflow"));

            // Initialize context with input
            Map<String, Object> context = new HashMap<>(input != null ? input : new HashMap<>());
            context.put("userId", accessContext.getUserId());
            context.put("organizationId", accessContext.getOrganizationId());
            
            processNode(triggerNode, context, execution);

            execution.setStatus(ExecutionStatus.COMPLETED);
            execution.setFinishedAt(LocalDateTime.now());
            log.info("Execution completed successfully for workflow ID: {}", workflowId);
        } catch (Exception e) {
            log.error("Execution failed for workflow ID: {}", workflowId, e);
            execution.setStatus(ExecutionStatus.FAILED);
            execution.setFinishedAt(LocalDateTime.now());
        } finally {
            executionRepository.save(execution);
        }
    }

    private void processNode(Node node, Map<String, Object> context, Execution execution) {
        log.info("Processing node: {} (Type: {})", node.getName(), node.getType());
        
        // Basic node execution logic
        switch (node.getType()) {
            case TRIGGER:
                log.info("Triggering workflow with context: {}", context);
                saveStep(execution, node, "COMPLETED", "Trigger executed with context keys: " + context.keySet());
                break;
            case ACTION:
                executeActionNode(node, context, execution);
                break;
            case CONDITION:
                // For now, let's just log it. Branching logic can be added later.
                log.info("Condition node reached: {}", node.getName());
                saveStep(execution, node, "COMPLETED", "Condition reached");
                break;
        }

        // Follow outgoing connections
        if (node.getOutgoingConnections() != null) {
            for (Connection connection : node.getOutgoingConnections()) {
                processNode(connection.getTargetNode(), context, execution);
            }
        }
    }

    private void executeActionNode(Node node, Map<String, Object> context, Execution execution) {
        Map<String, Object> config = normalizeActionConfig(parseConfig(node.getConfig()), context);
        String applicationKey = resolveApplicationKey(node, config);

        log.info("Executing application action '{}' for node '{}' with config: {}",
                applicationKey, node.getName(), config);

        if (!actionRegistry.hasHandler(applicationKey)) {
            log.warn("No application handler found for '{}'. Falling back to log handler.", applicationKey);
            applicationKey = "log";
        }

        ApplicationActionHandler handler = actionRegistry.getHandler(applicationKey);
        Map<String, Object> result = handler.handle(node, config, context);
        context.put(node.getName() + "_result", result);
        saveStep(execution, node, "COMPLETED", toJson(result));
    }

    private Map<String, Object> parseConfig(String rawConfig) {
        if (rawConfig == null || rawConfig.trim().isEmpty()) {
            return new HashMap<>();
        }

        try {
            return objectMapper.readValue(rawConfig, new TypeReference<>() {});
        } catch (Exception exception) {
            throw new IllegalArgumentException("Invalid JSON config for action node: " + rawConfig, exception);
        }
    }

    private Map<String, Object> normalizeActionConfig(Map<String, Object> rawConfig, Map<String, Object> context) {
        Map<String, Object> normalized = new HashMap<>(rawConfig);
        Object settings = rawConfig.get("settings");

        if (settings instanceof Map<?, ?> settingsMap) {
            settingsMap.forEach((key, value) -> normalized.put(String.valueOf(key), value));
        }

        if (!normalized.containsKey("application")) {
            Object functionKey = normalized.get("functionKey");
            if (functionKey != null && !String.valueOf(functionKey).isBlank()) {
                normalized.put("application", functionKey);
            }
        }

        normalized.replaceAll((key, value) -> resolveValue(value, context));
        return normalized;
    }

    private Object resolveValue(Object value, Map<String, Object> context) {
        if (!(value instanceof String text)) {
            return value;
        }

        Matcher matcher = VARIABLE_PATTERN.matcher(text);
        StringBuffer resolved = new StringBuffer();
        while (matcher.find()) {
            Object replacement = resolveContextValue(context, matcher.group(1));
            matcher.appendReplacement(
                    resolved,
                    Matcher.quoteReplacement(replacement == null ? "" : String.valueOf(replacement))
            );
        }
        matcher.appendTail(resolved);
        return resolved.toString();
    }

    private Object resolveContextValue(Map<String, Object> context, String path) {
        Object current = context;
        for (String part : path.split("\\.")) {
            if (!(current instanceof Map<?, ?> map)) {
                return null;
            }
            current = map.get(part);
        }
        return current;
    }

    private String resolveApplicationKey(Node node, Map<String, Object> config) {
        Object application = config.get("application");
        if (application == null) {
            application = config.get("app");
        }
        if (application == null) {
            application = config.get("provider");
        }
        if (application != null && !String.valueOf(application).trim().isEmpty()) {
            return String.valueOf(application);
        }

        if (node.getName() != null && !node.getName().trim().isEmpty()) {
            return node.getName();
        }

        return "log";
    }

    private void saveStep(Execution execution, Node node, String status, String logMessage) {
        executionStepRepository.save(ExecutionStep.builder()
                .execution(execution)
                .nodeId(node.getId())
                .nodeName(node.getName())
                .status(status)
                .executedAt(LocalDateTime.now())
                .logMessage(logMessage)
                .build());
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(value);
        } catch (Exception exception) {
            return String.valueOf(value);
        }
    }
}
