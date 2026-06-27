package com.workflow_automation.audit_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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


    private LocalDateTime timestamp;

    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> metadata;
}
