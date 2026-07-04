package com.workflow_automation.workflow_service.dto.request;

import lombok.Data;

import java.util.Map;

@Data
public class NodeRequest {
    private String clientId;
    private Long id;
    private String type;
    private String name;
    private Map<String, Object> config;
    private Double positionX;
    private Double positionY;

    @com.fasterxml.jackson.annotation.JsonSetter("config")
    public void setConfig(com.fasterxml.jackson.databind.JsonNode node) {
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        if (node.isTextual()) {
            try {
                this.config = mapper.readValue(node.asText(), new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
            } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                throw new IllegalArgumentException("Invalid JSON string in config", e);
            }
        } else if (node.isObject()) {
            this.config = mapper.convertValue(node, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
        } else {
            this.config = null;
        }
    }
}
