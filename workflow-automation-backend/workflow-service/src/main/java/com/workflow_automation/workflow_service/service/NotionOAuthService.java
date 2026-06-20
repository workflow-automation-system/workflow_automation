package com.workflow_automation.workflow_service.service;

public interface NotionOAuthService {
    String buildAuthorizationUrl(Long userId);
    void handleCallback(String code, String state);
}