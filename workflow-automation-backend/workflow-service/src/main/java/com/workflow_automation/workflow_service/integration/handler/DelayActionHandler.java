package com.workflow_automation.workflow_service.integration.handler;

import com.workflow_automation.workflow_service.entity.Node;
import com.workflow_automation.workflow_service.integration.ApplicationActionHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@Slf4j
public class DelayActionHandler implements ApplicationActionHandler {

    @Override
    public String getApplicationKey() {
        return "delay";
    }

    @Override
    public Map<String, Object> handle(Node node, Map<String, Object> config, Map<String, Object> context) {
        int duration = parsePositiveInt(config.get("duration"), 5);
        String unit = stringValue(config.getOrDefault("unit", "minutes"));

        long sleepMillis = calculateMillis(duration, unit);
        
        log.info("DelayActionHandler pausing execution for {} {} ({} ms) for node '{}'", 
                duration, unit, sleepMillis, node.getName());

        try {
            Thread.sleep(sleepMillis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Delay was interrupted", e);
        }

        log.info("DelayActionHandler resumed execution for node '{}'", node.getName());

        return Map.of(
                "application", getApplicationKey(),
                "action", "wait",
                "status", "COMPLETED",
                "duration", duration,
                "unit", unit
        );
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

    private long calculateMillis(int duration, String unit) {
        String lowerUnit = unit.toLowerCase();
        if (lowerUnit.startsWith("second")) {
            return duration * 1000L;
        } else if (lowerUnit.startsWith("minute")) {
            return duration * 60 * 1000L;
        } else if (lowerUnit.startsWith("hour")) {
            return duration * 60 * 60 * 1000L;
        } else if (lowerUnit.startsWith("day")) {
            return duration * 24 * 60 * 60 * 1000L;
        }
        // Default to minutes if unknown
        return duration * 60 * 1000L;
    }
}
