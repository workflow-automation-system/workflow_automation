package com.workflow_automation.auth_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String name;

    private String department;

    private String jobTitle;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(name = "organization_id")
    private Long organizationId;

    private boolean enabled = false;

    @Column(unique = true)
    private String verificationToken;

    private LocalDateTime verificationTokenExpiresAt;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.role == null) this.role = Role.USER;
        this.enabled = false;
    }
}
