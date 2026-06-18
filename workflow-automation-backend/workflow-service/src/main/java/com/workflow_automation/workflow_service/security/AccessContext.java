package com.workflow_automation.workflow_service.security;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AccessContext {
    Long userId;
    Long organizationId;
    PlatformRole role;
    String ipAddress;
    String userAgent;

    public static AccessContext of(Long userId, Long organizationId, String role) {
        return AccessContext.builder()
                .userId(userId)
                .organizationId(organizationId)
                .role(PlatformRole.from(role))
                .build();
    }

    public static AccessContext of(Long userId, Long organizationId, String role, String ipAddress, String userAgent) {
        return AccessContext.builder()
                .userId(userId)
                .organizationId(organizationId)
                .role(PlatformRole.from(role))
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();
    }
}
