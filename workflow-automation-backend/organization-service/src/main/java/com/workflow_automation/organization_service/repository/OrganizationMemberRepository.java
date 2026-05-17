package com.workflow_automation.organization_service.repository;

import com.workflow_automation.organization_service.entity.OrganizationMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrganizationMemberRepository extends JpaRepository<OrganizationMember, Long> {
    long countByOrganization_Id(Long organizationId);
    List<OrganizationMember> findAllByOrganization_IdOrderByCreatedAtAsc(Long organizationId);
    Optional<OrganizationMember> findByUserId(Long userId);
}
