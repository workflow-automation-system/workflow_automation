package com.workflow_automation.workflow_service.service.impl;

import com.workflow_automation.workflow_service.dto.request.WorkflowExecutionMessage;
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
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.workflow_automation.workflow_service.integration.ApplicationActionHandler;
import com.workflow_automation.workflow_service.integration.ApplicationActionRegistry;
import com.workflow_automation.workflow_service.security.AccessContext;
import com.workflow_automation.workflow_service.service.AuditClient;
import com.workflow_automation.workflow_service.dto.audit.AuditLogRequest;


import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExecutionServiceImpl implements ExecutionService {

    private static final Pattern VARIABLE_PATTERN = Pattern.compile("\\{\\{\\s*([a-zA-Z0-9_.-]+)\\s*}}");
    private static final Pattern CONTAINS_PATTERN = Pattern.compile("^(.+?)\\s+contains\\s+['\"](.+)['\"]$", Pattern.CASE_INSENSITIVE);
    private static final Pattern COMPARISON_PATTERN = Pattern.compile("^(.+?)\\s*(==|!=|>=|<=|>|<)\\s*(.+)$");

    private final ExecutionRepository executionRepository;
    private final ExecutionStepRepository executionStepRepository;
    private final ApplicationActionRegistry actionRegistry;
    private final ObjectMapper objectMapper;
    private final WorkflowAccessService workflowAccessService;
    private final RabbitTemplate rabbitTemplate;
    private final com.workflow_automation.workflow_service.repository.UserIntegrationRepository userIntegrationRepository;
    private final AuditClient auditClient;

    @Value("${app.rabbitmq.exchange}")
    private String exchangeName;

    @Value("${app.rabbitmq.routingkey}")
    private String routingKey;

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void queueWorkflow(Long workflowId, AccessContext accessContext, Map<String, Object> input) {
        Workflow workflow = workflowAccessService.getAccessibleWorkflow(workflowId, accessContext);
        workflowAccessService.assertCanExecute(workflow, accessContext);
        validateIntegrations(workflow, accessContext.getUserId());

        try {
            auditClient.record(AuditLogRequest.builder()
                    .userId(accessContext.getUserId())
                    .actorEmail("User " + accessContext.getUserId())
                    .organizationId(accessContext.getOrganizationId())
                    .action("WORKFLOW_EXECUTED")
                    .entityType("WORKFLOW")
                    .entityId(workflowId)
                    .outcome("SUCCESS")
                    .metadata(Map.of(
                            "workflowName", workflow.getName(),
                            "reason", "Triggered by user"
                    ))
                    .build());
        } catch (Exception e) {
            log.warn("Failed to send audit log", e);
        }

        WorkflowExecutionMessage message = WorkflowExecutionMessage.builder()
                .workflowId(workflowId)
                .userId(accessContext.getUserId())
                .organizationId(accessContext.getOrganizationId())
                .role(accessContext.getRole() != null ? accessContext.getRole().name() : null)
                .ipAddress(accessContext.getIpAddress())
                .userAgent(accessContext.getUserAgent())
                .input(input)
                .build();

        rabbitTemplate.convertAndSend(exchangeName, routingKey, message);
        log.info("Workflow execution queued: workflowId={}, userId={}, organizationId={}",
                workflowId, accessContext.getUserId(), accessContext.getOrganizationId());
    }

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
        boolean conditionResult = true;

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
                conditionResult = executeConditionNode(node, context, execution);
                break;
        }

        // Follow outgoing connections
        if (node.getOutgoingConnections() != null) {
            for (Connection connection : node.getOutgoingConnections()) {
                if (node.getType() == NodeType.CONDITION) {
                    String handle = connection.getSourceHandle();
                    if (handle != null && !handle.isBlank()) {
                        // Route strictly based on handle match
                        if (conditionResult && "true".equalsIgnoreCase(handle)) {
                            processNode(connection.getTargetNode(), context, execution);
                        } else if (!conditionResult && "false".equalsIgnoreCase(handle)) {
                            processNode(connection.getTargetNode(), context, execution);
                        }
                    } else {
                        // Legacy fallback: no handle specified, follow only if true
                        if (conditionResult) {
                            processNode(connection.getTargetNode(), context, execution);
                        }
                    }
                } else {
                    // Non-condition nodes always follow outgoing connections
                    processNode(connection.getTargetNode(), context, execution);
                }
            }
        }
    }

    private void executeActionNode(Node node, Map<String, Object> context, Execution execution) {
        Map<String, Object> config = normalizeActionConfig(node.getConfig(), context);
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
        Object functionKey = config.get("functionKey");
        if (functionKey != null && !String.valueOf(functionKey).isBlank()) {
            context.put(String.valueOf(functionKey) + "_result", result);
        }
        saveStep(execution, node, "COMPLETED", toJson(result));
    }

    private boolean executeConditionNode(Node node, Map<String, Object> context, Execution execution) {
        Map<String, Object> config = normalizeActionConfig(node.getConfig(), context);
        String expression = stringValue(config.get("expression"));
        boolean matched = evaluateConditionExpression(expression, context);
        Map<String, Object> result = Map.of(
                "expression", expression,
                "matched", matched
        );

        context.put(node.getName() + "_result", result);
        saveStep(execution, node, matched ? "COMPLETED" : "SKIPPED", toJson(result));
        return matched;
    }

    private boolean evaluateConditionExpression(String expression, Map<String, Object> context) {
        if (expression == null || expression.isBlank()) {
            return false;
        }

        Matcher containsMatcher = CONTAINS_PATTERN.matcher(expression.trim());
        if (containsMatcher.matches()) {
            Object leftValue = resolveExpressionOperand(containsMatcher.group(1), context);
            String expected = containsMatcher.group(2);
            return stringValue(leftValue).toLowerCase(Locale.ROOT)
                    .contains(expected.toLowerCase(Locale.ROOT));
        }

        Matcher comparisonMatcher = COMPARISON_PATTERN.matcher(expression.trim());
        if (comparisonMatcher.matches()) {
            Object leftValue = resolveExpressionOperand(comparisonMatcher.group(1), context);
            String operator = comparisonMatcher.group(2);
            Object rightValue = resolveExpressionOperand(comparisonMatcher.group(3), context);
            return compareValues(leftValue, rightValue, operator);
        }

        Object value = resolveExpressionOperand(expression, context);
        if (value instanceof Boolean bool) {
            return bool;
        }
        return Boolean.parseBoolean(stringValue(value));
    }

    private Object resolveExpressionOperand(String rawOperand, Map<String, Object> context) {
        String operand = rawOperand == null ? "" : rawOperand.trim();
        if ((operand.startsWith("\"") && operand.endsWith("\"")) || (operand.startsWith("'") && operand.endsWith("'"))) {
            return operand.substring(1, operand.length() - 1);
        }

        Object contextValue = resolveContextValue(context, operand);
        return contextValue != null ? contextValue : operand;
    }

    private boolean compareValues(Object leftValue, Object rightValue, String operator) {
        Double leftNumber = parseDouble(leftValue);
        Double rightNumber = parseDouble(rightValue);
        if (leftNumber != null && rightNumber != null) {
            return switch (operator) {
                case "==" -> leftNumber.equals(rightNumber);
                case "!=" -> !leftNumber.equals(rightNumber);
                case ">" -> leftNumber > rightNumber;
                case "<" -> leftNumber < rightNumber;
                case ">=" -> leftNumber >= rightNumber;
                case "<=" -> leftNumber <= rightNumber;
                default -> false;
            };
        }

        String leftText = stringValue(leftValue);
        String rightText = stringValue(rightValue);
        return switch (operator) {
            case "==" -> leftText.equalsIgnoreCase(rightText);
            case "!=" -> !leftText.equalsIgnoreCase(rightText);
            default -> false;
        };
    }

    private Map<String, Object> parseConfig(Map<String, Object> rawConfig) {
        if (rawConfig == null) {
            return new HashMap<>();
        }
        return new HashMap<>(rawConfig);
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
            if (current instanceof Map<?, ?> map) {
                current = map.get(part);
            } else if (current instanceof List<?> list) {
                int index = parseListIndex(part);
                if (index < 0 || index >= list.size()) {
                    return null;
                }
                current = list.get(index);
            } else {
                return null;
            }
        }
        return current;
    }

    private int parseListIndex(String value) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException exception) {
            return -1;
        }
    }

    private Double parseDouble(Object value) {
        try {
            return Double.parseDouble(stringValue(value));
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
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

    private void validateIntegrations(Workflow workflow, Long userId) {
        java.util.Set<String> requiredProviders = new java.util.HashSet<>();
        if (workflow.getNodes() == null) return;
        for (Node node : workflow.getNodes()) {
            if (node.getType() == NodeType.ACTION || node.getType() == NodeType.TRIGGER) {
                Map<String, Object> config = parseConfig(node.getConfig());
                String provider = resolveApplicationKey(node, config);
                if (java.util.Set.of("gmail", "slack", "notion").contains(provider)) {
                    requiredProviders.add(provider);
                }
            }
        }
        for (String provider : requiredProviders) {
            if (userIntegrationRepository.findByUserIdAndProvider(userId, provider).isEmpty()) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST, 
                        "MISSING_INTEGRATION:" + provider);
            }
        }
    }
}
