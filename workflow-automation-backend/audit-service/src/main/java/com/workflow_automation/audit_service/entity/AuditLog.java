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

    @Column(length = 320)
    private String actorEmail;

    private Long organizationId;

    @Column(length = 512, nullable = false)
    private String action;

    private String entityType;
    private Long entityId;

    @Column(length = 32, nullable = false)
    private String outcome;

    @Column(length = 64)
    private String ipAddress;

    @Column(length = 512)
    private String userAgent;

    private LocalDateTime timestamp;

    @Column(columnDefinition = "TEXT")
    private String metadata;
}
