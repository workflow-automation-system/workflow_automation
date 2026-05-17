package com.workflow_automation.auth_service.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseSchemaRepair implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        String organizationIdType = findColumnType("users", "organization_id");
        if (organizationIdType == null) {
            return;
        }

        dropForeignKeyIfExists("users", "organization_id");

        if ("bigint".equalsIgnoreCase(organizationIdType)) {
            return;
        }

        Integer usersCount = jdbcTemplate.queryForObject("select count(*) from users", Integer.class);
        if (usersCount != null && usersCount > 0) {
            throw new IllegalStateException(
                    "Schema mismatch detected: users.organization_id is not bigint. " +
                            "Automatic repair was skipped because users already exist."
            );
        }

        log.warn("Repairing schema mismatch: users.organization_id -> bigint for external organization-service");

        jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN organization_id DROP NOT NULL");
        jdbcTemplate.execute("ALTER TABLE users DROP COLUMN organization_id");
        jdbcTemplate.execute("ALTER TABLE users ADD COLUMN organization_id bigint");
    }

    private String findColumnType(String tableName, String columnName) {
        return jdbcTemplate.query(
                """
                SELECT data_type
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = ?
                  AND column_name = ?
                """,
                rs -> rs.next() ? rs.getString("data_type") : null,
                tableName,
                columnName
        );
    }

    private void dropForeignKeyIfExists(String tableName, String columnName) {
        jdbcTemplate.query(
                """
                SELECT tc.constraint_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                  ON tc.constraint_name = kcu.constraint_name
                 AND tc.table_schema = kcu.table_schema
                WHERE tc.table_schema = 'public'
                  AND tc.table_name = ?
                  AND tc.constraint_type = 'FOREIGN KEY'
                  AND kcu.column_name = ?
                """,
                rs -> {
                    while (rs.next()) {
                        String constraintName = rs.getString("constraint_name");
                        jdbcTemplate.execute(
                                "ALTER TABLE " + tableName + " DROP CONSTRAINT IF EXISTS " + constraintName
                        );
                    }
                    return null;
                },
                tableName,
                columnName
        );
    }
}
