-- Bu SQL'i PostgreSQL'de çalıştırarak kullanıcının rollerini kontrol edebilirsiniz
-- psql -U postgres -d terra_crm -f CHECK_USER_ROLES.sql

-- 1. selam@selam.com kullanıcısının rollerini göster
SELECT 
    u.email,
    u.tenant_id,
    r.name as role_name,
    ur.user_id,
    ur.role_id
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'selam@selam.com'
AND COALESCE(u.deleted, false) = false;

-- 2. Tüm tenant'ların ilk kullanıcılarını ve rollerini göster
WITH first_per_tenant AS (
    SELECT DISTINCT ON (u.tenant_id) 
        u.id AS user_id,
        u.email,
        u.tenant_id,
        u.created_at
    FROM users u
    WHERE COALESCE(u.deleted, false) = false
    ORDER BY u.tenant_id, u.created_at ASC NULLS LAST
)
SELECT 
    f.email,
    f.tenant_id,
    f.created_at,
    STRING_AGG(r.name, ', ') as roles
FROM first_per_tenant f
LEFT JOIN user_roles ur ON f.user_id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY f.email, f.tenant_id, f.created_at
ORDER BY f.created_at;

-- 3. V26 migration'ının çalışıp çalışmadığını kontrol et
SELECT version, description, installed_on, success
FROM flyway_schema_history
WHERE version = '26'
ORDER BY installed_rank DESC
LIMIT 1;
