package com.workflow_automation.template_service.repository;

import com.workflow_automation.template_service.entity.WorkflowTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

import java.util.List;

@Repository
public interface WorkflowTemplateRepository extends JpaRepository<WorkflowTemplate, Long> {

    List<WorkflowTemplate> findByActiveTrue();

    List<WorkflowTemplate> findByUserId(Long userId);

    List<WorkflowTemplate> findByCategoryAndActiveTrue(String category);

    List<WorkflowTemplate> findByOrganizationIdAndActiveTrue(Long organizationId);

    List<WorkflowTemplate> findByOrganizationId(Long organizationId);

    Optional<WorkflowTemplate> findByIdAndOrganizationId(Long id, Long organizationId);
}