-- MANUEL FIX: selam@selam.com kullanıcısına ROLE_ADMIN ekle
-- Bu SQL'i PostgreSQL'de çalıştırın:
-- psql -U postgres -d terra_crm -f FIX_USER_ROLE.sql

BEGIN;

-- selam@selam.com kullanıcısına ROLE_ADMIN ekle (eğer yoksa)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM users u
CROSS JOIN roles r
WHERE u.email = 'selam@selam.com' 
  AND r.name = 'ROLE_ADMIN'
  AND COALESCE(u.deleted, false) = false
  AND COALESCE(r.deleted, false) = false
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role_id = r.id
  );

-- Sonucu göster
SELECT 
    u.email,
    STRING_AGG(r.name, ', ') as roles
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'selam@selam.com'
GROUP BY u.email;

COMMIT;

-- Başarılı mesajı
\echo 'ROLE_ADMIN successfully added to selam@selam.com'
\echo 'Now logout and login again in the frontend to get new JWT with ROLE_ADMIN'
