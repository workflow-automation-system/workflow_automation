package com.workflow_automation.workflow_service.service.impl;

import com.workflow_automation.workflow_service.dto.request.ConnectionRequest;
import com.workflow_automation.workflow_service.dto.request.CreateWorkflowRequest;
import com.workflow_automation.workflow_service.dto.request.NodeRequest;
import com.workflow_automation.workflow_service.dto.request.UpdateWorkflowRequest;
import com.workflow_automation.workflow_service.dto.response.NodeResponse;
import com.workflow_automation.workflow_service.dto.response.WorkflowConfigurationResponse;
import com.workflow_automation.workflow_service.dto.response.WorkflowFunctionResponse;
import com.workflow_automation.workflow_service.dto.response.WorkflowResponse;
import com.workflow_automation.workflow_service.dto.response.ConnectionResponse;
import com.workflow_automation.workflow_service.entity.Connection;
import com.workflow_automation.workflow_service.entity.Execution;
import com.workflow_automation.workflow_service.entity.Node;
import com.workflow_automation.workflow_service.entity.enums.PermissionType;
import com.workflow_automation.workflow_service.entity.enums.NodeType;
import com.workflow_automation.workflow_service.entity.Workflow;
import com.workflow_automation.workflow_service.entity.enums.WorkflowStatus;
import com.workflow_automation.workflow_service.exception.WorkflowNotFoundException;
import com.workflow_automation.workflow_service.repository.ConnectionRepository;
import com.workflow_automation.workflow_service.repository.WorkflowRepository;
import com.workflow_automation.workflow_service.service.WorkflowService;
import com.workflow_automation.workflow_service.service.PermissionService;
import com.workflow_automation.workflow_service.service.WorkflowAccessService;
import com.workflow_automation.workflow_service.security.AccessContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class WorkflowServiceImpl implements WorkflowService {

    private static final List<WorkflowFunctionResponse> DEFAULT_FUNCTIONS = List.of(
            function(
                    "trigger",
                    "Trigger",
                    NodeType.TRIGGER,
                    "Start the workflow when an enterprise event occurs",
                    "Zap",
                    "#D0FFA4",
                    Map.of("label", "New Trigger", "eventType", "manual", "conditions", List.of())
            ),
            function(
                    "condition",
                    "Condition Branch",
                    NodeType.CONDITION,
                    "Route records down different branches with logical conditions",
                    "GitBranch",
                    "#E2E8F0",
                    Map.of("label", "Branch Condition", "expression", "order.total > 1000")
            ),
            function(
                    "data_mapper",
                    "Data Mapper",
                    NodeType.ACTION,
                    "Normalize source payloads to destination schemas",
                    "Table2",
                    "#E2E8F0",
                    Map.of("label", "Map Fields", "source", "payload.customer", "target", "crm.contact")
            ),
            function(
                    "error_handler",
                    "Error Handler",
                    NodeType.ACTION,
                    "Capture failures and execute retry or fallback policy",
                    "ShieldAlert",
                    "#D0FFA4",
                    Map.of("label", "Handle Errors", "policy", "retry", "retries", 3)
            ),
            function(
                    "notion",
                    "Notion",
                    NodeType.ACTION,
                    "Read and write pages or databases in Notion",
                    "BookCopy",
                    "#D0FFA4",
                    Map.of("label", "Update Notion", "action", "create_page", "database", "")
            ),
            function(
                    "google_sheets",
                    "Google Sheets",
                    NodeType.ACTION,
                    "Append rows and manage tabular data workflows",
                    "Sheet",
                    "#D0FFA4",
                    Map.of("label", "Append Row", "spreadsheetId", "", "worksheet", "Sheet1")
            ),
            function(
                    "chatgpt",
                    "ChatGPT",
                    NodeType.ACTION,
                    "Generate or classify content with secure prompts",
                    "Bot",
                    "#D0FFA4",
                    Map.of("label", "Generate Summary", "model", "gpt-5.4-mini", "prompt", "")
            ),
            function(
                    "slack",
                    "Slack",
                    NodeType.ACTION,
                    "Send channel messages and incident updates",
                    "MessageSquare",
                    "#D0FFA4",
                    Map.of("label", "Notify Channel", "channel", "#ops-alerts", "message", "")
            ),
            function(
                    "gmail",
                    "Gmail",
                    NodeType.ACTION,
                    "Send email through Gmail",
                    "Mail",
                    "#D0FFA4",
                    Map.of(
                            "application", "gmail",
                            "label", "Send Gmail",
                            "action", "send_email",
                            "to", "",
                            "subject", "",
                            "body", ""
                    )
            ),
            function(
                    "gmail_read",
                    "Read Gmail",
                    NodeType.ACTION,
                    "Read latest emails from Gmail",
                    "Mail",
                    "#D0FFA4",
                Map.of(
                        "application", "gmail",
                        "label", "Read Gmail",
                        "action", "read_emails",
                        "query", "is:unread",
                        "maxResults", 10
                )
            ),
            function(
                    "email",
                    "Email",
                    NodeType.ACTION,
                    "Send an email notification",
                    "Mail",
                    "#D0FFA4",
                    Map.of(
                            "application", "gmail",
                            "label", "Send Email",
                            "action", "send_email",
                            "to", "",
                            "subject", "",
                            "body", ""
                    )
            ),
            function(
                    "webhook",
                    "Webhook",
                    NodeType.ACTION,
                    "Call an external API or internal endpoint",
                    "Globe",
                    "#E2E8F0",
                    Map.of("label", "HTTP Request", "url", "", "method", "GET", "body", "")
            ),
            function(
                    "delay",
                    "Delay",
                    NodeType.ACTION,
                    "Pause execution before the next workflow step",
                    "Clock",
                    "#F6F5FA",
                    Map.of("label", "Wait", "duration", 5, "unit", "minutes")
            )
    );

    private final WorkflowRepository workflowRepository;
    private final ConnectionRepository connectionRepository;
    private final PermissionService permissionService;
    private final WorkflowAccessService workflowAccessService;

    @Override
    public WorkflowResponse create(CreateWorkflowRequest request, AccessContext accessContext) {
        workflowAccessService.assertCanCreate(accessContext);

        LocalDateTime now = LocalDateTime.now();
        Workflow workflow = new Workflow();
        workflow.setUserId(accessContext.getUserId());
        workflow.setOrganizationId(accessContext.getOrganizationId());
        workflow.setName(request.getName());
        workflow.setDescription(request.getDescription());
        workflow.setStatus(resolveWorkflowStatus(request.getStatus(), WorkflowStatus.ACTIVE));
        workflow.setCreatedAt(now);
        workflow.setUpdatedAt(now);
        workflow.setNodes(new ArrayList<>());

        Map<String, Node> clientNodes = applyNodes(workflow, request.getNodes());
        workflow = workflowRepository.saveAndFlush(workflow); 

        applyConnections(workflow, request.getConnections(), clientNodes);
        
        workflow = workflowRepository.save(workflow);
        permissionService.ensureOwnerPermissions(workflow);

        return toWorkflowResponse(workflow, accessContext);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowResponse> getAll(AccessContext accessContext) {
        return workflowAccessService.getAccessibleWorkflows(accessContext).stream()
                .map(workflow -> toWorkflowResponse(workflow, accessContext))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowResponse getById(Long workflowId, AccessContext accessContext) {
        Workflow workflow = workflowAccessService.getAccessibleWorkflow(workflowId, accessContext);
        return toWorkflowResponse(workflow, accessContext);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowResponse> getByUserId(Long userId, AccessContext accessContext) {
        return getAll(accessContext).stream()
                .filter(workflow -> workflow.getUserId() != null && workflow.getUserId().equals(userId))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowResponse getByIdAndUserId(Long workflowId, Long userId, AccessContext accessContext) {
        Workflow workflow = workflowAccessService.getAccessibleWorkflow(workflowId, accessContext);
        if (userId != null && !userId.equals(workflow.getUserId())) {
            throw new WorkflowNotFoundException(workflowId);
        }
        return toWorkflowResponse(workflow, accessContext);
    }

    @Override
    public WorkflowResponse update(Long workflowId, UpdateWorkflowRequest request, AccessContext accessContext) {
        Workflow workflow = workflowAccessService.getAccessibleWorkflow(workflowId, accessContext);
        workflowAccessService.assertCanEdit(workflow, accessContext);

        workflow.setName(request.getName());
        workflow.setDescription(request.getDescription());
        workflow.setStatus(resolveWorkflowStatus(request.getStatus(), workflow.getStatus()));
        workflow.setUpdatedAt(LocalDateTime.now());
        Map<String, Node> clientNodes = applyNodes(workflow, request.getNodes());
        applyConnections(workflow, request.getConnections(), clientNodes);
        workflow = workflowRepository.save(workflow);
        return toWorkflowResponse(workflow, accessContext);
    }

    @Override
    public void delete(Long workflowId, AccessContext accessContext) {
        Workflow workflow = workflowAccessService.getAccessibleWorkflow(workflowId, accessContext);
        workflowAccessService.assertCanDelete(workflow, accessContext);

        // Delete all associated permissions
        permissionService.deleteWorkflowPermissions(workflowId);

        workflowRepository.delete(workflow);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowConfigurationResponse getConfiguration() {
        WorkflowConfigurationResponse response = new WorkflowConfigurationResponse();
        response.setEntities(Arrays.stream(NodeType.values()).map(Enum::name).collect(Collectors.toList()));
        response.setFunctions(DEFAULT_FUNCTIONS);
        return response;
    }

    private Map<String, Node> applyNodes(Workflow workflow, List<NodeRequest> nodeRequests) {
        Map<String, Node> clientNodes = new LinkedHashMap<>();
        if (nodeRequests == null) return clientNodes;

        List<Node> currentNodes = workflow.getNodes();
        if (currentNodes == null) {
            currentNodes = new ArrayList<>();
            workflow.setNodes(currentNodes);
        }

        // 1. Identify which nodes to keep, update, or create
        List<Node> updatedNodes = nodeRequests.stream().map(request -> {
            Node node;
            if (request.getId() != null) {
                // Find existing node in the workflow's collection
                node = workflow.getNodes().stream()
                        .filter(n -> request.getId().equals(n.getId()))
                        .findFirst()
                        .orElse(new Node());
            } else {
                node = new Node();
            }
            
            updateNodeFromRequest(node, request, workflow);
            if (request.getClientId() != null && !request.getClientId().isBlank()) {
                clientNodes.put(request.getClientId(), node);
            }
            return node;
        }).collect(Collectors.toList());

        // 2. Update collection (remove orphans, add new ones)
        currentNodes.removeIf(n -> !updatedNodes.contains(n));
        for (Node node : updatedNodes) {
            if (!currentNodes.contains(node)) {
                currentNodes.add(node);
            }
        }

        return clientNodes;
    }

    private void updateNodeFromRequest(Node node, NodeRequest request, Workflow workflow) {
        node.setId(request.getId());
        node.setType(resolveNodeType(request.getType()));
        node.setName(request.getName());
        node.setConfig(request.getConfig());
        node.setPositionX(request.getPositionX() != null ? request.getPositionX() : 0D);
        node.setPositionY(request.getPositionY() != null ? request.getPositionY() : 0D);
        node.setWorkflow(workflow);
    }


    private WorkflowResponse toWorkflowResponse(Workflow workflow, AccessContext accessContext) {
        Set<PermissionType> permissions = workflowAccessService.resolvePermissions(workflow, accessContext);
        WorkflowResponse response = new WorkflowResponse();
        response.setId(workflow.getId());
        response.setUserId(workflow.getUserId());
        response.setOrganizationId(workflow.getOrganizationId());
        response.setName(workflow.getName());
        response.setDescription(workflow.getDescription());
        response.setStatus(workflow.getStatus() != null ? workflow.getStatus().name() : WorkflowStatus.INACTIVE.name());
        response.setNodeCount(workflow.getNodes() != null ? workflow.getNodes().size() : 0);
        response.setExecutionCount(workflow.getExecutions() != null ? workflow.getExecutions().size() : 0);
        response.setLastExecution(resolveLastExecution(workflow));
        response.setOwnedByCurrentUser(workflowAccessService.isOwner(workflow, accessContext));
        response.setCanEdit(permissions.contains(PermissionType.EDIT));
        response.setCanDelete(permissions.contains(PermissionType.EDIT));
        response.setCanExecute(permissions.contains(PermissionType.EXECUTE));
        response.setCanShare(workflowAccessService.canShare(workflow, accessContext));
        response.setReadOnly(!permissions.contains(PermissionType.EDIT));
        response.setNodes(toNodeResponses(workflow.getNodes()));
        response.setConnections(toConnectionResponses(workflow.getConnections()));
        return response;
    }

    private LocalDateTime resolveLastExecution(Workflow workflow) {
        if (workflow.getExecutions() == null || workflow.getExecutions().isEmpty()) {
            return null;
        }

        return workflow.getExecutions().stream()
                .map(Execution::getStartedAt)
                .filter(java.util.Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(null);
    }

    private List<NodeResponse> toNodeResponses(List<Node> nodes) {
        if (nodes == null || nodes.isEmpty()) {
            return new ArrayList<>();
        }

        return nodes.stream().map(this::toNodeResponse).collect(Collectors.toList());
    }

    private NodeResponse toNodeResponse(Node node) {
        NodeResponse response = new NodeResponse();
        response.setId(node.getId());
        response.setType(node.getType() != null ? node.getType().name() : NodeType.ACTION.name());
        response.setName(node.getName());
        response.setConfig(node.getConfig());
        response.setPositionX(node.getPositionX());
        response.setPositionY(node.getPositionY());
        return response;
    }
    private List<ConnectionResponse> toConnectionResponses(List<Connection> connections) {

        if (connections == null || connections.isEmpty()) {
            return new ArrayList<>();
        }

        return connections.stream()
                .map(this::toConnectionResponse)
                .collect(Collectors.toList());
    }

    private ConnectionResponse toConnectionResponse(Connection connection) {

        ConnectionResponse response = new ConnectionResponse();

        response.setId(connection.getId());

        response.setSourceNodeId(
            connection.getSourceNode() != null
                    ? String.valueOf(connection.getSourceNode().getId())
                    : null
        );

        response.setTargetNodeId(
                connection.getTargetNode() != null
                        ? String.valueOf(connection.getTargetNode().getId())
                        : null
        );

        return response;
    }

    private WorkflowStatus resolveWorkflowStatus(String rawStatus, WorkflowStatus fallback) {
        if (rawStatus == null || rawStatus.trim().isEmpty()) {
            return fallback != null ? fallback : WorkflowStatus.INACTIVE;
        }
        try {
            return WorkflowStatus.valueOf(rawStatus.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            return fallback != null ? fallback : WorkflowStatus.INACTIVE;
        }
    }

    private NodeType resolveNodeType(String rawType) {
        String normalized = rawType == null ? "" : rawType.trim().toUpperCase();
        if (normalized.isEmpty()) {
            return NodeType.ACTION;
        }

        try {
            return NodeType.valueOf(normalized);
        } catch (IllegalArgumentException ignored) {
            if (normalized.contains("TRIGGER")) {
                return NodeType.TRIGGER;
            }
            if (normalized.contains("CONDITION")) {
                return NodeType.CONDITION;
            }
            return NodeType.ACTION;
        }
    }

    private static WorkflowFunctionResponse function(
            String key,
            String label,
            NodeType entity,
            String description,
            String icon,
            String color,
            Map<String, Object> defaultData
    ) {
        Map<String, Object> defaults = new LinkedHashMap<>(defaultData);
        return WorkflowFunctionResponse.builder()
                .key(key)
                .label(label)
                .entity(entity.name())
                .description(description)
                .icon(icon)
                .color(color)
                .defaultData(defaults)
                .build();
    }

    private void applyConnections(
            Workflow workflow,
            List<ConnectionRequest> connectionRequests,
            Map<String, Node> clientNodes
    ) {
        // 1. Delete old connections for this workflow first
        connectionRepository.deleteByWorkflow(workflow);
        
        if (workflow.getConnections() != null) {
            workflow.getConnections().clear();
        }

        if (connectionRequests == null || connectionRequests.isEmpty()) return;

        // 2. Create and SAVE the new connections directly
        List<Connection> newConnections = connectionRequests.stream()
                .map(req -> toConnection(workflow, req, clientNodes))
                .filter(connection -> connection != null)
                .collect(Collectors.toList());

        // 3. Save them to the DB immediately
        connectionRepository.saveAll(newConnections);
        
        // 4. Link them back to the workflow object in memory
        if (workflow.getConnections() == null) {
        workflow.setConnections(new ArrayList<>());
        }
        workflow.getConnections().clear();
        workflow.getConnections().addAll(newConnections); 
    }

    // Helper to find a node within the workflow object
    private Node findNodeInWorkflow(
            Workflow workflow,
            Long nodeId,
            String clientId,
            Map<String, Node> clientNodes
    ) {
        if (nodeId != null) {
            return workflow.getNodes().stream()
                    .filter(n -> nodeId.equals(n.getId()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Node not found in workflow: " + nodeId));
        }

        if (clientId != null && !clientId.isBlank() && clientNodes != null && clientNodes.containsKey(clientId)) {
            return clientNodes.get(clientId);
        }

        throw new RuntimeException("Node not found in workflow for client id: " + clientId);
    }

    private Connection toConnection(
            Workflow workflow,
            ConnectionRequest request,
            Map<String, Node> clientNodes
    ) {
        try {
            Node source = findNodeInWorkflow(
                    workflow,
                    request.getSourceNodeId(),
                    request.getSourceClientId(),
                    clientNodes
            );
            Node target = findNodeInWorkflow(
                    workflow,
                    request.getTargetNodeId(),
                    request.getTargetClientId(),
                    clientNodes
            );

            return Connection.builder()
                    .sourceNode(source)
                    .targetNode(target)
                    .workflow(workflow)
                    .build();
        } catch (RuntimeException exception) {
            log.warn(
                    "Skipping invalid workflow connection. sourceNodeId={}, targetNodeId={}, sourceClientId={}, targetClientId={}",
                    request.getSourceNodeId(),
                    request.getTargetNodeId(),
                    request.getSourceClientId(),
                    request.getTargetClientId(),
                    exception
            );
            return null;
        }
    }
    


}
