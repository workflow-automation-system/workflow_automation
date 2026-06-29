package com.workflow_automation.auth_service.service;

import com.workflow_automation.auth_service.dto.OrganizationSummary;
import com.workflow_automation.auth_service.dto.organization.OrganizationMemberResponse;
import com.workflow_automation.auth_service.dto.organization.OrganizationMemberSyncRequest;
import com.workflow_automation.auth_service.dto.organization.OrganizationResolveRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class OrganizationClient {

    private final RestClient restClient;

    public OrganizationClient(@Value("${organization.service.url:http://localhost:8083/api/organizations}") String organizationServiceUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(organizationServiceUrl)
                .build();
    }

    public OrganizationSummary resolveOrganization(String name, String domain) {
        try {
            return restClient.post()
                    .uri("/internal/resolve")
                    .body(OrganizationResolveRequest.builder()
                            .name(name)
                            .domain(domain)
                            .build())
                    .retrieve()
                    .body(OrganizationSummary.class);
        } catch (RestClientException exception) {
            throw new RuntimeException("Unable to resolve organization workspace", exception);
        }
    }

    public OrganizationSummary getOrganizationSummary(Long organizationId) {
        if (organizationId == null) {
            return null;
        }

        try {
            return restClient.get()
                    .uri("/internal/{organizationId}/summary", organizationId)
                    .retrieve()
                    .body(OrganizationSummary.class);
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().isSameCodeAs(HttpStatusCode.valueOf(404))
                    || exception.getStatusCode().isSameCodeAs(HttpStatusCode.valueOf(400))) {
                return null;
            }
            throw new RuntimeException("Unable to load organization summary", exception);
        } catch (RestClientException exception) {
            throw new RuntimeException("Unable to load organization summary", exception);
        }
    }

    public void syncMember(Long organizationId, OrganizationMemberSyncRequest request) {
        if (organizationId == null) {
            return;
        }

        try {
            restClient.post()
                    .uri("/internal/{organizationId}/members/sync", organizationId)
                    .body(request)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException exception) {
            throw new RuntimeException("Unable to sync organization member", exception);
        }
    }

    public OrganizationMemberResponse getMember(Long organizationId, Long userId) {
        if (organizationId == null || userId == null) {
            return null;
        }

        try {
            return restClient.get()
                    .uri("/internal/{organizationId}/members/{userId}", organizationId, userId)
                    .retrieve()
                    .body(OrganizationMemberResponse.class);
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().isSameCodeAs(HttpStatusCode.valueOf(404))
                    || exception.getStatusCode().isSameCodeAs(HttpStatusCode.valueOf(400))) {
                return null;
            }
            throw new RuntimeException("Unable to load organization member", exception);
        } catch (RestClientException exception) {
            throw new RuntimeException("Unable to load organization member", exception);
        }
    }

    public void updateMemberRole(Long organizationId, Long userId, String role) {
        if (organizationId == null || userId == null) {
            return;
        }

        try {
            restClient.patch()
                    .uri("/internal/{organizationId}/members/{userId}/role", organizationId, userId)
                    .body(java.util.Map.of("role", role))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException exception) {
            throw new RuntimeException("Unable to update member role", exception);
        }
    }

    public void removeMember(Long organizationId, Long userId) {
        if (organizationId == null || userId == null) {
            return;
        }

        try {
            restClient.delete()
                    .uri("/internal/{organizationId}/members/{userId}", organizationId, userId)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException exception) {
            // Silently ignore if member doesn't exist in org-service
        }
    }

    public boolean departmentExists(Long organizationId, String departmentName) {
        if (organizationId == null || departmentName == null || departmentName.isBlank()) {
            return false;
        }

        try {
            Boolean exists = restClient.get()
                    .uri("/internal/{organizationId}/departments/exists?name={name}", organizationId, departmentName.trim())
                    .retrieve()
                    .body(Boolean.class);
            return Boolean.TRUE.equals(exists);
        } catch (RestClientException exception) {
            throw new RuntimeException("Unable to validate department", exception);
        }
    }

    // ================= INVITATIONS =================

    public OrganizationMemberResponse getMemberByToken(String token) {
        if (token == null) return null;
        try {
            return restClient.get()
                    .uri("/internal/invitations/token?token={token}", token)
                    .retrieve()
                    .body(OrganizationMemberResponse.class);
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().isSameCodeAs(HttpStatusCode.valueOf(404))) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid or expired invitation token");
            }
            throw new RuntimeException("Unable to validate token", exception);
        } catch (RestClientException exception) {
            throw new RuntimeException("Unable to validate token", exception);
        }
    }

    public OrganizationSummary acceptInvitation(String token, Long userId, String email, String name) {
        try {
            return restClient.post()
                    .uri("/internal/invitations/accept")
                    .body(java.util.Map.of(
                            "token", token,
                            "userId", userId,
                            "email", email,
                            "name", name != null ? name : ""
                    ))
                    .retrieve()
                    .body(OrganizationSummary.class);
        } catch (RestClientException exception) {
            throw new RuntimeException("Unable to accept invitation", exception);
        }
    }

    public OrganizationMemberResponse inviteMember(Long organizationId, com.workflow_automation.auth_service.dto.InviteRequest request, Long adminUserId) {
        try {
            return restClient.post()
                    .uri("/internal/{organizationId}/invitations", organizationId)
                    .body(java.util.Map.of(
                            "email", request.getEmail(),
                            "name", request.getName() != null ? request.getName() : "",
                            "role", "USER",
                            "department", request.getDepartment() != null ? request.getDepartment() : "Unassigned",
                            "jobTitle", request.getJobTitle() != null ? request.getJobTitle() : "Team Member",
                            "invitedByUserId", adminUserId != null ? adminUserId : 0L
                    ))
                    .retrieve()
                    .body(OrganizationMemberResponse.class);
        } catch (RestClientException exception) {
            throw new RuntimeException("Unable to invite member", exception);
        }
    }

    public void cancelInvitation(Long organizationId, Long inviteId) {
        try {
            restClient.delete()
                    .uri("/internal/{organizationId}/invitations/{inviteId}", organizationId, inviteId)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException exception) {
            throw new RuntimeException("Unable to cancel invitation", exception);
        }
    }

    public java.util.List<OrganizationMemberResponse> listPendingInvitations(Long organizationId) {
        try {
            OrganizationMemberResponse[] responses = restClient.get()
                    .uri("/internal/{organizationId}/invitations", organizationId)
                    .retrieve()
                    .body(OrganizationMemberResponse[].class);
            return responses != null ? java.util.Arrays.asList(responses) : java.util.Collections.emptyList();
        } catch (RestClientException exception) {
            throw new RuntimeException("Unable to load pending invitations", exception);
        }
    }

    public java.util.List<OrganizationMemberResponse> getAllMembers(Long organizationId) {
        if (organizationId == null) {
            return java.util.Collections.emptyList();
        }
        try {
            OrganizationMemberResponse[] responses = restClient.get()
                    .uri("/internal/{organizationId}/members", organizationId)
                    .retrieve()
                    .body(OrganizationMemberResponse[].class);
            return responses != null ? java.util.Arrays.asList(responses) : java.util.Collections.emptyList();
        } catch (RestClientException exception) {
            throw new RuntimeException("Unable to load organization members", exception);
        }
    }
}
