package com.workflow_automation.auth_service.controller;

import com.workflow_automation.auth_service.dto.*;
import com.workflow_automation.auth_service.entity.User;
import com.workflow_automation.auth_service.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import com.workflow_automation.auth_service.service.AuthService;
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
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return ResponseEntity.ok(Map.of("message", authService.verifyEmail(request.getToken())));
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

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(authService.getCurrentUser(userDetails.getUsername()));
    }

    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AuthResponse> users(@AuthenticationPrincipal UserDetails userDetails) {
        AuthResponse admin = authService.getCurrentUser(userDetails.getUsername());
        return authService.getAllUsers(admin.getOrganizationId());
    }

    @PatchMapping("/admin/users/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateRole(
            @PathVariable Long userId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        AuthResponse admin = authService.getCurrentUser(userDetails.getUsername());
        String newRole = body.get("role");
        if (newRole == null || newRole.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Role is required"));
        }
        authService.updateUserRole(userId, newRole, admin.getOrganizationId());
        return ResponseEntity.ok(Map.of("message", "Role updated successfully"));
    }

    @DeleteMapping("/admin/users/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        AuthResponse admin = authService.getCurrentUser(userDetails.getUsername());
        authService.deleteUser(userId, admin.getOrganizationId(), admin.getId());
        return ResponseEntity.ok(Map.of("message", "User removed successfully"));
    }

    @PostMapping("/admin/invite")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> inviteUser(
            @Valid @RequestBody InviteRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        AuthResponse admin = authService.getCurrentUser(userDetails.getUsername());
        AuthResponse invited = authService.inviteUser(request, admin.getOrganizationId());
        return ResponseEntity.status(HttpStatus.CREATED).body(invited);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }
        authService.requestPasswordReset(email);
        return ResponseEntity.ok(Map.of("message", "If an account with that email exists, a password reset link has been sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("newPassword");
        if (token == null || token.isBlank() || newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Token and new password are required"));
        }
        authService.resetPassword(token, newPassword);
        return ResponseEntity.ok(Map.of("message", "Password has been reset successfully."));
    }

    @PatchMapping("/admin/departments/{oldName}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> renameDepartment(
            @PathVariable String oldName,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        AuthResponse admin = authService.getCurrentUser(userDetails.getUsername());
        String newName = body.get("name");
        if (newName == null || newName.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "New department name is required"));
        }
        authService.renameDepartment(oldName, newName, admin.getOrganizationId());
        return ResponseEntity.ok(Map.of("message", "Department renamed successfully"));
    }

    @DeleteMapping("/admin/departments/{name}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteDepartment(
            @PathVariable String name,
            @AuthenticationPrincipal UserDetails userDetails) {
        AuthResponse admin = authService.getCurrentUser(userDetails.getUsername());
        authService.deleteDepartment(name, admin.getOrganizationId());
        return ResponseEntity.ok(Map.of("message", "Department deleted successfully"));
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
}
