package com.workflow_automation.auth_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "invitations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    private String name;

    private String department;

    private String jobTitle;

    @Column(name = "organization_id", nullable = false)
    private Long organizationId;

    @Column(name = "invited_by_user_id")
    private Long invitedByUserId;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(unique = true, nullable = false)
    private String token;

    private LocalDateTime expiresAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MemberStatus status;

    @Column(name = "accepted_user_id")
    private Long acceptedUserId;

    private LocalDateTime createdAt;

    private LocalDateTime acceptedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (role == null) {
            role = Role.USER;
        }
        if (status == null) {
            status = MemberStatus.PENDING;
        }
    }
}
