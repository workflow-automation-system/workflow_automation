package com.workflow_automation.workflow_service.service;

import com.workflow_automation.workflow_service.entity.Workflow;
import com.workflow_automation.workflow_service.security.AccessContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowSchedulingService {

    private final ThreadPoolTaskScheduler taskScheduler;
    private final ExecutionService executionService;
    private final Map<Long, ScheduledFuture<?>> scheduledTasks = new ConcurrentHashMap<>();

    public void scheduleWorkflow(Workflow workflow, String cronExpression) {
        cancelSchedule(workflow.getId());

        try {
            CronTrigger trigger = new CronTrigger(cronExpression);
            ScheduledFuture<?> future = taskScheduler.schedule(() -> executeScheduledWorkflow(workflow), trigger);
            
            if (future != null) {
                scheduledTasks.put(workflow.getId(), future);
                log.info("Successfully scheduled workflow ID: {} with cron expression: '{}'", workflow.getId(), cronExpression);
            }
        } catch (IllegalArgumentException e) {
            log.error("Invalid cron expression '{}' for workflow ID: {}", cronExpression, workflow.getId());
        }
    }

    public void cancelSchedule(Long workflowId) {
        ScheduledFuture<?> future = scheduledTasks.remove(workflowId);
        if (future != null) {
            future.cancel(false);
            log.info("Cancelled schedule for workflow ID: {}", workflowId);
        }
    }

    private void executeScheduledWorkflow(Workflow workflow) {
        log.info("Executing scheduled workflow ID: {}", workflow.getId());
        // Run with workflow owner's context, simulating an ADMIN so we bypass any specific permission checks
        // as the system is invoking this on behalf of the user.
        AccessContext context = AccessContext.of(
                workflow.getUserId(),
                workflow.getOrganizationId(),
                "ADMIN",
                null,
                null
        );
        executionService.executeWorkflow(workflow.getId(), context, Collections.emptyMap());
    }
}
