package com.workflow_automation.organization_service.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrganizationDataMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        int normalized = jdbcTemplate.update(
                """
                UPDATE organization_members
                SET status = 'ACCEPTED'
                WHERE UPPER(status) IN ('ACTIVE', 'ACCEPTED')
                """
        );

        int removed = jdbcTemplate.update(
                """
                DELETE FROM organization_members
                WHERE UPPER(status) = 'PENDING'
                """
        );

        if (normalized > 0 || removed > 0) {
            log.info("Organization member migration: {} statuses normalized, {} pending members removed",
                    normalized, removed);
        }
    }
}
