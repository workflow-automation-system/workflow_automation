package com.workflow_automation.template_service.repository;

import com.workflow_automation.template_service.entity.WorkflowTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkflowTemplateRepository extends JpaRepository<WorkflowTemplate, Long> {

    List<WorkflowTemplate> findByActiveTrue();

    List<WorkflowTemplate> findByUserId(Long userId);
}
