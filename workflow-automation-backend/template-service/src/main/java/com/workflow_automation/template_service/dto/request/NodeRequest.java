package com.workflow_automation.template_service.dto.request;

import lombok.Data;

@Data
public class NodeRequest {

    private String clientId;

    private Long id;

    private String type;

    private String name;

    private String config;

    private Double positionX;

    private Double positionY;
}