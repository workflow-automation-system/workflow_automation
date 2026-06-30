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


import java.time.LocalDateTime;
import java.util.ArrayList;
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

    @Value("${app.rabbitmq.exchange}")
    private String exchangeName;

    @Value("${app.rabbitmq.routingkey}")
    private String routingKey;

    @Override
    public void queueWorkflow(Long workflowId, AccessContext accessContext, Map<String, Object> input) {
        Workflow workflow = workflowAccessService.getAccessibleWorkflow(workflowId, accessContext);
        workflowAccessService.assertCanExecute(workflow, accessContext);

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
        boolean shouldContinue = true;
        
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
                // Check if the condition targets a list structure (e.g. messages.0)
                String expression = getConditionExpression(node);
                String listPath = detectListPathFromExpression(node, context);
                
                if (listPath != null) {
                    List<?> list = (List<?>) resolveContextValue(context, listPath);
                    log.info("Detected list for condition iteration: {} (size={})", listPath, list.size());
                    
                    int matchedCount = 0;
                    // Loop over each element in the list and branch execution
                    for (int i = 0; i < list.size(); i++) {
                        Map<String, Object> iteratedContext = new HashMap<>(context);
                        // Rewrite the specific indexed element in the local context so nodes down the branch use the correct index
                        rewriteContextForIndex(iteratedContext, listPath, i);
                        
                        boolean itemMatched = evaluateConditionForContext(node, iteratedContext);
                        if (itemMatched) {
                            matchedCount++;
                            log.info("Item at index {} matched condition. Executing branch.", i);
                            // Follow outgoing connections immediately for this iterated context
                            if (node.getOutgoingConnections() != null) {
                                for (Connection connection : node.getOutgoingConnections()) {
                                    processNode(connection.getTargetNode(), iteratedContext, execution);
                                }
                            }
                        }
                    }
                    
                    saveStep(execution, node, matchedCount > 0 ? "COMPLETED" : "SKIPPED", 
                            String.format("Condition expression '%s' matched %d/%d items in list '%s'", expression, matchedCount, list.size(), listPath));
                    // We already processed outgoing nodes inside the loop, so stop parent execution path here
                    return;
                } else {
                    shouldContinue = executeConditionNode(node, context, execution);
                }
                break;
        }

        if (!shouldContinue) {
            log.info("Condition stopped workflow branch at node '{}'", node.getName());
            return;
        }

        // Follow outgoing connections (standard non-iterated flow)
        if (node.getOutgoingConnections() != null) {
            for (Connection connection : node.getOutgoingConnections()) {
                processNode(connection.getTargetNode(), context, execution);
            }
        }
    }

    private String getConditionExpression(Node node) {
        try {
            Map<String, Object> rawConfig = parseConfig(node.getConfig());
            Object settings = rawConfig.get("settings");
            if (settings instanceof Map<?, ?> settingsMap) {
                return stringValue(settingsMap.get("expression"));
            }
            return stringValue(rawConfig.get("expression"));
        } catch (Exception e) {
            return "";
        }
    }

    private boolean evaluateConditionForContext(Node node, Map<String, Object> context) {
        Map<String, Object> config = normalizeActionConfig(parseConfig(node.getConfig()), context);
        String expression = stringValue(config.get("expression"));
        return evaluateConditionExpression(expression, context);
    }

    private String detectListPathFromExpression(Node node, Map<String, Object> context) {
        String rawExpression = getConditionExpression(node);
        log.info("[DEBUG-LOOP] Raw expression from DB config: '{}'", rawExpression);

        if (rawExpression.isBlank()) {
            return null;
        }
        
        // Find pattern like {{prefix.messages.0.subject}} or prefix.messages.0.subject
        // We look for a path segment that is followed by ".0" (or any numeric index)
        Pattern indexPattern = Pattern.compile("([a-zA-Z0-9_.-]+)\\.(\\d+)\\.([a-zA-Z0-9_.-]+)");
        Matcher matcher = indexPattern.matcher(rawExpression);
        if (matcher.find()) {
            String listPath = matcher.group(1);
            log.info("[DEBUG-LOOP] Matched regex. listPath found: '{}'", listPath);
            Object resolved = resolveContextValue(context, listPath);
            if (resolved instanceof List) {
                log.info("[DEBUG-LOOP] Successfully verified listPath '{}' is a List in context", listPath);
                return listPath;
            } else {
                log.warn("[DEBUG-LOOP] listPath '{}' is not a List. It is: {}", listPath, resolved != null ? resolved.getClass().getName() : "null");
            }
        } else {
            log.warn("[DEBUG-LOOP] Regex did not match rawExpression");
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private void rewriteContextForIndex(Map<String, Object> context, String listPath, int index) {
        // Rewrite references of "listPath.0.field" to actually use the value at listPath.get(index)
        // To make it simple, we can copy the specific item at list.get(index) and bind it to path.0
        Object listObj = resolveContextValue(context, listPath);
        if (listObj instanceof List<?> list && index < list.size()) {
            Object targetItem = list.get(index);
            
            // Navigate the nested structure in context to find where the list lives and inject a "0" key with the current item
            String[] parts = listPath.split("\\.");
            Map<String, Object> currentMap = context;
            for (int i = 0; i < parts.length; i++) {
                Object next = currentMap.get(parts[i]);
                if (i == parts.length - 1) {
                    if (next instanceof List) {
                        // We found the list. We want to mock index 0 to contain the target item!
                        // So if expression resolves `messages.0.subject`, resolving it will pick up listObj at index 0.
                        // We can modify the list references, or we can simply inject a virtual path or replace list items.
                        List<Object> mockedList = new ArrayList<>(list);
                        // Set the current loop item at index 0, so any reference to .0 in evaluateConditionExpression picks this current item!
                        mockedList.set(0, targetItem);
                        currentMap.put(parts[i], mockedList);
                    }
                } else if (next instanceof Map) {
                    Map<String, Object> newNestedMap = new HashMap<>((Map<String, Object>) next);
                    currentMap.put(parts[i], newNestedMap);
                    currentMap = newNestedMap;
                }
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
        Object functionKey = config.get("functionKey");
        if (functionKey != null && !String.valueOf(functionKey).isBlank()) {
            context.put(String.valueOf(functionKey) + "_result", result);
        }
        saveStep(execution, node, "COMPLETED", toJson(result));
    }

    private boolean executeConditionNode(Node node, Map<String, Object> context, Execution execution) {
        Map<String, Object> config = normalizeActionConfig(parseConfig(node.getConfig()), context);
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
}
