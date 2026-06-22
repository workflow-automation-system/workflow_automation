package com.workflow_automation.auth_service.config;

import com.workflow_automation.auth_service.entity.Invitation;
import com.workflow_automation.auth_service.entity.MemberStatus;
import com.workflow_automation.auth_service.entity.User;
import com.workflow_automation.auth_service.repository.InvitationRepository;
import com.workflow_automation.auth_service.repository.UserRepository;
import com.workflow_automation.auth_service.service.OrganizationClient;
import com.workflow_automation.auth_service.dto.organization.OrganizationMemberResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@Order(10)
@RequiredArgsConstructor
public class InvitationDataMigration implements ApplicationRunner {

    private final UserRepository userRepository;
    private final InvitationRepository invitationRepository;
    private final OrganizationClient organizationClient;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<User> pendingUsers = userRepository.findByEnabledFalseAndVerificationTokenIsNotNull();

        int migrated = 0;
        for (User user : pendingUsers) {
            if (user.getVerificationToken() == null || user.getOrganizationId() == null) {
                continue;
            }

            OrganizationMemberResponse orgMember = organizationClient.getMember(
                    user.getOrganizationId(), user.getId());
            if (orgMember == null) {
                continue;
            }

            if (invitationRepository.existsByEmailAndOrganizationIdAndStatus(
                    user.getEmail(), user.getOrganizationId(), MemberStatus.PENDING)) {
                continue;
            }

            MemberStatus status = user.getVerificationTokenExpiresAt() != null
                    && user.getVerificationTokenExpiresAt().isBefore(LocalDateTime.now())
                    ? MemberStatus.EXPIRED
                    : MemberStatus.PENDING;

            Invitation invitation = Invitation.builder()
                    .email(user.getEmail())
                    .name(user.getName())
                    .department(user.getDepartment())
                    .jobTitle(user.getJobTitle())
                    .organizationId(user.getOrganizationId())
                    .role(user.getRole())
                    .token(user.getVerificationToken())
                    .expiresAt(user.getVerificationTokenExpiresAt())
                    .status(status)
                    .createdAt(user.getCreatedAt())
                    .build();

            invitationRepository.save(invitation);

            try {
                organizationClient.removeMember(user.getOrganizationId(), user.getId());
            } catch (Exception e) {
                log.warn("Failed to remove legacy org member for userId={}: {}", user.getId(), e.getMessage());
            }

            userRepository.delete(user);
            migrated++;
        }

        if (migrated > 0) {
            log.info("Migrated {} legacy invitation users to invitations table", migrated);
        }
    }
}
