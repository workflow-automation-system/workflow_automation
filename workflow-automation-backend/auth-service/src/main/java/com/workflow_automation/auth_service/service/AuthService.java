package com.workflow_automation.auth_service.service;

import com.workflow_automation.auth_service.dto.*;
import com.workflow_automation.auth_service.dto.audit.AuditLogRequest;
import com.workflow_automation.auth_service.entity.*;
import com.workflow_automation.auth_service.dto.InviteRequest;
import com.workflow_automation.auth_service.dto.organization.OrganizationMemberSyncRequest;
import com.workflow_automation.auth_service.repository.UserRepository;
import com.workflow_automation.auth_service.security.JwtUtil;
import com.workflow_automation.auth_service.dto.organization.OrganizationMemberResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final OrganizationClient organizationClient;
    private final EmailValidationService emailValidationService;
    private final AuditClient auditClient;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.backend-url:http://localhost:8085}")
    private String backendUrl;

    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        // Validate email format, domain, and MX records
        String emailError = emailValidationService.validate(email);
        if (emailError != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, emailError);
        }

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }

        String domain = extractDomain(email);
        
        OrganizationSummary organization = null;
        if (request.getOrganizationName() != null && !request.getOrganizationName().isBlank()) {
            organization = organizationClient.resolveOrganization(
                    request.getOrganizationName().trim(), domain);
        } else {
            organization = organizationClient.resolveOrganization("", domain);
        }

        Role assignedRole = isFirstOrganizationMember(organization) ? Role.ADMIN : Role.USER;
        log.info("Registration: email={}, assignedRole={}, orgId={}, orgMemberCount={}",
                email, assignedRole,
                organization != null ? organization.getId() : null,
                organization != null ? organization.getMemberCount() : null);

        String verificationToken = UUID.randomUUID().toString();

        User user = User.builder()
                .name(request.getName() != null ? request.getName().trim() : null)
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(assignedRole)
                .organizationId(organization != null ? organization.getId() : null)
                .enabled(false)
                .verificationToken(verificationToken)
                .verificationTokenExpiresAt(LocalDateTime.now().plusHours(24))
                .build();

        User savedUser = userRepository.save(user);
        if (savedUser.getOrganizationId() != null) {
            try {
                organizationClient.syncMember(
                        savedUser.getOrganizationId(),
                        OrganizationMemberSyncRequest.builder()
                                .userId(savedUser.getId())
                                .name(savedUser.getName())
                                .email(savedUser.getEmail())
                                .role(resolveRole(savedUser).name())
                                .department(request.getDepartment())
                                .jobTitle(request.getJobTitle())
                                .status(MemberStatus.PENDING.name())
                                .build()
                );
            } catch (Exception e) {
                log.error("Failed to sync pending member for userId={}: {}", savedUser.getId(), e.getMessage());
            }
        }

        log.info("Registration saved: userId={}, role={}", savedUser.getId(), savedUser.getRole());

        recordAuthAudit(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getOrganizationId(),
                "USER_REGISTERED",
                "USER",
                savedUser.getId(),
                "SUCCESS",
                null,
                null,
                java.util.Map.of("role", savedUser.getRole().name())
        );

        String verificationLink = frontendUrl + "/verify-email?token=" + verificationToken;
        try {
            emailService.sendVerificationEmail(savedUser.getEmail(), verificationLink);
        } catch (Exception e) {
            log.error("Email send failed for userId={}, deleting user", savedUser.getId());
            userRepository.delete(savedUser);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Impossible d'envoyer l'email de verification. Veuillez verifier que l'adresse email est valide.");
        }

        return toAuthResponse(savedUser, null);
    }

    public AuthResponse login(LoginRequest request) {
        return login(request, null, null);
    }

    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    recordAuthAudit(
                            null,
                            email,
                            null,
                            "USER_LOGIN_FAILED",
                            "USER",
                            null,
                            "FAILURE",
                            ipAddress,
                            userAgent,
                            Map.of("reason", "EMAIL_NOT_FOUND")
                    );
                    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Cet email n'existe pas");
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            recordAuthAudit(
                    user.getId(),
                    user.getEmail(),
                    user.getOrganizationId(),
                    "USER_LOGIN_FAILED",
                    "USER",
                    user.getId(),
                    "FAILURE",
                    ipAddress,
                    userAgent,
                    Map.of("reason", "INVALID_PASSWORD")
            );
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Mot de passe incorrect");
        }

        if (!user.isEnabled()) {
            recordAuthAudit(
                    user.getId(),
                    user.getEmail(),
                    user.getOrganizationId(),
                    "USER_LOGIN_FAILED",
                    "USER",
                    user.getId(),
                    "FAILURE",
                    ipAddress,
                    userAgent,
                    Map.of("reason", "EMAIL_NOT_VERIFIED")
            );
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Veuillez verifier votre email avant de vous connecter");
        }

        user = ensureOrganization(user);
        log.info("Login: email={}, dbRole={}, orgId={}", email, user.getRole(), user.getOrganizationId());

        String token = jwtUtil.generateToken(user);
        log.info("Login: JWT generated with role={}", user.getRole());
        recordAuthAudit(
                user.getId(),
                user.getEmail(),
                user.getOrganizationId(),
                "USER_LOGIN",
                "USER",
                user.getId(),
                "SUCCESS",
                ipAddress,
                userAgent,
                Map.of("role", resolveRole(user).name())
        );

        return toAuthResponse(user, token);
    }


    public String verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid verification token"));

        if (user.isEnabled()) {
            return "Account already verified";
        }

        if (user.getVerificationTokenExpiresAt() == null ||
                user.getVerificationTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Verification token expired");
        }

        user.setEnabled(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiresAt(null);
        userRepository.save(user);
        syncOrganizationMember(user);
        log.info("Email verified: userId={}, role={}", user.getId(), user.getRole());

        return "Account verified successfully";
    }

    @org.springframework.transaction.annotation.Transactional
    public AuthResponse acceptInvitation(AcceptInvitationRequest request) {
        OrganizationMemberResponse member = organizationClient.getMemberByToken(request.getToken());
        if (member == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid or expired invitation token");
        }

        if (userRepository.existsByEmail(member.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already registered");
        }

        User user = User.builder()
                .email(member.getEmail())
                .name(member.getName())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(parseRole(member.getRole()))
                .organizationId(member.getOrganizationId() != null ? member.getOrganizationId() : null)
                .enabled(true)
                .build();

        User savedUser = userRepository.save(user);

        organizationClient.acceptInvitation(request.getToken(), savedUser.getId(), savedUser.getEmail(), savedUser.getName());

        return toAuthResponse(savedUser, jwtUtil.generateToken(savedUser));
    }

    public String resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new RuntimeException("Email not found"));

        if (user.isEnabled()) {
            throw new RuntimeException("Email already verified");
        }

        String verificationToken = UUID.randomUUID().toString();
        user.setVerificationToken(verificationToken);
        user.setVerificationTokenExpiresAt(LocalDateTime.now().plusHours(24));
        userRepository.save(user);

        String verificationLink = frontendUrl + "/verify-email?token=" + verificationToken;
        emailService.sendVerificationEmail(user.getEmail(), verificationLink);

        return "Verification email resent successfully";
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return;
        }

        String resetToken = UUID.randomUUID().toString();
        user.setResetPasswordToken(resetToken);
        user.setResetPasswordTokenExpiresAt(LocalDateTime.now().plusHours(1));
        userRepository.save(user);

        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;
        emailService.sendPasswordResetEmail(user.getEmail(), resetLink);
    }

    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByResetPasswordToken(request.getToken())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Jeton invalide ou expiré"));

        if (user.getResetPasswordTokenExpiresAt() == null ||
                user.getResetPasswordTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Jeton invalide ou expiré");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiresAt(null);
        userRepository.save(user);
        log.info("Password reset successfully for userId={}", user.getId());
    }

    public AuthResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Veuillez verifier votre email avant de vous connecter");
        }

        user = ensureOrganization(user);
        return toAuthResponse(user, jwtUtil.generateToken(user));
    }

// Deprecated overload removed - not used



    private User ensureOrganization(User user) {
        OrganizationSummary organization = null;

        if (user.getOrganizationId() != null) {
            organization = organizationClient.getOrganizationSummary(user.getOrganizationId());
        }

        if (organization == null) {
            String domain = extractDomain(user.getEmail());
            organization = organizationClient.resolveOrganization(buildOrganizationName(domain), domain);
            user.setOrganizationId(organization != null ? organization.getId() : null);

            if (organization != null
                    && organization.getMemberCount() != null
                    && organization.getMemberCount() == 0
                    && (user.getRole() == null || user.getRole() == Role.USER)) {
                user.setRole(Role.ADMIN);
            }
        }

        if (user.getRole() == null) {
            user.setRole(Role.USER);
        }

        User savedUser = userRepository.save(user);
        syncOrganizationMember(savedUser);
        return savedUser;
    }

    private AuthResponse toAuthResponse(User user, String token) {
        OrganizationSummary organization = organizationClient.getOrganizationSummary(user.getOrganizationId());

        return AuthResponse.builder()
                .id(user.getId())
                .token(token)
                .email(user.getEmail())
                .name(user.getName())
                .department("Unassigned")
                .jobTitle(null)
                .role(resolveRole(user).name())
                .status(user.isEnabled() ? MemberStatus.ACCEPTED.name() : MemberStatus.PENDING.name())
                .organizationId(user.getOrganizationId())
                .organization(organization)
                .build();
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
                        .status(MemberStatus.ACCEPTED.name())
                        .build()
        );
    }

    private static final java.util.Set<String> PUBLIC_DOMAINS = java.util.Set.of(
            "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com", "mail.com", "live.com", "protonmail.com"
    );

    private String extractDomain(String email) {
        int separatorIndex = email.indexOf('@');
        if (separatorIndex < 0 || separatorIndex == email.length() - 1) {
            return null;
        }

        String domain = email.substring(separatorIndex + 1).toLowerCase(java.util.Locale.ROOT);
        if (PUBLIC_DOMAINS.contains(domain)) {
            return null;
        }
        return domain;
    }

    private String buildOrganizationName(String domain) {
        if (domain == null || domain.isBlank()) {
            return "Enterprise Workspace";
        }

        String root = domain.split("\\.")[0];
        if (root.isBlank()) {
            return "Enterprise Workspace";
        }

        return Character.toUpperCase(root.charAt(0)) + root.substring(1) + " Organization";
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

    private Role resolveRole(User user) {
        return user.getRole() == null ? Role.USER : user.getRole();
    }

    private Role parseRole(String rawRole) {
        if (rawRole == null || rawRole.isBlank()) {
            return Role.USER;
        }

        try {
            return Role.valueOf(rawRole.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            return Role.USER;
        }
    }

    private boolean isFirstOrganizationMember(OrganizationSummary organization) {
        return organization != null
                && organization.getMemberCount() != null
                && organization.getMemberCount() == 0L;
    }

    public List<AuthResponse> getAllUsers(Long organizationId) {
        return userRepository.findByOrganizationIdAndEnabledTrue(organizationId)
                .stream()
                .map(user -> toAuthResponse(user, null))
                .collect(Collectors.toList());
    }

    public List<MemberViewResponse> getOrganizationMembers(Long organizationId) {
        List<MemberViewResponse> responses = new java.util.ArrayList<>();
        
        List<com.workflow_automation.auth_service.dto.organization.OrganizationMemberResponse> orgMembers = 
                organizationClient.getAllMembers(organizationId);

        orgMembers.forEach(m -> {
            responses.add(MemberViewResponse.builder()
                    .type(m.getUserId() != null ? "MEMBER" : "INVITATION")
                    .id(m.getId())
                    .userId(m.getUserId())
                    .email(m.getEmail())
                    .name(m.getName())
                    .role(m.getRole())
                    .department(m.getDepartment() != null ? m.getDepartment() : "Unassigned")
                    .jobTitle(m.getJobTitle())
                    .status(m.getStatus() != null ? m.getStatus() : "PENDING")
                    .build());
        });
        
        return responses;
    }



    public void deleteUser(Long targetUserId, Long adminOrganizationId, Long adminUserId) {
        deleteUser(targetUserId, adminOrganizationId, adminUserId, null, null, null);
    }

    public void deleteUser(
            Long targetUserId,
            Long adminOrganizationId,
            Long adminUserId,
            String adminEmail,
            String ipAddress,
            String userAgent
    ) {
        if (targetUserId.equals(adminUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot remove yourself");
        }

        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!adminOrganizationId.equals(target.getOrganizationId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Cannot remove users outside your organization");
        }

        try {
            organizationClient.removeMember(target.getOrganizationId(), target.getId());
        } catch (Exception e) {
            log.warn("Failed to remove org member for userId={}: {}", targetUserId, e.getMessage());
        }

        userRepository.delete(target);
        log.info("User deleted: userId={}, by adminId={}", targetUserId, adminUserId);
        recordAuthAudit(
                adminUserId,
                adminEmail,
                adminOrganizationId,
                "ORGANIZATION_MEMBER_REMOVED",
                "ORGANIZATION_MEMBER",
                targetUserId,
                "SUCCESS",
                ipAddress,
                userAgent,
                Map.of(
                        "targetUserId", targetUserId,
                        "targetEmail", target.getEmail(),
                        "role", resolveRole(target).name()
                )
        );
    }

    public InvitationResponse inviteUser(InviteRequest request, Long adminOrganizationId) {
        return inviteUser(request, adminOrganizationId, null, null, null, null);
    }

    public InvitationResponse inviteUser(
            InviteRequest request,
            Long adminOrganizationId,
            Long adminUserId,
            String adminEmail,
            String ipAddress,
            String userAgent
    ) {
        OrganizationMemberResponse member = organizationClient.inviteMember(adminOrganizationId, request, adminUserId);
        return InvitationResponse.builder()
                .id(member.getId())
                .email(member.getEmail())
                .name(member.getName())
                .role(member.getRole() != null ? member.getRole() : Role.USER.name())
                .department(member.getDepartment())
                .jobTitle(member.getJobTitle())
                .status(MemberStatus.PENDING.name())
                .build();
    }

    public void cancelInvitation(
            Long invitationId,
            Long adminOrganizationId,
            Long adminUserId,
            String adminEmail,
            String ipAddress,
            String userAgent
    ) {
        organizationClient.cancelInvitation(adminOrganizationId, invitationId);
    }

    public List<InvitationResponse> listPendingInvitations(Long organizationId) {
        return organizationClient.listPendingInvitations(organizationId).stream()
                .map(m -> InvitationResponse.builder()
                        .id(m.getId())
                        .email(m.getEmail())
                        .name(m.getName())
                        .role(m.getRole() != null ? m.getRole() : Role.USER.name())
                        .department(m.getDepartment())
                        .jobTitle(m.getJobTitle())
                        .status(MemberStatus.PENDING.name())
                        .build())
                .collect(Collectors.toList());
    }



    public AuthResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String department = request.getDepartment() != null ? request.getDepartment().trim() : "Unassigned";
        if (!"Unassigned".equalsIgnoreCase(department)
                && user.getOrganizationId() != null
                && !organizationClient.departmentExists(user.getOrganizationId(), department)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Department does not exist. Ask an admin to create it first."
            );
        }

        user.setName(request.getName().trim());

        User savedUser = userRepository.save(user);
        if (savedUser.getOrganizationId() != null) {
            organizationClient.syncMember(
                    savedUser.getOrganizationId(),
                    OrganizationMemberSyncRequest.builder()
                            .userId(savedUser.getId())
                            .name(savedUser.getName())
                            .email(savedUser.getEmail())
                            .role(resolveRole(savedUser).name())
                            .department(request.getDepartment())
                            .jobTitle(request.getJobTitle())
                            .status(MemberStatus.ACCEPTED.name())
                            .build()
            );
        }

        log.info("Profile updated: userId={}", savedUser.getId());
        return toAuthResponse(savedUser, jwtUtil.generateToken(savedUser));
    }

    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mot de passe actuel incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed for userId={}", user.getId());
    }

    public void deleteSelf(String email, String ipAddress, String userAgent) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        try {
            organizationClient.removeMember(user.getOrganizationId(), user.getId());
        } catch (Exception e) {
            log.warn("Failed to remove org member for userId={}: {}", user.getId(), e.getMessage());
        }

        userRepository.delete(user);
        log.info("User deleted self: userId={}", user.getId());
        recordAuthAudit(
                user.getId(),
                user.getEmail(),
                user.getOrganizationId(),
                "USER_SELF_DELETED",
                "USER",
                user.getId(),
                "SUCCESS",
                ipAddress,
                userAgent,
                Map.of(
                        "userId", user.getId(),
                        "email", user.getEmail()
                )
        );
    }

    private void recordAuthAudit(
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
                .metadata(metadata)
                .build());
    }
}