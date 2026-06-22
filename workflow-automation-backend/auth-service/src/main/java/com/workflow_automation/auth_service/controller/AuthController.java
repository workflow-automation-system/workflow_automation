package com.workflow_automation.auth_service.controller;

import com.workflow_automation.auth_service.dto.*;
import com.workflow_automation.auth_service.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.login(request, clientIp(httpRequest), httpRequest.getHeader("User-Agent")));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return ResponseEntity.ok(Map.of("message", authService.verifyEmail(request.getToken())));
    }

    @PostMapping("/accept-invitation")
    public ResponseEntity<?> acceptInvitation(@Valid @RequestBody AcceptInvitationRequest request) {
        return ResponseEntity.ok(authService.acceptInvitation(request));
    }



    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        return ResponseEntity.ok(Map.of("message", authService.resendVerificationEmail(request.getEmail())));
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(frontendUrl + "/verify-email?token=" + token));
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    @GetMapping("/invitations/accept")
    public ResponseEntity<?> acceptInvitationRedirect(@RequestParam String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(frontendUrl + "/accept-invitation?token=" + token));
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(authService.getCurrentUser(userDetails.getUsername()));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(authService.updateProfile(userDetails.getUsername(), request));
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        authService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(Map.of("message", "Mot de passe changé avec succès"));
    }

    @DeleteMapping("/me")
    public ResponseEntity<?> deleteSelf(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest
    ) {
        authService.deleteSelf(userDetails.getUsername(), clientIp(httpRequest), httpRequest.getHeader("User-Agent"));
        return ResponseEntity.ok(Map.of("message", "Compte supprimé avec succès"));
    }

    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AuthResponse> users(@AuthenticationPrincipal UserDetails userDetails) {
        AuthResponse admin = authService.getCurrentUser(userDetails.getUsername());
        return authService.getAllUsers(admin.getOrganizationId());
    }

    @GetMapping("/admin/members")
    @PreAuthorize("hasRole('ADMIN')")
    public List<MemberViewResponse> members(@AuthenticationPrincipal UserDetails userDetails) {
        AuthResponse admin = authService.getCurrentUser(userDetails.getUsername());
        return authService.getOrganizationMembers(admin.getOrganizationId());
    }

    @GetMapping("/admin/invitations")
    @PreAuthorize("hasRole('ADMIN')")
    public List<InvitationResponse> invitations(@AuthenticationPrincipal UserDetails userDetails) {
        AuthResponse admin = authService.getCurrentUser(userDetails.getUsername());
        return authService.listPendingInvitations(admin.getOrganizationId());
    }

// Update role endpoint removed - organization has a single admin


    @DeleteMapping("/admin/users/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest
    ) {
        AuthResponse admin = authService.getCurrentUser(userDetails.getUsername());
        authService.deleteUser(
                userId,
                admin.getOrganizationId(),
                admin.getId(),
                admin.getEmail(),
                clientIp(httpRequest),
                httpRequest.getHeader("User-Agent")
        );
        return ResponseEntity.ok(Map.of("message", "User removed successfully"));
    }

    @DeleteMapping("/admin/invitations/{invitationId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> cancelInvitation(
            @PathVariable Long invitationId,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest
    ) {
        AuthResponse admin = authService.getCurrentUser(userDetails.getUsername());
        authService.cancelInvitation(
                invitationId,
                admin.getOrganizationId(),
                admin.getId(),
                admin.getEmail(),
                clientIp(httpRequest),
                httpRequest.getHeader("User-Agent")
        );
        return ResponseEntity.ok(Map.of("message", "Invitation cancelled successfully"));
    }

    @PostMapping("/admin/invite")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> inviteUser(
            @Valid @RequestBody InviteRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest
    ) {
        AuthResponse admin = authService.getCurrentUser(userDetails.getUsername());
        InvitationResponse invited = authService.inviteUser(
                request,
                admin.getOrganizationId(),
                admin.getId(),
                admin.getEmail(),
                clientIp(httpRequest),
                httpRequest.getHeader("User-Agent")
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(invited);
    }

    @PatchMapping("/admin/members/{memberId}/department")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateMemberDepartment(
            @PathVariable Long memberId,
            @Valid @RequestBody UpdateMemberDepartmentRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        AuthResponse admin = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(authService.updateMemberDepartment(
                admin.getOrganizationId(),
                memberId,
                request
        ));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> handleResponseStatus(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode())
                .body(Map.of("message", ex.getReason() != null ? ex.getReason() : "An error occurred"));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntime(RuntimeException ex) {
        return ResponseEntity.badRequest()
                .body(Map.of("message", ex.getMessage() != null ? ex.getMessage() : "An error occurred"));
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}