package com.workflow_automation.workflow_service.service;

import com.workflow_automation.workflow_service.dto.audit.AuditLogRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
@Slf4j
public class AuditClient {

    private final RestClient restClient;

    public AuditClient(@Value("${audit.service.url:${AUDIT_SERVICE_URI:http://localhost:8086}/api/audit}") String auditServiceUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(auditServiceUrl)
                .build();
    }

    public void record(AuditLogRequest request) {
        try {
            restClient.post()
                    .body(request)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException exception) {
            log.warn("Unable to record audit log action={} entityType={} entityId={}",
                    request.getAction(), request.getEntityType(), request.getEntityId(), exception);
        }
    }
}
