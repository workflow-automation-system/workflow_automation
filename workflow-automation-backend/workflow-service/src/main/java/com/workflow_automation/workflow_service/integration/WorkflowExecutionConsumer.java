package com.workflow_automation.workflow_service.integration;

import com.workflow_automation.workflow_service.dto.request.WorkflowExecutionMessage;
import com.workflow_automation.workflow_service.service.ExecutionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class WorkflowExecutionConsumer {

    private final ExecutionService executionService;

    @RabbitListener(queues = "${app.rabbitmq.queue}")
    public void consumeWorkflowExecution(WorkflowExecutionMessage message) {
        log.info("Received workflow execution request from queue for workflowId: {}", message.getWorkflowId());
        try {
            executionService.executeWorkflow(message.getWorkflowId(), message.getInput());
            log.info("Finished asynchronous execution for workflowId: {}", message.getWorkflowId());
        } catch (Exception exception) {
            log.error("Error executing workflow from queue for workflowId: {}", message.getWorkflowId(), exception);
        }
    }
}
