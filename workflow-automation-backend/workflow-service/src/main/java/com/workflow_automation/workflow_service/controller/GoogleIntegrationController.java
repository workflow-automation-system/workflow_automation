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

@RestController
@RequestMapping("/api/integrations/google")
@RequiredArgsConstructor
public class GoogleIntegrationController {

    private final GoogleOAuthService googleOAuthService;
    private final UserIntegrationRepository userIntegrationRepository;

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
                .location(URI.create("http://localhost:3000/app-connections?gmail=connected"))
                .build();
    }
}
