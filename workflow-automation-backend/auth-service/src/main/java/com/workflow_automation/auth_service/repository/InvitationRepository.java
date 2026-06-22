package com.workflow_automation.auth_service.repository;

import com.workflow_automation.auth_service.entity.Invitation;
import com.workflow_automation.auth_service.entity.MemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface InvitationRepository extends JpaRepository<Invitation, Long> {

    Optional<Invitation> findByTokenAndStatus(String token, MemberStatus status);

    boolean existsByEmailAndOrganizationIdAndStatus(String email, Long organizationId, MemberStatus status);

    List<Invitation> findByOrganizationIdAndStatusOrderByCreatedAtDesc(Long organizationId, MemberStatus status);

    List<Invitation> findByStatusAndExpiresAtBefore(MemberStatus status, LocalDateTime expiresAt);
}
