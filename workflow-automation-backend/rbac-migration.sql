BEGIN;

ALTER TABLE IF EXISTS workflow_permission RENAME TO workflow_permissions;

CREATE TABLE IF NOT EXISTS workflow_permissions (
    id BIGSERIAL PRIMARY KEY,
    workflow_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL,
    granted_by BIGINT,
    granted_at TIMESTAMP,
    CONSTRAINT uk_workflow_permissions_workflow_user UNIQUE (workflow_id, user_id)
);

CREATE TABLE IF NOT EXISTS workflow_permission_types (
    workflow_permission_id BIGINT NOT NULL,
    permission_type VARCHAR(32) NOT NULL,
    CONSTRAINT fk_workflow_permission_types_permission
        FOREIGN KEY (workflow_permission_id) REFERENCES workflow_permissions(id) ON DELETE CASCADE
);

DELETE FROM workflow_permission_types
WHERE permission_type NOT IN ('VIEW', 'EDIT', 'EXECUTE');

INSERT INTO workflow_permissions (workflow_id, user_id, organization_id, granted_by, granted_at)
SELECT w.id, w.user_id, w.organization_id, w.user_id, NOW()
FROM workflow w
LEFT JOIN workflow_permissions wp
    ON wp.workflow_id = w.id
   AND wp.user_id = w.user_id
WHERE wp.id IS NULL;

INSERT INTO workflow_permission_types (workflow_permission_id, permission_type)
SELECT wp.id, permission_type.permission_type
FROM workflow_permissions wp
CROSS JOIN (
    VALUES ('VIEW'), ('EDIT'), ('EXECUTE')
) AS permission_type(permission_type)
LEFT JOIN workflow_permission_types existing
    ON existing.workflow_permission_id = wp.id
   AND existing.permission_type = permission_type.permission_type
WHERE existing.workflow_permission_id IS NULL
  AND EXISTS (
      SELECT 1
      FROM workflow w
      WHERE w.id = wp.workflow_id
        AND w.user_id = wp.user_id
  );

CREATE INDEX IF NOT EXISTS idx_workflow_permissions_workflow ON workflow_permissions (workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_permissions_user_org ON workflow_permissions (user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_permission_types_permission ON workflow_permission_types (permission_type);

COMMIT;
