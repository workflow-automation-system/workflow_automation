package com.workflow_automation.workflow_service.dto.response;

import lombok.Data;

@Data
public class NodeResponse {
    private Long id;
    private String type;
    private String name;
    private String config;
    private Double positionX;
    private Double positionY;
}
