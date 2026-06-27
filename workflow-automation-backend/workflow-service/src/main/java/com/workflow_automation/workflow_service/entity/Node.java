package com.workflow_automation.workflow_service.entity;

import com.workflow_automation.workflow_service.entity.enums.NodeType;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Node {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private NodeType type;

    private String name;
    @Column(columnDefinition = "TEXT")
    private String config;
    private Double positionX;
    private Double positionY;

    @ManyToOne
    @JoinColumn(name = "workflow_id")
    private Workflow workflow;

    @OneToMany(mappedBy = "sourceNode", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Connection> outgoingConnections;

    @OneToMany(mappedBy = "targetNode", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Connection> incomingConnections;
}
