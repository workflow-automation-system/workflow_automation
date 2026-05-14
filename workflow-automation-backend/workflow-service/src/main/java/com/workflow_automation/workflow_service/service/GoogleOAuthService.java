package com.workflow_automation.workflow_service.service;

public interface GoogleOAuthService {
    String buildAuthorizationUrl(Long userId);

    void handleCallback(String code, String state);
}
