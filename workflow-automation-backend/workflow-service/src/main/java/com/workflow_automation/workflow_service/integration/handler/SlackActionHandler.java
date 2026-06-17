package com.workflow_automation.workflow_service.integration.handler;

import com.workflow_automation.workflow_service.entity.Node;
import com.workflow_automation.workflow_service.entity.UserIntegration;
import com.workflow_automation.workflow_service.integration.ApplicationActionHandler;
import com.workflow_automation.workflow_service.repository.UserIntegrationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class SlackActionHandler implements ApplicationActionHandler {

    private static final String PROVIDER_SLACK = "slack";
    private static final String SLACK_POST_MESSAGE_URL = "https://slack.com/api/chat.postMessage";

    private final UserIntegrationRepository userIntegrationRepository;

    @Override
    public String getApplicationKey() {
        return "slack";
    }

    @Override
    @SuppressWarnings("unchecked")
    public Map<String, Object> handle(Node node, Map<String, Object> config, Map<String, Object> context) {
        Long userId = Long.valueOf(String.valueOf(context.get("userId")));

        UserIntegration integration = userIntegrationRepository
                .findByUserIdAndProvider(userId, PROVIDER_SLACK)
                .orElseThrow(() -> new IllegalStateException("Slack is not connected for user: " + userId));

        String channel = String.valueOf(config.getOrDefault("channel", "#general"));
        String message = String.valueOf(config.getOrDefault("message", ""));

        if (message.isBlank()) {
            throw new IllegalArgumentException("Slack message content is required");
        }

        Map<String, Object> requestBody = Map.of(
                "channel", channel,
                "text", message
        );

        Map<String, Object> response = RestClient.create()
                .post()
                .uri(SLACK_POST_MESSAGE_URL)
                .header("Authorization", "Bearer " + integration.getAccessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        if (response == null || !Boolean.TRUE.equals(response.get("ok"))) {
            String error = response != null ? String.valueOf(response.get("error")) : "Empty response";
            throw new IllegalStateException("Slack api call failed: " + error);
        }

        log.info("Slack message sent for node '{}' to channel '{}'", node.getName(), channel);

        return Map.of(
                "application", getApplicationKey(),
                "action", "send_message",
                "status", "SENT",
                "channel", channel
        );
    }
}