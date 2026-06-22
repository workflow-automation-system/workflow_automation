package com.workflow_automation.auth_service.service;

import com.workflow_automation.auth_service.dto.*;
import com.workflow_automation.auth_service.dto.audit.AuditLogRequest;
import com.workflow_automation.auth_service.dto.organization.OrganizationMemberSyncRequest;
import com.workflow_automation.auth_service.entity.*;
import com.workflow_automation.auth_service.repository.InvitationRepository;
import com.workflow_automation.auth_service.repository.UserRepository;
import com.workflow_automation.auth_service.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final EmailValidationService emailValidationService;
    private final OrganizationClient organizationClient;
    private final AuditClient auditClient;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Transactional
    public InvitationResponse inviteUser(
            InviteRequest request,
            Long adminOrganizationId,
            Long adminUserId,
            String adminEmail,
            String ipAddress,
            String userAgent
    ) {
        String email = request.getEmail().trim().toLowerCase();

        String emailError = emailValidationService.validate(email);
        if (emailError != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, emailError);
        }

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This email is already registered");
        }

        if (invitationRepository.existsByEmailAndOrganizationIdAndStatus(
                email, adminOrganizationId, MemberStatus.PENDING)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An invitation is already pending for this email");
        }

        String token = UUID.randomUUID().toString();
        Invitation invitation = Invitation.builder()
                .email(email)
                .name(request.getName() != null ? request.getName().trim() : email)
                .department(request.getDepartment() != null ? request.getDepartment().trim() : "Unassigned")
                .jobTitle(trimToNull(request.getJobTitle()))
                .organizationId(adminOrganizationId)
                .invitedByUserId(adminUserId)
                .role(Role.USER)
                .token(token)
                .expiresAt(LocalDateTime.now().plusHours(72))
                .status(MemberStatus.PENDING)
                .build();

        Invitation saved = invitationRepository.save(invitation);

        String invitationLink = frontendUrl + "/accept-invitation?token=" + token;
        try {
            emailService.sendInvitationEmail(saved.getEmail(), saved.getName(), invitationLink);
        } catch (Exception e) {
            log.error("Invitation email failed for {}, deleting invitation: {}", email, e.getMessage());
            invitationRepository.delete(saved);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Impossible d'envoyer l'email d'invitation. Veuillez verifier que l'adresse email est valide.");
        }

        log.info("Invitation created: invitationId={}, orgId={}", saved.getId(), adminOrganizationId);
        recordAudit(
                adminUserId,
                adminEmail,
                adminOrganizationId,
                "ORGANIZATION_MEMBER_INVITED",
                "INVITATION",
                saved.getId(),
                "SUCCESS",
                ipAddress,
                userAgent,
                Map.of(
                        "invitationId", saved.getId(),
                        "targetEmail", saved.getEmail(),
                        "role", Role.USER.name(),
                        "status", MemberStatus.PENDING.name()
                )
        );

        return toInvitationResponse(saved);
    }

    @Transactional
    public AuthResponse acceptInvitation(AcceptInvitationRequest request) {
        Invitation invitation = invitationRepository
                .findByTokenAndStatus(request.getToken(), MemberStatus.PENDING)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Invalid invitation link"));

        if (invitation.getExpiresAt() == null || invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            invitation.setStatus(MemberStatus.EXPIRED);
            invitationRepository.save(invitation);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invitation link expired");
        }

        if (userRepository.existsByEmail(invitation.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This email is already registered");
        }

        User user = User.builder()
                .email(invitation.getEmail())
                .name(invitation.getName())
                .password(passwordEncoder.encode(request.getPassword()))
                .department(defaultIfBlank(invitation.getDepartment(), "Unassigned"))
                .jobTitle(invitation.getJobTitle())
                .role(invitation.getRole() != null ? invitation.getRole() : Role.USER)
                .organizationId(invitation.getOrganizationId())
                .enabled(true)
                .build();

        User savedUser = userRepository.save(user);

        invitation.setStatus(MemberStatus.ACCEPTED);
        invitation.setAcceptedUserId(savedUser.getId());
        invitation.setAcceptedAt(LocalDateTime.now());
        invitationRepository.save(invitation);

        syncOrganizationMember(savedUser);

        log.info("Invitation accepted: userId={}, invitationId={}, orgId={}",
                savedUser.getId(), invitation.getId(), savedUser.getOrganizationId());

        return toAuthResponse(savedUser, jwtUtil.generateToken(savedUser));
    }

    @Transactional
    public void cancelInvitation(
            Long invitationId,
            Long adminOrganizationId,
            Long adminUserId,
            String adminEmail,
            String ipAddress,
            String userAgent
    ) {
        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitation not found"));

        if (!adminOrganizationId.equals(invitation.getOrganizationId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Cannot cancel invitations outside your organization");
        }

        if (invitation.getStatus() != MemberStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending invitations can be cancelled");
        }

        invitation.setStatus(MemberStatus.EXPIRED);
        invitationRepository.save(invitation);

        log.info("Invitation cancelled: invitationId={}, by adminId={}", invitationId, adminUserId);
        recordAudit(
                adminUserId,
                adminEmail,
                adminOrganizationId,
                "ORGANIZATION_INVITATION_CANCELLED",
                "INVITATION",
                invitationId,
                "SUCCESS",
                ipAddress,
                userAgent,
                Map.of(
                        "invitationId", invitationId,
                        "targetEmail", invitation.getEmail()
                )
        );
    }

    public List<InvitationResponse> listPendingInvitations(Long organizationId) {
        return invitationRepository
                .findByOrganizationIdAndStatusOrderByCreatedAtDesc(organizationId, MemberStatus.PENDING)
                .stream()
                .map(this::toInvitationResponse)
                .collect(Collectors.toList());
    }

    public List<MemberViewResponse> getOrganizationMembers(Long organizationId) {
        List<MemberViewResponse> views = new ArrayList<>();

        userRepository.findByOrganizationIdAndEnabledTrue(organizationId)
                .forEach(user -> views.add(MemberViewResponse.builder()
                        .type("MEMBER")
                        .id(user.getId())
                        .userId(user.getId())
                        .email(user.getEmail())
                        .name(user.getName())
                        .role(resolveRole(user).name())
                        .department(user.getDepartment())
                        .jobTitle(user.getJobTitle())
                        .status(MemberStatus.ACCEPTED.name())
                        .build()));

        invitationRepository
                .findByOrganizationIdAndStatusOrderByCreatedAtDesc(organizationId, MemberStatus.PENDING)
                .forEach(invitation -> views.add(MemberViewResponse.builder()
                        .type("INVITATION")
                        .id(invitation.getId())
                        .userId(null)
                        .email(invitation.getEmail())
                        .name(invitation.getName())
                        .role(invitation.getRole() != null ? invitation.getRole().name() : Role.USER.name())
                        .department(invitation.getDepartment())
                        .jobTitle(invitation.getJobTitle())
                        .status(MemberStatus.PENDING.name())
                        .expiresAt(invitation.getExpiresAt())
                        .build()));

        views.sort(Comparator.comparing(MemberViewResponse::getName,
                Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)));

        return views;
    }

    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void expireInvitations() {
        List<Invitation> expired = invitationRepository
                .findByStatusAndExpiresAtBefore(MemberStatus.PENDING, LocalDateTime.now());

        if (expired.isEmpty()) {
            return;
        }

        expired.forEach(invitation -> invitation.setStatus(MemberStatus.EXPIRED));
        invitationRepository.saveAll(expired);
        log.info("Expired {} pending invitations", expired.size());
    }

    private void syncOrganizationMember(User user) {
        if (user.getOrganizationId() == null || !user.isEnabled()) {
            return;
        }

        organizationClient.syncMember(
                user.getOrganizationId(),
                OrganizationMemberSyncRequest.builder()
                        .userId(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(resolveRole(user).name())
                        .department(defaultIfBlank(user.getDepartment(), "Unassigned"))
                        .jobTitle(defaultIfBlank(user.getJobTitle(), "Team Member"))
                        .status(MemberStatus.ACCEPTED.name())
                        .build()
        );
    }

    private InvitationResponse toInvitationResponse(Invitation invitation) {
        return InvitationResponse.builder()
                .id(invitation.getId())
                .type("INVITATION")
                .userId(null)
                .email(invitation.getEmail())
                .name(invitation.getName())
                .role(invitation.getRole() != null ? invitation.getRole().name() : Role.USER.name())
                .department(invitation.getDepartment())
                .jobTitle(invitation.getJobTitle())
                .status(invitation.getStatus().name())
                .expiresAt(invitation.getExpiresAt())
                .createdAt(invitation.getCreatedAt())
                .build();
    }

    private AuthResponse toAuthResponse(User user, String token) {
        OrganizationSummary organization = organizationClient.getOrganizationSummary(user.getOrganizationId());

        return AuthResponse.builder()
                .id(user.getId())
                .token(token)
                .email(user.getEmail())
                .name(user.getName())
                .department(user.getDepartment())
                .jobTitle(user.getJobTitle())
                .role(resolveRole(user).name())
                .status(MemberStatus.ACCEPTED.name())
                .organizationId(user.getOrganizationId())
                .organization(organization)
                .build();
    }

    private Role resolveRole(User user) {
        return user.getRole() == null ? Role.USER : user.getRole();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private void recordAudit(
            Long actorUserId,
            String actorEmail,
            Long organizationId,
            String action,
            String entityType,
            Long entityId,
            String outcome,
            String ipAddress,
            String userAgent,
            Map<String, Object> metadata
    ) {
        auditClient.record(AuditLogRequest.builder()
                .userId(actorUserId)
                .actorEmail(actorEmail)
                .organizationId(organizationId)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .outcome(outcome)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .metadata(metadata)
                .build());
    }
}
