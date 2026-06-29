package com.workflow_automation.workflow_service.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow_automation.workflow_service.entity.WorkflowTemplate;
import com.workflow_automation.workflow_service.repository.WorkflowTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class DefaultTemplateSeeder implements CommandLineRunner {

    private final WorkflowTemplateRepository templateRepository;
    private final ObjectMapper objectMapper;

    @Override
    public void run(String... args) throws Exception {
        // Clear all existing templates to ensure we re-seed with exactly the new default templates
        templateRepository.deleteAll();

        LocalDateTime now = LocalDateTime.now();

        templateRepository.saveAll(List.of(
                template(
                        "Email Processing & Slack Alert",
                        "Fetches emails, checks if any contains a specific keyword, and sends a Slack alert.",
                        "Automation",
                        content(
                                List.of(
                                        node("trigger-email", "trigger", "Manual Trigger", 80, 120,
                                                Map.of("label", "Trigger",
                                                       "eventType", "manual",
                                                       "functionKey", "trigger")),
                                        node("gmail-read", "gmail_read", "Fetch Emails", 350, 120,
                                                Map.of("label", "Fetch Emails",
                                                       "action", "read_emails",
                                                       "query", "from:sender@example.com is:unread",
                                                       "maxResults", 10,
                                                       "functionKey", "gmail_read",
                                                       "application", "gmail")),
                                        node("condition-word", "condition", "Check Content", 620, 120,
                                                Map.of("label", "Contains keyword",
                                                       "expression", "payload.email.body contains 'urgent'",
                                                       "truePath", "Yes",
                                                       "falsePath", "No",
                                                       "functionKey", "condition")),
                                        node("slack-alert", "slack", "Slack Alert", 890, 120,
                                                Map.of("label", "Slack Alert",
                                                       "channel", "#alerts",
                                                       "message", "An important email has been detected!",
                                                       "functionKey", "slack",
                                                       "application", "slack"))
                                ),
                                List.of(
                                        connection("trigger-email", "gmail-read"),
                                        connection("gmail-read", "condition-word"),
                                        connection("condition-word", "slack-alert")
                                )
                        ),
                        now
                ),
                template(
                        "Send Email Notification",
                        "Triggers the sending of a notification email to a given recipient.",
                        "Communication",
                        content(
                                List.of(
                                        node("trigger-send", "trigger", "Manual Trigger", 80, 120,
                                                Map.of("label", "Trigger",
                                                       "eventType", "manual",
                                                       "functionKey", "trigger")),
                                        node("gmail-send", "gmail", "Send Email", 350, 120,
                                                Map.of("label", "Send Email",
                                                       "action", "send_email",
                                                       "to", "recipient@example.com",
                                                       "subject", "Automated notification",
                                                       "body", "Hello, this is an automated notification email.",
                                                       "functionKey", "gmail",
                                                       "application", "gmail"))
                                ),
                                List.of(
                                        connection("trigger-send", "gmail-send")
                                )
                        ),
                        now
                ),
                template(
                        "Auto-respond to Internships",
                        "Fetches unread emails, checks if subject or content contains 'condition' that the user has to specify, and auto-replies to the sender.",
                        "Automation",
                        content(
                                List.of(
                                        node("trigger-email", "trigger", "Manual Trigger", 80, 120,
                                                Map.of("label", "Trigger",
                                                        "eventType", "manual",
                                                        "functionKey", "trigger")),
                                        node("gmail-read", "gmail_read", "Fetch Emails", 350, 120,
                                                Map.of("label", "Fetch Emails",
                                                        "action", "read_emails",
                                                        "query", "is:unread",
                                                        "maxResults", 10,
                                                        "functionKey", "gmail_read",
                                                        "application", "gmail")),
                                        node("condition-stage", "condition", "Check Content", 620, 120,
                                                Map.of("label", "Branch Condition",
                                                        "expression", "{{gmail_read_result.messages.0.subject}} {{gmail_read_result.messages.0.snippet}} contains 'condition'",
                                                        "truePath", "True",
                                                        "falsePath", "False",
                                                        "functionKey", "condition")),
                                        node("gmail-send", "gmail", "Send Email", 890, 120,
                                                Map.of("label", "Send Email",
                                                        "action", "send_email",
                                                        "to", "{{gmail_read_result.messages.0.from}}",
                                                        "subject", "Re: {{gmail_read_result.messages.0.subject}}",
                                                        "body", "Bonjour, bien reçus",
                                                        "functionKey", "gmail",
                                                        "application", "gmail"))
                                ),
                                List.of(
                                        connection("trigger-email", "gmail-read"),
                                        connection("gmail-read", "condition-stage"),
                                        connection("condition-stage", "gmail-send")
                                )
                        ),
                        now
                ),
                template(
                        "Gmail to Notion Archive & Slack Alert",
                        "Fetches unread emails, creates archive pages in a Notion database, and alerts the team on Slack.",
                        "Automation",
                        content(
                                List.of(
                                        node("trigger-email", "trigger", "Manual Trigger", 80, 120,
                                                Map.of("label", "Trigger",
                                                       "eventType", "manual",
                                                       "functionKey", "trigger")),
                                        node("gmail-read", "gmail_read", "Fetch Emails", 320, 120,
                                                Map.of("label", "Fetch Emails",
                                                       "action", "read_emails",
                                                       "query", "is:unread",
                                                       "maxResults", 5,
                                                       "functionKey", "gmail_read",
                                                       "application", "gmail")),
                                        node("notion-create", "notion", "Create Notion Page", 560, 120,
                                                Map.of("label", "Create Notion Page",
                                                       "action", "create_page",
                                                       "database", "enter_database_id_here",
                                                       "functionKey", "notion",
                                                       "application", "notion")),
                                        node("slack-notify", "slack", "Slack Alert", 800, 120,
                                                Map.of("label", "Slack Alert",
                                                       "channel", "#general",
                                                       "message", "New ticket created in Notion from email subject!",
                                                       "functionKey", "slack",
                                                       "application", "slack"))
                                ),
                                List.of(
                                        connection("trigger-email", "gmail-read"),
                                        connection("gmail-read", "notion-create"),
                                        connection("notion-create", "slack-notify")
                                )
                        ),
                        now
                )
        ));
    }

    private WorkflowTemplate template(
            String name,
            String description,
            String category,
            Map<String, Object> content,
            LocalDateTime now
    ) throws Exception {
        return WorkflowTemplate.builder()
                .name(name)
                .description(description)
                .category(category)
                .content(objectMapper.writeValueAsString(content))
                .active(true)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    private Map<String, Object> content(List<Map<String, Object>> nodes, List<Map<String, String>> connections) {
        return Map.of(
                "nodes", nodes,
                "connections", connections
        );
    }

    private Map<String, Object> node(
            String clientId,
            String type,
            String name,
            double positionX,
            double positionY,
            Map<String, Object> config
    ) throws Exception {
        return Map.of(
                "clientId", clientId,
                "type", type,
                "name", name,
                "config", objectMapper.writeValueAsString(config),
                "positionX", positionX,
                "positionY", positionY
        );
    }

    private Map<String, String> connection(String sourceClientId, String targetClientId) {
        return Map.of(
                "sourceClientId", sourceClientId,
                "targetClientId", targetClientId
        );
    }
}
