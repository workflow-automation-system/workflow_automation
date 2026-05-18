package com.workflow_automation.auth_service.service;

import com.workflow_automation.auth_service.dto.*;
import com.workflow_automation.auth_service.entity.*;
import com.workflow_automation.auth_service.dto.organization.OrganizationMemberSyncRequest;
import com.workflow_automation.auth_service.repository.UserRepository;
import com.workflow_automation.auth_service.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final OrganizationClient organizationClient;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.backend-url:http://localhost:8085}")
    private String backendUrl;

    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }

        OrganizationSummary organization = null;
        if (request.getOrganizationName() != null && !request.getOrganizationName().isBlank()) {
            organization = organizationClient.resolveOrganization(
                    request.getOrganizationName().trim(),
                    extractDomain(email)
            );
        } else {
            organization = organizationClient.resolveOrganization("", extractDomain(email));
        }
        
        Role assignedRole = isFirstOrganizationMember(organization) ? Role.ADMIN : Role.USER;
        String verificationToken = UUID.randomUUID().toString();

        User user = User.builder()
                .name(request.getName() != null ? request.getName().trim() : null)
                .email(email)
                .department(request.getDepartment() != null ? request.getDepartment().trim() : "Unassigned")
                .jobTitle(trimToNull(request.getJobTitle()))
                .password(passwordEncoder.encode(request.getPassword()))
                .role(assignedRole)
                .organizationId(organization != null ? organization.getId() : null)
                .enabled(true) // Automatically enable the user since Railway blocks SMTP
                .verificationToken(verificationToken)
                .verificationTokenExpiresAt(LocalDateTime.now().plusHours(24))
                .build();

        User savedUser = userRepository.save(user);
        syncOrganizationMember(savedUser);

        // String verificationLink = backendUrl + "/api/auth/verify?token=" + verificationToken;
        // emailService.sendVerificationEmail(savedUser.getEmail(), verificationLink);

        return toAuthResponse(savedUser, null);
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        if (!user.isEnabled()) {
            throw new RuntimeException("Please verify your email before login");
        }

        user = ensureOrganization(user);
        String token = jwtUtil.generateToken(user.getEmail());

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

        return "Account verified successfully";
    }


    public AuthResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user = ensureOrganization(user);
        return toAuthResponse(user, null);
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

    private boolean isFirstOrganizationMember(OrganizationSummary organization) {
        return organization != null
                && organization.getMemberCount() != null
                && organization.getMemberCount() == 0L;
    }
}
