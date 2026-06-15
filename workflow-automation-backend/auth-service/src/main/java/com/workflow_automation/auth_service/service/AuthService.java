package com.workflow_automation.auth_service.service;

import com.workflow_automation.auth_service.dto.*;
import com.workflow_automation.auth_service.entity.*;
import com.workflow_automation.auth_service.dto.InviteRequest;
import com.workflow_automation.auth_service.dto.organization.OrganizationMemberSyncRequest;
import com.workflow_automation.auth_service.repository.UserRepository;
import com.workflow_automation.auth_service.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.Locale;
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
        if (domain == null || domain.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Adresse email invalide");
        }

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
                .department(request.getDepartment() != null ? request.getDepartment().trim() : "Unassigned")
                .jobTitle(trimToNull(request.getJobTitle()))
                .password(passwordEncoder.encode(request.getPassword()))
                .role(assignedRole)
                .organizationId(organization != null ? organization.getId() : null)
                .enabled(false)
                .verificationToken(verificationToken)
                .verificationTokenExpiresAt(LocalDateTime.now().plusHours(24))
                .build();

        User savedUser = userRepository.save(user);
        log.info("Registration saved: userId={}, role={}", savedUser.getId(), savedUser.getRole());

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
        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Cet email n'existe pas"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Mot de passe incorrect");
        }

        if (!user.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Veuillez verifier votre email avant de vous connecter");
        }

        user = ensureOrganization(user);
        log.info("Login: email={}, dbRole={}, orgId={}", email, user.getRole(), user.getOrganizationId());

        String token = jwtUtil.generateToken(user);
        log.info("Login: JWT generated with role={}", user.getRole());

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

    public AuthResponse acceptInvitation(AcceptInvitationRequest request) {
        User user = userRepository.findByVerificationToken(request.getToken())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid invitation link"));

        if (user.getVerificationTokenExpiresAt() == null ||
                user.getVerificationTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invitation link expired");
        }

        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEnabled(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiresAt(null);
        userRepository.save(user);
        syncOrganizationMember(user);
        log.info("Invitation accepted: userId={}, role={}, orgId={}", user.getId(), user.getRole(), user.getOrganizationId());

        return toAuthResponse(user, null);
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

    public void updateUserRole(Long targetUserId, String newRole, Long adminOrganizationId) {
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!adminOrganizationId.equals(target.getOrganizationId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Cannot modify users outside your organization");
        }

        Role role = parseRole(newRole);
        target.setRole(role);
        userRepository.save(target);
        syncOrganizationMember(target);

        organizationClient.updateMemberRole(adminOrganizationId, targetUserId, role.name());
        log.info("Role updated: userId={}, newRole={}, by orgId={}", targetUserId, role, adminOrganizationId);
    }

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
                .department(user.getDepartment())
                .jobTitle(user.getJobTitle())
                .role(resolveRole(user).name())
                .organizationId(user.getOrganizationId())
                .organization(organization)
                .build();
    }

    private void syncOrganizationMember(User user) {
        organizationClient.syncMember(
                user.getOrganizationId(),
                OrganizationMemberSyncRequest.builder()
                        .userId(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(resolveRole(user).name())
                        .department(defaultIfBlank(user.getDepartment(), "Unassigned"))
                        .jobTitle(defaultIfBlank(user.getJobTitle(), "Team Member"))
                        .status(user.isEnabled() ? "Active" : "Pending")
                        .build()
        );
    }

    private String extractDomain(String email) {
        int separatorIndex = email.indexOf('@');
        if (separatorIndex < 0 || separatorIndex == email.length() - 1) {
            return null;
        }

        return email.substring(separatorIndex + 1).toLowerCase(Locale.ROOT);
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
        return userRepository.findByOrganizationId(organizationId)
                .stream()
                .map(user -> toAuthResponse(user, null))
                .collect(Collectors.toList());
    }

    public void deleteUser(Long targetUserId, Long adminOrganizationId, Long adminUserId) {
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
    }

    public AuthResponse inviteUser(InviteRequest request, Long adminOrganizationId) {
        String email = request.getEmail().trim().toLowerCase();

        String emailError = emailValidationService.validate(email);
        if (emailError != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, emailError);
        }

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This email is already registered");
        }

        Role assignedRole = parseRole(request.getRole());

        String initialPassword = UUID.randomUUID().toString().substring(0, 12);
        String verificationToken = UUID.randomUUID().toString();

        User user = User.builder()
                .name(request.getName() != null ? request.getName().trim() : email)
                .email(email)
                .department(request.getDepartment() != null ? request.getDepartment().trim() : "Unassigned")
                .jobTitle(trimToNull(request.getJobTitle()))
                .password(passwordEncoder.encode(initialPassword))
                .role(assignedRole)
                .organizationId(adminOrganizationId)
                .enabled(false)
                .verificationToken(verificationToken)
                .verificationTokenExpiresAt(LocalDateTime.now().plusHours(72))
                .build();

        User savedUser = userRepository.save(user);

        String invitationLink = frontendUrl + "/accept-invitation?token=" + verificationToken;
        try {
            emailService.sendInvitationEmail(savedUser.getEmail(), savedUser.getName(), invitationLink);
        } catch (Exception e) {
            log.error("Invitation email failed for {}, deleting user: {}", email, e.getMessage());
            userRepository.delete(savedUser);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Impossible d'envoyer l'email d'invitation. Veuillez verifier que l'adresse email est valide.");
        }

        syncOrganizationMember(savedUser);
        log.info("User invited: userId={}, role={}, orgId={}", savedUser.getId(), assignedRole, adminOrganizationId);

        return toAuthResponse(savedUser, null);
    }
}
