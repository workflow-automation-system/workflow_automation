package com.workflow_automation.workflow_service.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.ai.client.generativeai.GenerativeModel;
import com.workflow_automation.workflow_service.dto.response.ConnectionResponse;
import com.workflow_automation.workflow_service.dto.response.NodeResponse;
import com.workflow_automation.workflow_service.dto.response.WorkflowResponse;
import com.workflow_automation.workflow_service.entity.enums.NodeType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class AiWorkflowService {

    @Autowired
    private GenerativeModel gemini;

    @Autowired
    private ObjectMapper mapper;

    public WorkflowResponse generateFromDescription(String description, Long userId) {
        // Create prompt
        String prompt = """
            Generate a workflow JSON for this requirement: {description}

            Available actions:
            - gmail (send_email: fields 'to', 'subject', 'body')
            - gmail_read (read_emails: fields 'query', 'maxResults')
            - slack (send_message: fields 'channel', 'message')
            - notion (create_page: fields 'database')
            - delay (wait_seconds: fields 'duration', 'unit')

            Return ONLY valid JSON with structure:
            {
                "name": "workflow name",
                "description": "description of workflow",
                "nodes": [
                    {"id": "1", "type": "trigger", "name": "Start", "config": {}},
                    {"id": "2", "type": "gmail", "name": "Send Email",
                     "config": {"to": "recipient@example.com", "subject": "...", "body": "..."}},
                    {"id": "3", "type": "gmail_read", "name": "Read Emails",
                     "config": {"query": "is:unread", "maxResults": 10}}
                ],
                "edges": [{"source": "1", "target": "2"}]
            }
            """.replace("{description}", description);

        log.info("Calling Gemini for description: {}", description);
        var response = gemini.generateContent(prompt);
        
        // Use response.getText() which is the cleanest way in Google AI SDK
        String jsonText = response.getText();
        if (jsonText == null) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, "Gemini returned an empty response");
        }
        if (jsonText.trim().startsWith("Error")) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, jsonText.trim());
        }

        // Clean up markdown code block wrapper if present
        jsonText = jsonText.replaceAll("(?s)^\\s*```(?:json)?\\s*", "")
                           .replaceAll("```\\s*$", "")
                           .trim();

        log.info("Received clean JSON from Gemini: {}", jsonText);

        try {
            JsonNode json = mapper.readTree(jsonText);

            WorkflowResponse workflowResponse = new WorkflowResponse();
            workflowResponse.setName(json.has("name") ? json.get("name").asText() : "AI Generated Workflow");
            workflowResponse.setDescription(json.has("description") ? json.get("description").asText() : description);
            workflowResponse.setUserId(userId);
            workflowResponse.setStatus("INACTIVE"); // Default to inactive until saved

            // Create nodes from JSON
            List<NodeResponse> nodeResponses = new ArrayList<>();
            Map<String, String> tempIdMap = new HashMap<>(); // Maps Gemini string ID to negative ID string
            long tempId = -1;

            if (json.has("nodes") && json.get("nodes").isArray()) {
                for (JsonNode nodeJson : json.get("nodes")) {
                    String aiId = nodeJson.has("id") ? nodeJson.get("id").asText() : String.valueOf(tempId);
                    String newIdStr = String.valueOf(tempId);
                    tempIdMap.put(aiId, newIdStr);

                    NodeResponse nodeResp = new NodeResponse();
                    nodeResp.setId(tempId);

                    String rawType = nodeJson.has("type") ? nodeJson.get("type").asText() : "gmail";
                    NodeType nodeType = resolveNodeType(rawType);
                    nodeResp.setType(nodeType.name());

                    nodeResp.setName(nodeJson.has("name") ? nodeJson.get("name").asText() : "Node");

                    JsonNode configNode = nodeJson.get("config");
                    Map<String, Object> configJson = buildConfigJson(rawType, configNode);
                    nodeResp.setConfig(configJson);

                    // Position sequentially horizontally on the canvas
                    int index = nodeResponses.size();
                    nodeResp.setPositionX(100.0 + (index * 250.0));
                    nodeResp.setPositionY(200.0);

                    nodeResponses.add(nodeResp);
                    tempId--;
                }
            }
            workflowResponse.setNodes(nodeResponses);

            // Create connections from JSON edges
            List<ConnectionResponse> connectionResponses = new ArrayList<>();
            long edgeId = -1;

            if (json.has("edges") && json.get("edges").isArray()) {
                for (JsonNode edgeJson : json.get("edges")) {
                    String source = edgeJson.has("source") ? edgeJson.get("source").asText() : "";
                    String target = edgeJson.has("target") ? edgeJson.get("target").asText() : "";

                    ConnectionResponse connResp = new ConnectionResponse();
                    connResp.setId(edgeId--);
                    connResp.setSourceNodeId(tempIdMap.getOrDefault(source, source));
                    connResp.setTargetNodeId(tempIdMap.getOrDefault(target, target));
                    connectionResponses.add(connResp);
                }
            }
            workflowResponse.setConnections(connectionResponses);

            return workflowResponse;

        } catch (Exception e) {
            log.error("Failed to parse Gemini generated JSON", e);
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate workflow. Invalid response structure from AI: " + e.getMessage(), e);
        }
    }

    private NodeType resolveNodeType(String rawType) {
        if (rawType == null) return NodeType.ACTION;
        String typeUpper = rawType.toUpperCase();
        if (typeUpper.contains("TRIGGER")) {
            return NodeType.TRIGGER;
        } else if (typeUpper.contains("CONDITION")) {
            return NodeType.CONDITION;
        }
        return NodeType.ACTION;
    }

    private Map<String, Object> buildConfigJson(String type, JsonNode configNode) {
        Map<String, Object> configMap = new HashMap<>();
        String typeLower = type != null ? type.toLowerCase() : "";

        if (typeLower.equals("gmail_read") || (typeLower.equals("gmail") && "read_emails".equals(getStringField(configNode, "action", "")))) {
            configMap.put("functionKey", "gmail_read");
            configMap.put("application", "gmail");
            configMap.put("action", "read_emails");
            configMap.put("query", getStringField(configNode, "query", "is:unread"));
            configMap.put("maxResults", getIntField(configNode, "maxResults", 10));
        } else if (typeLower.equals("gmail") || typeLower.equals("email")) {
            configMap.put("functionKey", "gmail");
            configMap.put("application", "gmail");
            configMap.put("action", "send_email");
            configMap.put("to", getStringField(configNode, "to", ""));
            configMap.put("subject", getStringField(configNode, "subject", ""));
            configMap.put("body", getStringField(configNode, "body", ""));
        } else {
            // slack, delay, etc.
            configMap.put("functionKey", typeLower);
            Map<String, Object> settings = new HashMap<>();
            if (configNode != null && configNode.isObject()) {
                configNode.fields().forEachRemaining(entry -> {
                    JsonNode val = entry.getValue();
                    if (val.isNumber()) {
                        settings.put(entry.getKey(), val.numberValue());
                    } else if (val.isBoolean()) {
                        settings.put(entry.getKey(), val.booleanValue());
                    } else {
                        settings.put(entry.getKey(), val.asText());
                    }
                });
            }
            configMap.put("settings", settings);
        }

        return configMap;
    }

    private String getStringField(JsonNode node, String fieldName, String fallback) {
        if (node != null && node.has(fieldName)) {
            return node.get(fieldName).asText();
        }
        return fallback;
    }

    private int getIntField(JsonNode node, String fieldName, int fallback) {
        if (node != null && node.has(fieldName)) {
            return node.get(fieldName).asInt();
        }
        return fallback;
    }
}
