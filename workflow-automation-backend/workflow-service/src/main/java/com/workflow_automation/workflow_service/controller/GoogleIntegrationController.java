package com.workflow_automation.workflow_service.controller;

import com.workflow_automation.workflow_service.dto.response.GoogleAuthUrlResponse;
import com.workflow_automation.workflow_service.entity.UserIntegration;
import com.workflow_automation.workflow_service.repository.UserIntegrationRepository;
import com.workflow_automation.workflow_service.service.GoogleOAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/api/integrations/google")
@RequiredArgsConstructor
public class GoogleIntegrationController {

    private final GoogleOAuthService googleOAuthService;
    private final UserIntegrationRepository userIntegrationRepository;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @GetMapping("/auth-url")
    public ResponseEntity<GoogleAuthUrlResponse> getAuthUrl(@RequestParam Long userId) {
        String authUrl = googleOAuthService.buildAuthorizationUrl(userId);
        return ResponseEntity.ok(new GoogleAuthUrlResponse(authUrl));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus(@RequestParam Long userId) {
        Optional<UserIntegration> integration = userIntegrationRepository.findByUserIdAndProvider(userId, "gmail");

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("connected", integration.isPresent());
        response.put("provider", "gmail");
        response.put("scope", integration.map(UserIntegration::getScope).orElse(""));
        response.put("updatedAt", integration.map(UserIntegration::getUpdatedAt).orElse(null));

        return ResponseEntity.ok(response);
    }

    @GetMapping("/callback")
    public ResponseEntity<Void> callback(
            @RequestParam String code,
            @RequestParam String state
    ) {
        googleOAuthService.handleCallback(code, state);

        return ResponseEntity
                .status(302)
                .location(URI.create(frontendUrl + "/app-connections?gmail=connected"))
                .build();
    }

    @DeleteMapping("/disconnect")
    public ResponseEntity<Map<String, Object>> disconnect(@RequestParam Long userId) {
        Optional<UserIntegration> integration = userIntegrationRepository.findByUserIdAndProvider(userId, "gmail");
        if (integration.isPresent()) {
            userIntegrationRepository.delete(integration.get());
        }

        Map<String, Object> response = new java.util.LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Google account disconnected successfully.");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testConnection(@RequestParam Long userId) {
        Optional<UserIntegration> integration = userIntegrationRepository.findByUserIdAndProvider(userId, "gmail");
        Map<String, Object> response = new java.util.LinkedHashMap<>();

        if (integration.isEmpty()) {
            response.put("success", false);
            response.put("message", "Gmail is not connected.");
            return ResponseEntity.status(404).body(response);
        }

        try {
            // Appel léger à l'API Google pour vérifier la validité du token
            org.springframework.web.client.RestClient.create()
                    .get()
                    .uri("https://gmail.googleapis.com/gmail/v1/users/me/profile")
                    .header("Authorization", "Bearer " + integration.get().getAccessToken())
                    .retrieve()
                    .toBodilessEntity();

            response.put("success", true);
            response.put("message", "Gmail connection is active and working!");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Gmail connection failed: " + e.getMessage());
            return ResponseEntity.status(400).body(response);
        }
    }

}
