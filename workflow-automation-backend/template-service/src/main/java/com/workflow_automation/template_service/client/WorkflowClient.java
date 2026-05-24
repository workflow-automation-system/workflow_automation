package com.workflow_automation.template_service.client;

import com.workflow_automation.template_service.dto.request.CreateWorkflowRequest;
import com.workflow_automation.template_service.dto.response.WorkflowResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
public class WorkflowClient {

    private final RestTemplate restTemplate;

    @Value("${workflow.service.url}")
    private String workflowServiceUrl;

    public WorkflowResponse createWorkflow(CreateWorkflowRequest request) {
        return restTemplate.postForObject(
                workflowServiceUrl + "/api/workflows",
                request,
                WorkflowResponse.class
        );
    }
}