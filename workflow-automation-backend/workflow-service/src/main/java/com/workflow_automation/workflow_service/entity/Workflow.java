package com.workflow_automation.workflow_service.entity;

import com.workflow_automation.workflow_service.entity.enums.WorkflowStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Workflow {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    private String name;

    private String description;

    @Enumerated(EnumType.STRING)
    private WorkflowStatus status;

    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "workflow", cascade = CascadeType.ALL,orphanRemoval = true)
    private List<Node> nodes;

    @OneToMany(mappedBy = "workflow", cascade = CascadeType.ALL,orphanRemoval = true)
    private List<Execution> executions;

     @OneToMany(mappedBy = "workflow", cascade = CascadeType.ALL,orphanRemoval = true)
    private List<Connection> connections;

}
