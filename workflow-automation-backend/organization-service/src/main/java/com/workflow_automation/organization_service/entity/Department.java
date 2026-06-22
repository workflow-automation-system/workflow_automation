package com.workflow_automation.organization_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "organization_departments",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_organization_department_name",
                        columnNames = {"organization_id", "name"}
                )
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Organization organization;

    @Column(nullable = false)
    private String name;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
