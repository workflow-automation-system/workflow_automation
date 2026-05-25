package com.google.ai.client.generativeai;

public class GenerateContentResponse {
    private final String text;

    public GenerateContentResponse(String text) {
        this.text = text;
    }

    public String getText() {
        return text;
    }
}
