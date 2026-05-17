package com.workflow_automation.organization_service.repository;

import com.workflow_automation.organization_service.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrganizationRepository extends JpaRepository<Organization, Long> {
    Optional<Organization> findByNameIgnoreCase(String name);
    Optional<Organization> findByDomainIgnoreCase(String domain);
}
