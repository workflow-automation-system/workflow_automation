-- One-shot migration for invitation refactor (run manually if services are not used for auto-migration)

-- auth-service: migrate legacy invitation users to invitations table
-- (Prefer InvitationDataMigration ApplicationRunner on startup)

-- organization-service: normalize member statuses
UPDATE organization_members
SET status = 'ACCEPTED'
WHERE UPPER(status) IN ('ACTIVE', 'ACCEPTED');

DELETE FROM organization_members
WHERE UPPER(status) = 'PENDING';
