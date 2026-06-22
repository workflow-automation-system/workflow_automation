package com.workflow_automation.organization_service.repository;

import com.workflow_automation.organization_service.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Long> {

    List<Department> findAllByOrganization_IdOrderByNameAsc(Long organizationId);

    Optional<Department> findByOrganization_IdAndNameIgnoreCase(Long organizationId, String name);

    boolean existsByOrganization_IdAndNameIgnoreCase(Long organizationId, String name);
}
