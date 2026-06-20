package com.workflow_automation.workflow_service.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "notion.oauth")
public class NotionOAuthProperties {
    private String clientId;
    private String clientSecret;
    private String redirectUri;
}