CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    organization_id BIGINT,
    action VARCHAR(512) NOT NULL,
    entity_type VARCHAR(128),
    entity_id BIGINT,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_log_org_ts ON audit_log (organization_id, timestamp DESC);
