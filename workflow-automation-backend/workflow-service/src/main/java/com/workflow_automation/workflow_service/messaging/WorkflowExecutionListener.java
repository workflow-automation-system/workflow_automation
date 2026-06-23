package com.workflow_automation.workflow_service.messaging;

import com.workflow_automation.workflow_service.dto.request.WorkflowExecutionMessage;
import com.workflow_automation.workflow_service.security.AccessContext;
import com.workflow_automation.workflow_service.service.ExecutionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class WorkflowExecutionListener {

    private final ExecutionService executionService;

    @RabbitListener(queues = "${app.rabbitmq.queue}")
    public void receiveMessage(WorkflowExecutionMessage message) {
        log.info("Received workflow execution message for workflow ID: {}", message.getWorkflowId());

        try {
            AccessContext accessContext = AccessContext.of(
                    message.getUserId(),
                    message.getOrganizationId(),
                    message.getRole() != null ? message.getRole() : "USER",
                    message.getIpAddress(),
                    message.getUserAgent()
            );

            executionService.executeWorkflow(
                    message.getWorkflowId(),
                    accessContext,
                    message.getInput()
            );
            
            log.info("Successfully executed workflow ID: {}", message.getWorkflowId());
        } catch (Exception e) {
            log.error("Failed to execute workflow from queue. Workflow ID: {}", message.getWorkflowId(), e);
        }
    }
}
