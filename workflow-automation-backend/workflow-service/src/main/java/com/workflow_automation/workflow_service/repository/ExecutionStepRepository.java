package com.workflow_automation.workflow_service.repository;

import com.workflow_automation.workflow_service.entity.ExecutionStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExecutionStepRepository extends JpaRepository<ExecutionStep, Long> {
    List<ExecutionStep> findByExecutionIdOrderByExecutedAtAsc(Long executionId);
}
