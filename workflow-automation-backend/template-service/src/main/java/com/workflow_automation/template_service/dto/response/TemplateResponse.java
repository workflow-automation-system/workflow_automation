package com.workflow_automation.template_service.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TemplateResponse {

    private Long id;

    private Long userId;

    private Long organizationId;
    
    private String name;

    private String description;

    private String category;

    private Object content;

    private Boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}