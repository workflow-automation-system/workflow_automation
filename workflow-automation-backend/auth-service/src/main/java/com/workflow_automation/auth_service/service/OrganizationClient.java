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
}
