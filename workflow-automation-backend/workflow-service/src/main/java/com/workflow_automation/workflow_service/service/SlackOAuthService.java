package com.workflow_automation.workflow_service.service;

public interface SlackOAuthService {
    String buildAuthorizationUrl(Long userId);
    void handleCallback(String code, String state);
}