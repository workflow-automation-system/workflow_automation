package com.workflow_automation.auth_service.service;

import com.workflow_automation.auth_service.dto.OrganizationSummary;
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
}
