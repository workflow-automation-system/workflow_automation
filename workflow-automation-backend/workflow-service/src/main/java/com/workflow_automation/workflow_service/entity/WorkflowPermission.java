package com.workflow_automation.workflow_service.entity;

import com.workflow_automation.workflow_service.entity.enums.PermissionType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "workflow_permissions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"workflow_id", "user_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowPermission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_id", nullable = false)
    private Workflow workflow;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "organization_id", nullable = false)
    private Long organizationId;

    @ElementCollection(targetClass = PermissionType.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "workflow_permission_types", joinColumns = @JoinColumn(name = "workflow_permission_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "permission_type")
    @Builder.Default
    private Set<PermissionType> permissions = new HashSet<>();

    @Column(name = "granted_by")
    private Long grantedBy;

    @Column(name = "granted_at")
    private LocalDateTime grantedAt;

    @PrePersist
    protected void onCreate() {
        grantedAt = LocalDateTime.now();
    }
}
