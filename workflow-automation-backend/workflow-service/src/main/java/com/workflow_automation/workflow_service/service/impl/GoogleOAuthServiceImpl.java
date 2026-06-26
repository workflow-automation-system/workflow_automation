package com.workflow_automation.workflow_service.service.impl;

import com.workflow_automation.workflow_service.config.GoogleOAuthProperties;
import com.workflow_automation.workflow_service.dto.response.GoogleTokenResponse;
import com.workflow_automation.workflow_service.entity.UserIntegration;
import com.workflow_automation.workflow_service.repository.UserIntegrationRepository;
import com.workflow_automation.workflow_service.service.GoogleOAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class GoogleOAuthServiceImpl implements GoogleOAuthService {

    private static final String PROVIDER_GMAIL = "gmail";
    private static final String GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

    private final GoogleOAuthProperties properties;
    private final UserIntegrationRepository userIntegrationRepository;

    @Override
    public String buildAuthorizationUrl(Long userId) {
        return UriComponentsBuilder.fromUriString(GOOGLE_AUTH_URL)
                .queryParam("client_id", properties.getClientId())
                .queryParam("redirect_uri", properties.getRedirectUri())
                .queryParam("response_type", "code")
                .queryParam("scope", properties.getScopes())
                .queryParam("access_type", "offline")
                .queryParam("prompt", "consent")
                .queryParam("state", userId)
                .encode()
                .toUriString();
    }

    @Override
    public void handleCallback(String code, String state) {
        Long userId = Long.valueOf(state);
        LinkedMultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code", code);
        form.add("client_id", properties.getClientId());
        form.add("client_secret", properties.getClientSecret());
        form.add("redirect_uri", properties.getRedirectUri());
        form.add("grant_type", "authorization_code");

        GoogleTokenResponse tokenResponse = RestClient.create()
                .post()
                .uri(GOOGLE_TOKEN_URL)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(GoogleTokenResponse.class);

        if (tokenResponse == null) {
            throw new IllegalStateException("Google token response is empty");
        }

        LocalDateTime now = LocalDateTime.now();

        UserIntegration integration = userIntegrationRepository
                .findByUserIdAndProvider(userId, PROVIDER_GMAIL)
                .orElse(UserIntegration.builder()
                        .userId(userId)
                        .provider(PROVIDER_GMAIL)
                        .createdAt(now)
                        .build());

        integration.setAccessToken(tokenResponse.getAccessToken());

        if (tokenResponse.getRefreshToken() != null) {
            integration.setRefreshToken(tokenResponse.getRefreshToken());
        }

        integration.setScope(tokenResponse.getScope());
        integration.setExpiresAt(now.plusSeconds(tokenResponse.getExpiresIn()));
        integration.setUpdatedAt(now);

        userIntegrationRepository.save(integration);
    }

    @Override
    public UserIntegration refreshTokenIfNeeded(UserIntegration integration) {
        if (integration.getExpiresAt() != null && integration.getExpiresAt().isAfter(LocalDateTime.now())) {
            return integration;
        }

        if (integration.getRefreshToken() == null || integration.getRefreshToken().isBlank()) {
            throw new IllegalStateException("Gmail access token expired and refresh token is missing");
        }

        LinkedMultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", properties.getClientId());
        form.add("client_secret", properties.getClientSecret());
        form.add("refresh_token", integration.getRefreshToken());
        form.add("grant_type", "refresh_token");

        GoogleTokenResponse tokenResponse = RestClient.create()
                .post()
                .uri(GOOGLE_TOKEN_URL)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(GoogleTokenResponse.class);

        if (tokenResponse == null || tokenResponse.getAccessToken() == null) {
            throw new IllegalStateException("Could not refresh Gmail access token");
        }

        integration.setAccessToken(tokenResponse.getAccessToken());
        if (tokenResponse.getExpiresIn() != null) {
            integration.setExpiresAt(LocalDateTime.now().plusSeconds(tokenResponse.getExpiresIn()));
        }
        integration.setUpdatedAt(LocalDateTime.now());

        return userIntegrationRepository.save(integration);
    }
}
