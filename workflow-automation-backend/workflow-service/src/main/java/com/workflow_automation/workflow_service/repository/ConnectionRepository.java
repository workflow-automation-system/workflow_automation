package com.workflow_automation.workflow_service.repository;

import com.workflow_automation.workflow_service.entity.Connection;
import com.workflow_automation.workflow_service.entity.Workflow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConnectionRepository extends JpaRepository<Connection, Long> {
    void deleteByWorkflow(Workflow workflow);
}
