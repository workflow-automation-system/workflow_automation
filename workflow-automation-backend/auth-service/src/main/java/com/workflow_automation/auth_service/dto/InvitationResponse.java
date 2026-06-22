package com.workflow_automation.auth_service.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class InvitationResponse {

    private Long id;
    private String type;
    private Long userId;
    private String email;
    private String name;
    private String role;
    private String department;
    private String jobTitle;
    private String status;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}
