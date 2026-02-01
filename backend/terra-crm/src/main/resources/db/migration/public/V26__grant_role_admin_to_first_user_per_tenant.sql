-- Grant ROLE_ADMIN to the first user (by created_at) of each tenant who does not already have it.
-- This fixes 403 on /api/v1/tenant-admin/bundles for existing tenant admins who were created with ROLE_AGENT.
-- New first users get ROLE_ADMIN at registration (AuthService); this migration fixes existing data.

WITH first_per_tenant AS (
    SELECT DISTINCT ON (u.tenant_id) u.id AS user_id
    FROM users u
    WHERE COALESCE(u.deleted, false) = false
    ORDER BY u.tenant_id, u.created_at ASC NULLS LAST
),
admin_role AS (
    SELECT id AS role_id FROM roles WHERE name = 'ROLE_ADMIN' AND COALESCE(deleted, false) = false LIMIT 1
)
INSERT INTO user_roles (user_id, role_id)
SELECT f.user_id, a.role_id
FROM first_per_tenant f
CROSS JOIN admin_role a
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = f.user_id AND ur.role_id = a.role_id
);
