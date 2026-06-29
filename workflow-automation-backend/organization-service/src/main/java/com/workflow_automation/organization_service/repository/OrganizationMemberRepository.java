package com.workflow_automation.organization_service.repository;

import com.workflow_automation.organization_service.entity.OrganizationMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrganizationMemberRepository
        extends JpaRepository<OrganizationMember,Long> {

    long countByOrganization_Id(Long organizationId);

    List<OrganizationMember>
    findAllByOrganization_IdOrderByCreatedAtAsc(
            Long organizationId
    );

    List<OrganizationMember>
    findAllByOrganization_Id(
            Long organizationId
    );

    Optional<OrganizationMember>
    findByUserId(Long userId);

    Optional<OrganizationMember>
    findByOrganization_IdAndUserId(Long organizationId, Long userId);

    Optional<OrganizationMember> findByInviteToken(String token);

    Optional<OrganizationMember> findByOrganization_IdAndEmailIgnoreCase(Long organizationId, String email);

    Optional<OrganizationMember> findByIdAndOrganization_Id(Long id, Long organizationId);
}
