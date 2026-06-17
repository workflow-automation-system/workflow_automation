package com.workflow_automation.workflow_service.service.impl;

import com.workflow_automation.workflow_service.config.SlackOAuthProperties;
import com.workflow_automation.workflow_service.entity.UserIntegration;
import com.workflow_automation.workflow_service.repository.UserIntegrationRepository;
import com.workflow_automation.workflow_service.service.SlackOAuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SlackOAuthServiceImpl implements SlackOAuthService {

    private static final String PROVIDER_SLACK = "slack";
    private static final String SLACK_AUTH_URL = "https://slack.com/oauth/v2/authorize";
    private static final String SLACK_TOKEN_URL = "https://slack.com/api/oauth.v2.access";

    private final SlackOAuthProperties properties;
    private final UserIntegrationRepository userIntegrationRepository;

    @Override
    public String buildAuthorizationUrl(Long userId) {
        return UriComponentsBuilder.fromUriString(SLACK_AUTH_URL)
                .queryParam("client_id", properties.getClientId())
                .queryParam("redirect_uri", properties.getRedirectUri())
                .queryParam("scope", properties.getScopes())
                .queryParam("state", userId)
                .encode()
                .toUriString();
    }

    @Override
    @SuppressWarnings("unchecked")
    public void handleCallback(String code, String state) {
        Long userId = parseUserId(state);
        LinkedMultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code", code);
        form.add("client_id", properties.getClientId());
        form.add("client_secret", properties.getClientSecret());
        form.add("redirect_uri", properties.getRedirectUri());

        Map<String, Object> response = RestClient.create()
                .post()
                .uri(SLACK_TOKEN_URL)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(Map.class);

        if (response == null || !Boolean.TRUE.equals(response.get("ok"))) {
            String error = response != null ? String.valueOf(response.get("error")) : "Empty response";
            throw new IllegalStateException("Slack token exchange failed: " + error);
        }

        String accessToken = stringValue(response.get("access_token"));
        if (accessToken.isBlank()) {
            throw new IllegalStateException("Slack token exchange failed: missing access_token");
        }

        String scope = stringValue(response.get("scope"));

        LocalDateTime now = LocalDateTime.now();

        UserIntegration integration = userIntegrationRepository
                .findByUserIdAndProvider(userId, PROVIDER_SLACK)
                .orElse(UserIntegration.builder()
                        .userId(userId)
                        .provider(PROVIDER_SLACK)
                        .createdAt(now)
                        .build());

        integration.setAccessToken(accessToken);
        integration.setScope(scope);
        integration.setExpiresAt(null); // Les jetons Slack n'expirent pas
        integration.setUpdatedAt(now);

        userIntegrationRepository.save(integration);
        log.info("Successfully connected Slack for user {}", userId);
    }

    private Long parseUserId(String state) {
        try {
            return Long.valueOf(state);
        } catch (NumberFormatException exception) {
            throw new IllegalStateException("Invalid Slack OAuth state");
        }
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }
}
