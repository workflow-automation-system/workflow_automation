package com.workflow_automation.workflow_service.entity;

import com.workflow_automation.workflow_service.entity.enums.WorkflowStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
@SQLDelete(sql = "UPDATE workflow SET deleted = true WHERE id=?")
@Where(clause = "deleted=false")
public class Workflow {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    private Long organizationId;
    private String name;

    private String description;

    @Enumerated(EnumType.STRING)
    private WorkflowStatus status;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean deleted = false;

    @OneToMany(mappedBy = "workflow", cascade = CascadeType.ALL,orphanRemoval = true)
    private List<Node> nodes;

    @OneToMany(mappedBy = "workflow", cascade = CascadeType.ALL,orphanRemoval = true)
    private List<Execution> executions;

     @OneToMany(mappedBy = "workflow", cascade = CascadeType.ALL,orphanRemoval = true)
    private List<Connection> connections;

    @OneToMany(mappedBy = "workflow", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WorkflowPermission> permissions;
}

