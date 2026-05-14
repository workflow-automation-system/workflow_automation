package com.workflow_automation.workflow_service.integration;

import com.workflow_automation.workflow_service.entity.Node;

import java.util.Map;

public interface ApplicationActionHandler {
    String getApplicationKey();

    Map<String, Object> handle(Node node, Map<String, Object> config, Map<String, Object> context);
}
