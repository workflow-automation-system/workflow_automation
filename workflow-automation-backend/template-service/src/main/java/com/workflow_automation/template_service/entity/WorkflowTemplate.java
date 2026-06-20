package com.workflow_automation.template_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private Long organizationId;

    private String name;

    private String description;

    private String category;

    @Column(columnDefinition = "TEXT")
    private String content;

    private Boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}