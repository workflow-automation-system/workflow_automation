package com.workflow_automation.workflow_service.config;

import com.google.ai.client.generativeai.GenerativeModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GeminiConfig {

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String modelName;

    @Bean
    public GenerativeModel geminiModel() {
        return new GenerativeModel(modelName, apiKey);
    }
}
