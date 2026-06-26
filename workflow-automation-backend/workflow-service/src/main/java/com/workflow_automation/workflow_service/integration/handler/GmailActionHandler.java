package com.workflow_automation.workflow_service.integration.handler;

import com.workflow_automation.workflow_service.entity.Node;
import com.workflow_automation.workflow_service.entity.UserIntegration;
import com.workflow_automation.workflow_service.integration.ApplicationActionHandler;
import com.workflow_automation.workflow_service.repository.UserIntegrationRepository;
import com.workflow_automation.workflow_service.service.GoogleOAuthService;
import jakarta.mail.Message;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Properties;

@Component
@RequiredArgsConstructor
@Slf4j
public class GmailActionHandler implements ApplicationActionHandler {

    private static final String PROVIDER_GMAIL = "gmail";
    private static final String GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
    private static final String GMAIL_MESSAGES_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages";

    private final UserIntegrationRepository userIntegrationRepository;
    private final GoogleOAuthService googleOAuthService;

    @Override
    public String getApplicationKey() {
        return "gmail";
    }

    @Override
    public Map<String, Object> handle(Node node, Map<String, Object> config, Map<String, Object> context) {
        Long userId = Long.valueOf(String.valueOf(context.get("userId")));

        UserIntegration integration = userIntegrationRepository
                .findByUserIdAndProvider(userId, PROVIDER_GMAIL)
                .orElseThrow(() -> new IllegalStateException("Gmail is not connected for user: " + userId));

        integration = googleOAuthService.refreshTokenIfNeeded(integration);

        String action = stringValue(config.getOrDefault("action", "send_email"));

        if ("send_email".equals(action)) {
            return sendEmail(node, config, integration);
        }

        if ("read_emails".equals(action)) {
            return readEmails(config, integration);
        }

        throw new IllegalArgumentException("Unsupported Gmail action: " + action);
    }

    private Map<String, Object> sendEmail(Node node, Map<String, Object> config, UserIntegration integration) {
        String to = stringValue(config.get("to"));
        String subject = stringValue(config.get("subject"));
        String body = stringValue(config.get("body"));

        if (to.isBlank()) {
            throw new IllegalArgumentException("Gmail recipient is required");
        }
        if (subject.isBlank()) {
            throw new IllegalArgumentException("Gmail subject is required");
        }

        String rawMessage = createRawEmail(to, subject, body);

        RestClient.create()
                .post()
                .uri(GMAIL_SEND_URL)
                .header("Authorization", "Bearer " + integration.getAccessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("raw", rawMessage))
                .retrieve()
                .toBodilessEntity();

        log.info("Gmail email sent for node '{}': to='{}', subject='{}'", node.getName(), to, subject);

        return Map.of(
                "application", getApplicationKey(),
                "action", "send_email",
                "status", "SENT",
                "to", to
        );
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> readEmails(Map<String, Object> config, UserIntegration integration) {
        String query = stringValue(config.getOrDefault("query", "is:unread"));
        int maxResults = parsePositiveInt(config.get("maxResults"), 10);

        Map<String, Object> listResponse = RestClient.create()
                .get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https")
                        .host("gmail.googleapis.com")
                        .path("/gmail/v1/users/me/messages")
                        .queryParam("q", query)
                        .queryParam("maxResults", maxResults)
                        .build())
                .header("Authorization", "Bearer " + integration.getAccessToken())
                .retrieve()
                .body(Map.class);

        List<Map<String, Object>> messageRefs = listResponse == null
                ? List.of()
                : (List<Map<String, Object>>) listResponse.getOrDefault("messages", List.of());

        List<Map<String, Object>> messages = new ArrayList<>();
        for (Map<String, Object> messageRef : messageRefs) {
            String messageId = stringValue(messageRef.get("id"));
            if (messageId.isBlank()) {
                continue;
            }

            Map<String, Object> message = RestClient.create()
                    .get()
                    .uri(GMAIL_MESSAGES_URL + "/" + messageId)
                    .header("Authorization", "Bearer " + integration.getAccessToken())
                    .retrieve()
                    .body(Map.class);

            if (message != null) {
                // Extraire les headers (Subject, From, Date)
                String subject = "(Sans objet)";
                String from = "";
                String date = "";

                Object payload = message.get("payload");
                if (payload instanceof Map<?, ?> payloadMap) {
                    Object headers = payloadMap.get("headers");
                    if (headers instanceof List<?> headerList) {
                        for (Object h : headerList) {
                            if (h instanceof Map<?, ?> header) {
                                String name = stringValue(header.get("name"));
                                String value = stringValue(header.get("value"));
                                if ("Subject".equalsIgnoreCase(name) && !value.isBlank()) {
                                    subject = value;
                                } else if ("From".equalsIgnoreCase(name) && !value.isBlank()) {
                                    from = value;
                                } else if ("Date".equalsIgnoreCase(name) && !value.isBlank()) {
                                    date = value;
                                }
                            }
                        }
                    }
                }

                // Décoder les entités HTML du snippet (&#39; → ', &amp; → &, etc.)
                String snippet = decodeHtml(stringValue(message.get("snippet")));

                messages.add(Map.of(
                        "id",       stringValue(message.get("id")),
                        "threadId", stringValue(message.get("threadId")),
                        "subject",  subject,
                        "from",     from,
                        "date",     date,
                        "snippet",  snippet
                ));
            }
        }

        log.info("Gmail read completed: query='{}', messages={}", query, messages.size());

        return Map.of(
                "application", getApplicationKey(),
                "action", "read_emails",
                "query", query,
                "count", messages.size(),
                "messages", messages
        );
    }

    private String createRawEmail(String to, String subject, String body) {
        try {
            MimeMessage email = new MimeMessage(Session.getDefaultInstance(new Properties()));
            email.addRecipient(Message.RecipientType.TO, new InternetAddress(to));
            email.setSubject(subject);
            email.setText(body);

            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            email.writeTo(buffer);

            return Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(buffer.toByteArray());
        } catch (Exception exception) {
            throw new IllegalStateException("Could not create Gmail message", exception);
        }
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private int parsePositiveInt(Object value, int fallback) {
        try {
            int parsed = Integer.parseInt(stringValue(value));
            return parsed > 0 ? parsed : fallback;
        } catch (NumberFormatException exception) {
            return fallback;
        }
    }

    /**
     * Décode les entités HTML courantes retournées par l'API Gmail.
     * Ex: &#39; → ', &amp; → &, &quot; → "
     */
    private String decodeHtml(String text) {
        if (text == null) return "";
        return text
                .replace("&#39;", "'")
                .replace("&amp;", "&")
                .replace("&quot;", "\"")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&nbsp;", " ")
                .replace("&#34;", "\"")
                .replace("&#38;", "&")
                .replace("&#60;", "<")
                .replace("&#62;", ">");
    }
}
