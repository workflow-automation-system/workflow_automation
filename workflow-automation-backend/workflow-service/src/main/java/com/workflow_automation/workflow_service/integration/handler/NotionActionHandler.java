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

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotionActionHandler implements ApplicationActionHandler {

    private static final String PROVIDER_NOTION = "notion";
    private static final String NOTION_API_VERSION = "2022-06-28";
    private static final String NOTION_PAGES_URL = "https://api.notion.com/v1/pages";

    private final UserIntegrationRepository userIntegrationRepository;

    @Override
    public String getApplicationKey() {
        return "notion";
    }

    @Override
    @SuppressWarnings("unchecked")
    public Map<String, Object> handle(Node node, Map<String, Object> config, Map<String, Object> context) {
        Long userId = Long.valueOf(String.valueOf(context.get("userId")));

        UserIntegration integration = userIntegrationRepository
                .findByUserIdAndProvider(userId, PROVIDER_NOTION)
                .orElseThrow(() -> new IllegalStateException("Notion is not connected for user: " + userId));

        String action = stringValue(config.getOrDefault("action", "create_page"));
        String databaseId = stringValue(config.get("database"));

        if (databaseId.isBlank()) {
            throw new IllegalArgumentException("Notion Database ID is required");
        }

        if ("create_page".equals(action)) {
            return createPagesFromContext(node, databaseId, context, integration);
        }

        throw new IllegalArgumentException("Unsupported Notion action: " + action);
    }

    /**
     * Cherche la liste d'emails dans le contexte en parcourant toutes les clés
     * qui contiennent un résultat de type read_emails (gmail_result, Fetch Emails_result, etc.)
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> createPagesFromContext(Node node, String databaseId,
                                                        Map<String, Object> context,
                                                        UserIntegration integration) {
        List<Map<String, Object>> messages = new ArrayList<>();

        // Stratégie 1 : chercher directement "messages" dans le contexte
        if (context.containsKey("messages")) {
            Object raw = context.get("messages");
            if (raw instanceof List<?> list && !list.isEmpty()) {
                messages = (List<Map<String, Object>>) list;
                log.info("NotionHandler: found {} messages directly in context", messages.size());
            }
        }

        // Stratégie 2 : parcourir toutes les clés _result pour trouver un read_emails
        if (messages.isEmpty()) {
            for (Map.Entry<String, Object> entry : context.entrySet()) {
                if (entry.getKey().endsWith("_result") && entry.getValue() instanceof Map<?, ?> resultMap) {
                    Object action = resultMap.get("action");
                    Object msgList = resultMap.get("messages");
                    if ("read_emails".equals(action) && msgList instanceof List<?> list && !list.isEmpty()) {
                        messages = (List<Map<String, Object>>) list;
                        log.info("NotionHandler: found {} messages in context key '{}'", messages.size(), entry.getKey());
                        break;
                    }
                }
            }
        }

        // Aucun email trouvé → page générique
        if (messages.isEmpty()) {
            log.warn("NotionHandler: no email messages found in context. Keys available: {}", context.keySet());
            String title = "Automated Entry - " + node.getName();
            String pageId = createSinglePage(databaseId, title, "No email data available", "", "", integration);
            return Map.of(
                    "application", getApplicationKey(),
                    "action", "create_page",
                    "status", "CREATED",
                    "pagesCreated", 1,
                    "note", "No email messages found in context",
                    "pageId", pageId
            );
        }

        // Créer une page Notion par email
        List<String> createdPageIds = new ArrayList<>();

        for (Map<String, Object> email : messages) {
            String emailId = stringValue(email.getOrDefault("id", ""));
            String subject = stringValue(email.getOrDefault("subject", ""));
            String from    = stringValue(email.getOrDefault("from", ""));
            // Décodage HTML au cas où (déjà fait dans Gmail mais sécurité supplémentaire)
            String snippet  = decodeHtml(stringValue(email.getOrDefault("snippet", "(pas de contenu)")));

            // Titre = sujet de l'email (sinon début du snippet)
            String title = subject.isBlank()
                    ? (snippet.length() > 80 ? snippet.substring(0, 80) + "…" : snippet)
                    : subject;
            if (title.isBlank()) {
                title = "Email " + emailId;
            }

            try {
                String pageId = createSinglePage(databaseId, title, snippet, emailId, from, integration);
                createdPageIds.add(pageId);
                log.info("NotionHandler: created page for email '{}' subject='{}'", emailId, title);
            } catch (Exception e) {
                log.warn("NotionHandler: failed to create page for email '{}': {}", emailId, e.getMessage());
            }
        }

        log.info("NotionHandler: created {} pages in database '{}'", createdPageIds.size(), databaseId);

        return Map.of(
                "application", getApplicationKey(),
                "action", "create_page",
                "status", "CREATED",
                "pagesCreated", createdPageIds.size(),
                "pageIds", createdPageIds
        );
    }

    /**
     * Crée une seule entrée dans la base Notion.
     * Colonnes attendues : Name (title), Snippet (rich_text), Email ID (rich_text), Sender (rich_text), Date (date).
     */
    @SuppressWarnings("unchecked")
    private String createSinglePage(String databaseId, String title, String snippet,
                                    String emailId, String sender, UserIntegration integration) {
        String today = LocalDate.now().toString();

        Map<String, Object> requestBody = Map.of(
                "parent", Map.of("database_id", databaseId),
                "properties", Map.of(
                        "Name", Map.of(
                                "title", List.of(
                                        Map.of("text", Map.of("content", title))
                                )
                        ),
                        "Snippet", Map.of(
                                "rich_text", List.of(
                                        Map.of("text", Map.of("content",
                                                snippet.length() > 2000 ? snippet.substring(0, 2000) : snippet))
                                )
                        ),
                        "Email ID", Map.of(
                                "rich_text", List.of(
                                        Map.of("text", Map.of("content", emailId))
                                )
                        ),
                        "Sender", Map.of(
                                "rich_text", List.of(
                                        Map.of("text", Map.of("content", sender))
                                )
                        ),
                        "Date", Map.of(
                                "date", Map.of("start", today)
                        )
                )
        );

        Map<String, Object> response = RestClient.create()
                .post()
                .uri(NOTION_PAGES_URL)
                .header("Authorization", "Bearer " + integration.getAccessToken())
                .header("Notion-Version", NOTION_API_VERSION)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        if (response == null || response.get("id") == null) {
            throw new IllegalStateException("Notion API call failed to return page ID");
        }

        return stringValue(response.get("id"));
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    /**
     * Décode les entités HTML courantes retournées par l'API Gmail dans les snippets.
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