package com.workflow_automation.workflow_service.repository;

import com.workflow_automation.workflow_service.entity.WorkflowPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowPermissionRepository extends JpaRepository<WorkflowPermission, Long> {

    Optional<WorkflowPermission> findByWorkflow_IdAndUserId(Long workflowId, Long userId);

    List<WorkflowPermission> findByWorkflow_Id(Long workflowId);

    List<WorkflowPermission> findByUserIdAndOrganizationId(Long userId, Long organizationId);

    @Query("SELECT wp FROM WorkflowPermission wp WHERE wp.workflow.id = :workflowId AND wp.organizationId = :organizationId")
    List<WorkflowPermission> findByWorkflowIdAndOrganizationId(@Param("workflowId") Long workflowId, @Param("organizationId") Long organizationId);

    void deleteByWorkflow_IdAndUserId(Long workflowId, Long userId);

    long countByWorkflow_Id(Long workflowId);
}
