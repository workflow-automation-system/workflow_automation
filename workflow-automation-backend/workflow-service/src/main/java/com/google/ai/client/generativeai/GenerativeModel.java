package com.google.ai.client.generativeai;

import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class GenerativeModel {

    private final String modelName;
    private final String apiKey;
    private final RestTemplate restTemplate;

    public GenerativeModel(String modelName, String apiKey) {
        this.modelName = modelName;
        this.apiKey = apiKey;
        this.restTemplate = new RestTemplate();
    }

    public GenerateContentResponse generateContent(String prompt) {
        String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", 
                modelName, apiKey);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Build the payload: {"contents": [{"parts": [{"text": "prompt"}]}]}
        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> payload = Map.of("contents", List.of(content));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<Map> responseEntity = restTemplate.postForEntity(url, entity, Map.class);
            Map body = responseEntity.getBody();
            if (body == null) {
                return new GenerateContentResponse("Error: Empty response body from Gemini API");
            }

            // Extract candidate text: body.candidates[0].content.parts[0].text
            List candidates = (List) body.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                return new GenerateContentResponse("Error: No candidates returned from Gemini API. Check API key and quota.");
            }

            Map candidate = (Map) candidates.get(0);
            Map contentMap = (Map) candidate.get("content");
            if (contentMap == null) {
                return new GenerateContentResponse("Error: No content in candidate");
            }

            List parts = (List) contentMap.get("parts");
            if (parts == null || parts.isEmpty()) {
                return new GenerateContentResponse("Error: No parts in content");
            }

            Map partMap = (Map) parts.get(0);
            String text = (String) partMap.get("text");

            return new GenerateContentResponse(text);
        } catch (Exception e) {
            return new GenerateContentResponse("Error calling Gemini API: " + e.getMessage());
        }
    }
}
