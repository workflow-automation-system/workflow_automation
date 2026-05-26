package com.workflow_automation.workflow_service.service;

import com.workflow_automation.workflow_service.dto.organization.OrganizationMemberResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

@Service
public class OrganizationDirectoryClient {

    private final RestClient restClient;

    public OrganizationDirectoryClient(
            @Value("${organization.service.url:http://localhost:8083/api/organizations}") String organizationServiceUrl
    ) {
        this.restClient = RestClient.builder()
                .baseUrl(organizationServiceUrl)
                .build();
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
            throw new RuntimeException("Unable to validate organization member", exception);
        } catch (RestClientException exception) {
            throw new RuntimeException("Unable to validate organization member", exception);
        }
    }
}
