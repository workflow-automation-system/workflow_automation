package com.workflow_automation.workflow_service.repository;

import com.workflow_automation.workflow_service.entity.Execution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExecutionRepository extends JpaRepository<Execution, Long> {
    List<Execution> findByWorkflowIdOrderByStartedAtDesc(Long workflowId);
}
