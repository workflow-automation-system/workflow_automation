package com.workflow_automation.audit_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRequest {
    private Long organizationId;
    private Long userId; // NULL si notification globale
    private String type;
    private String message;
}
