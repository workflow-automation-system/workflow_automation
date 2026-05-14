package com.workflow_automation.workflow_service.entity;

import com.workflow_automation.workflow_service.entity.enums.ExecutionStatus;
import com.workflow_automation.workflow_service.entity.enums.WorkflowStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Execution {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private ExecutionStatus status;


    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;

    @ManyToOne
    @JoinColumn(name = "workflow_id")
    private Workflow workflow;

}
