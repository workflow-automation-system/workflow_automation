package com.workflow_automation.workflow_service.controller;

import com.workflow_automation.workflow_service.dto.response.GoogleAuthUrlResponse;
import com.workflow_automation.workflow_service.entity.UserIntegration;
import com.workflow_automation.workflow_service.repository.UserIntegrationRepository;
import com.workflow_automation.workflow_service.service.SlackOAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/integrations/slack")
@RequiredArgsConstructor
public class SlackIntegrationController {

    private final SlackOAuthService slackOAuthService;
    private final UserIntegrationRepository userIntegrationRepository;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @GetMapping("/auth-url")
    public ResponseEntity<GoogleAuthUrlResponse> getAuthUrl(@RequestParam Long userId) {
        String authUrl = slackOAuthService.buildAuthorizationUrl(userId);
        return ResponseEntity.ok(new GoogleAuthUrlResponse(authUrl));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus(@RequestParam Long userId) {
        Optional<UserIntegration> integration = userIntegrationRepository.findByUserIdAndProvider(userId, "slack");

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("connected", integration.isPresent());
        response.put("provider", "slack");
        response.put("scope", integration.map(UserIntegration::getScope).orElse(""));
        response.put("updatedAt", integration.map(UserIntegration::getUpdatedAt).orElse(null));
        response.put("healthStatus", "Warning");

        if (integration.isPresent()) {
            try {
                verifySlackConnection(integration.get());
                response.put("healthStatus", "Healthy");
                response.put("healthMessage", "Slack connection is active and working.");
            } catch (Exception e) {
                response.put("healthStatus", "Warning");
                response.put("healthMessage", "Slack connection needs reconnection.");
            }
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/callback")
    public ResponseEntity<Void> callback(
            @RequestParam String code,
            @RequestParam String state
    ) {
        try {
            slackOAuthService.handleCallback(code, state);
        } catch (RuntimeException exception) {
            String error = URLEncoder.encode(exception.getMessage(), StandardCharsets.UTF_8);
            return ResponseEntity
                    .status(302)
                    .location(URI.create(frontendUrl + "/app-connections?slack_error=" + error))
                    .build();
        }

        return ResponseEntity
                .status(302)
                .location(URI.create(frontendUrl + "/app-connections?slack=connected"))
                .build();
    }

    @DeleteMapping("/disconnect")
    public ResponseEntity<Map<String, Object>> disconnect(@RequestParam Long userId) {
        Optional<UserIntegration> integration = userIntegrationRepository.findByUserIdAndProvider(userId, "slack");
        if (integration.isPresent()) {
            userIntegrationRepository.delete(integration.get());
        }

        Map<String, Object> response = new java.util.LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Slack account disconnected successfully.");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testConnection(@RequestParam Long userId) {
        Optional<UserIntegration> integration = userIntegrationRepository.findByUserIdAndProvider(userId, "slack");
        Map<String, Object> response = new java.util.LinkedHashMap<>();

        if (integration.isEmpty()) {
            response.put("success", false);
            response.put("message", "Slack is not connected.");
            return ResponseEntity.status(404).body(response);
        }

        try {
            verifySlackConnection(integration.get());

            response.put("success", true);
            response.put("message", "Slack connection is active and working!");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Slack connection failed: " + e.getMessage());
            return ResponseEntity.status(400).body(response);
        }
    }

    @SuppressWarnings("unchecked")
    private void verifySlackConnection(UserIntegration integration) {
        Map<String, Object> slackResponse = org.springframework.web.client.RestClient.create()
                .get()
                .uri("https://slack.com/api/auth.test")
                .header("Authorization", "Bearer " + integration.getAccessToken())
                .retrieve()
                .body(Map.class);

        if (slackResponse == null || !Boolean.TRUE.equals(slackResponse.get("ok"))) {
            throw new IllegalStateException("Slack token is not valid");
        }
    }
}
