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
}
