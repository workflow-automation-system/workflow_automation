package com.workflow_automation.workflow_service.service;

import com.workflow_automation.workflow_service.entity.UserIntegration;

public interface GoogleOAuthService {
    String buildAuthorizationUrl(Long userId);

    void handleCallback(String code, String state);

    UserIntegration refreshTokenIfNeeded(UserIntegration integration);
}
