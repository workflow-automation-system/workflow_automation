package com.workflow_automation.workflow_service.service.impl;

import com.workflow_automation.workflow_service.config.NotionOAuthProperties;
import com.workflow_automation.workflow_service.entity.UserIntegration;
import com.workflow_automation.workflow_service.repository.UserIntegrationRepository;
import com.workflow_automation.workflow_service.service.NotionOAuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotionOAuthServiceImpl implements NotionOAuthService {

    private static final String PROVIDER_NOTION = "notion";
    private static final String NOTION_AUTH_URL = "https://api.notion.com/v1/oauth/authorize";
    private static final String NOTION_TOKEN_URL = "https://api.notion.com/v1/oauth/token";

    private final NotionOAuthProperties properties;
    private final UserIntegrationRepository userIntegrationRepository;

    @Override
    public String buildAuthorizationUrl(Long userId) {
        // Notion throws a validation error if the state contains only digits (e.g., "1"),
        // because its query parser incorrectly converts numeric strings to numbers.
        // Prefixing with "user_" ensures it remains a string.
        String authUrl = UriComponentsBuilder.fromUriString(NOTION_AUTH_URL)
                .queryParam("client_id", properties.getClientId())
                .queryParam("redirect_uri", properties.getRedirectUri())
                .queryParam("response_type", "code")
                .queryParam("owner", "user")
                .queryParam("state", "user_" + userId)
                .encode()
                .toUriString();
        log.info("Built Notion authorization URL: {}", authUrl);
        return authUrl;
    }

    @Override
    @SuppressWarnings("unchecked")
    public void handleCallback(String code, String state) {
        Long userId = parseUserId(state);

        String credentials = properties.getClientId() + ":" + properties.getClientSecret();
        String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

        Map<String, String> requestBody = Map.of(
                "grant_type", "authorization_code",
                "code", code,
                "redirect_uri", properties.getRedirectUri()
        );

        log.info("Exchanging code for Notion token. Redirect URI: {}", properties.getRedirectUri());

        Map<String, Object> response = RestClient.create()
                .post()
                .uri(NOTION_TOKEN_URL)
                .header("Authorization", "Basic " + encodedCredentials)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        if (response == null || response.get("access_token") == null) {
            String error = response != null ? String.valueOf(response.get("error")) : "Empty response";
            throw new IllegalStateException("Notion token exchange failed: " + error);
        }

        String accessToken = String.valueOf(response.get("access_token"));
        String workspaceName = String.valueOf(response.getOrDefault("workspace_name", "Notion Workspace"));

        LocalDateTime now = LocalDateTime.now();

        UserIntegration integration = userIntegrationRepository
                .findByUserIdAndProvider(userId, PROVIDER_NOTION)
                .orElse(UserIntegration.builder()
                        .userId(userId)
                        .provider(PROVIDER_NOTION)
                        .createdAt(now)
                        .build());

        integration.setAccessToken(accessToken);
        integration.setScope(workspaceName);
        integration.setExpiresAt(null); // Notion integration tokens do not expire by default
        integration.setUpdatedAt(now);

        userIntegrationRepository.save(integration);
        log.info("Successfully connected Notion for user {}", userId);
    }

    private Long parseUserId(String state) {
        try {
            if (state != null && state.startsWith("user_")) {
                return Long.valueOf(state.substring(5));
            }
            return Long.valueOf(state);
        } catch (NumberFormatException exception) {
            throw new IllegalStateException("Invalid Notion OAuth state");
        }
    }
}