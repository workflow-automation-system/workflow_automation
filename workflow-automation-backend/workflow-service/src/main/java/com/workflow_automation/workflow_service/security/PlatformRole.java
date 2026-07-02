package com.workflow_automation.workflow_service.security;

public enum PlatformRole {
    ADMIN,
    USER;

    public static PlatformRole from(String rawRole) {
        if (rawRole == null || rawRole.isBlank()) {
            return USER;
        }

        try {
            return PlatformRole.valueOf(rawRole.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            return USER;
        }
    }
}
