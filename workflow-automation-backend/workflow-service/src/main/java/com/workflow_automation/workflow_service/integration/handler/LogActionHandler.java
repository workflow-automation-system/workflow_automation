package com.workflow_automation.workflow_service.integration.handler;

import com.workflow_automation.workflow_service.entity.Node;
import com.workflow_automation.workflow_service.integration.ApplicationActionHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@Slf4j
public class LogActionHandler implements ApplicationActionHandler {
    @Override
    public String getApplicationKey() {
        return "log";
    }

    @Override
    public Map<String, Object> handle(Node node, Map<String, Object> config, Map<String, Object> context) {
        log.info("Log action for node '{}': config={}, context={}", node.getName(), config, context);
        return Map.of(
                "application", getApplicationKey(),
                "status", "LOGGED",
                "node", node.getName()
        );
    }
}
