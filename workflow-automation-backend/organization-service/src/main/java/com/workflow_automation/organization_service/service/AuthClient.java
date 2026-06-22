package com.workflow_automation.organization_service.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
@Slf4j
public class AuthClient {

    private final RestClient restClient;

    public AuthClient(@Value("${auth.service.url:http://localhost:8081/api/auth}") String authServiceUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(authServiceUrl)
                .build();
    }

    public void renameDepartment(Long organizationId, String oldName, String newName) {
        try {
            restClient.patch()
                    .uri("/internal/departments/rename")
                    .body(Map.of(
                            "organizationId", organizationId,
                            "oldName", oldName,
                            "newName", newName
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("Failed to propagate department rename to auth-service: {}", e.getMessage());
        }
    }

    public void deleteDepartment(Long organizationId, String name) {
        try {
            restClient.delete()
                    .uri("/internal/departments/{organizationId}/{name}", organizationId, name)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("Failed to propagate department delete to auth-service: {}", e.getMessage());
        }
    }
}
