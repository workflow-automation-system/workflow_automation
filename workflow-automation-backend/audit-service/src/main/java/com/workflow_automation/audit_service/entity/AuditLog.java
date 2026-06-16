package com.workflow_automation.audit_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Long organizationId;

    @Column(length = 512, nullable = false)
    private String action;

    private String entityType;
    private Long entityId;

    private LocalDateTime timestamp;

    @Column(columnDefinition = "jsonb")
    private String metadata;
}
