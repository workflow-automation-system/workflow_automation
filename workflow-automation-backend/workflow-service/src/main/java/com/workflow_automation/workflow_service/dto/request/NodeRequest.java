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
}
