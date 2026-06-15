# Enterprise Workflow Logic

This project is organized as a multi-tenant workflow automation platform for companies.

## Product Model

Each company owns one organization workspace. Every authenticated user belongs to exactly one organization. Workflows, executions, integrations, and members must always be scoped by `organizationId`.

The first registered user of an organization becomes `ADMIN`. Additional members can be invited by admins and assigned one of three roles: `ADMIN`, `USER`, or `VIEWER`.

## Roles

`ADMIN`

- Manages organization members and roles.
- Manages integrations and workspace settings.
- Can create, edit, delete, share, and execute every workflow inside the organization.
- Can access admin-only routes such as organization, settings, integrations, and audit pages.

`USER`

- Creates workflows.
- Owns workflows they create.
- Can edit, delete, execute, or share workflows only when they own the workflow or have explicit workflow permissions.
- Cannot manage organization members, billing, settings, integrations, or audit logs.

`VIEWER`

- Has read-only workspace access.
- Can view workflows and execution history when allowed.
- Can execute a workflow only when explicit `EXECUTE` permission is granted.
- Cannot create, edit, delete, configure, or share workflows.

## Workflow Permissions

Workflow permissions are granular and separate from global roles.

- `VIEW`: user can see the workflow.
- `EDIT`: user can modify the workflow. Edit implies view in the UI logic.
- `EXECUTE`: user can run the workflow. Execute implies view in the UI logic.

The workflow owner automatically receives `VIEW`, `EDIT`, and `EXECUTE`.

## Security Flow

1. Auth service authenticates the user.
2. Auth service issues a JWT containing `userId`, `organizationId`, and `role`.
3. API Gateway validates the JWT and forwards trusted headers:
   - `X-User-Id`
   - `X-Organization-Id`
   - `X-Role`
4. Workflow service uses those headers to build an access context.
5. Workflow service filters every workflow query by `organizationId`.
6. Workflow service checks role plus workflow permissions before create, update, delete, execute, node editing, and sharing operations.
7. Frontend stores a single authenticated user state and derives UI permissions from the same role and workflow permission flags returned by the API.

## Enterprise UX Rules

- Hiding buttons is not enough. Backend checks remain the source of truth.
- Viewers should see a clear read-only mode banner.
- Unauthorized routes redirect to the permission denied page.
- Admin-only navigation should not be displayed to members or viewers.
- Actions that require admin ownership should either be hidden or replaced with explanatory read-only messaging.

## Remaining Enterprise Hardening

- Add persistent backend audit log events for login, invite, role update, workflow edit, workflow delete, integration changes, and execution failures.
- Add refresh tokens or short-lived access tokens with automatic renewal.
- Add rate limiting for login, registration, invitation, and email verification endpoints.
- Add email delivery observability for verification and invitation failures.
- Add tests for cross-organization access attempts and role downgrade scenarios.
