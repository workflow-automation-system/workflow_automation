package com.workflow_automation.workflow_service.integration;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class ApplicationActionRegistry {

    private final Map<String, ApplicationActionHandler> handlers;

    public ApplicationActionRegistry(List<ApplicationActionHandler> handlers) {
        this.handlers = handlers.stream()
                .collect(Collectors.toMap(
                        handler -> normalize(handler.getApplicationKey()),
                        Function.identity()
                ));
    }

    public ApplicationActionHandler getHandler(String applicationKey) {
        ApplicationActionHandler handler = handlers.get(normalize(applicationKey));
        if (handler == null) {
            throw new IllegalArgumentException("No handler registered for application: " + applicationKey);
        }
        return handler;
    }

    public boolean hasHandler(String applicationKey) {
        return handlers.containsKey(normalize(applicationKey));
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
