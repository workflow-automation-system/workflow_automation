package com.workflow_automation.workflow_service.repository;

import com.workflow_automation.workflow_service.entity.Workflow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
@Repository
public interface WorkflowRepository extends JpaRepository<Workflow, Long> {
    // This interface gives you save(), findAll(), findById(), etc. for free!
    List<Workflow> findByUserId(Long userId);
    Optional<Workflow> findByIdAndUserId(Long id, Long userId);

    boolean existsByIdAndUserId(Long id, Long userId);
}