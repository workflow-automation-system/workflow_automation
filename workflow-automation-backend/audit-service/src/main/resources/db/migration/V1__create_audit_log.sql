CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    actor_email VARCHAR(320),
    organization_id BIGINT,
    action VARCHAR(512) NOT NULL,
    entity_type VARCHAR(128),
    entity_id BIGINT,
    outcome VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
    ip_address VARCHAR(64),
    user_agent VARCHAR(512),
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_log_org_ts ON audit_log (organization_id, timestamp DESC);
