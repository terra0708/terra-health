# Customer File Management System - Backend Implementation Spec

## Overview
This document provides complete backend specifications for implementing the customer file management system with category-based organization, soft delete (trash), and tenant isolation.

---

## 1. Database Schema

### 1.1 file_categories Table
Tenant-scoped file categories (dynamic, user-defined).

```sql
CREATE TABLE file_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    label_tr VARCHAR(255) NOT NULL,
    label_en VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#6366f1',
    icon VARCHAR(50),
    is_system_default BOOLEAN DEFAULT FALSE,
    is_deletable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_file_categories_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_file_categories_tenant ON file_categories(tenant_id);
```

**Default Categories (created on tenant provisioning):**
- "Genel" (General) - `is_system_default=true`, `is_deletable=false`
- "Arşiv" (Archive) - `is_system_default=true`, `is_deletable=false`

### 1.2 customer_files Table
Stores file metadata with soft delete support.

```sql
CREATE TABLE customer_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES file_categories(id) ON DELETE RESTRICT,
    
    -- File Info
    original_filename VARCHAR(500) NOT NULL,
    display_name VARCHAR(500) NOT NULL,
    storage_path VARCHAR(1000) NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT NOT NULL, -- in bytes
    
    -- Audit
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Soft Delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id),
    
    CONSTRAINT fk_customer_files_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_customer_files_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_customer_files_category FOREIGN KEY (category_id) REFERENCES file_categories(id)
);

CREATE INDEX idx_customer_files_tenant ON customer_files(tenant_id);
CREATE INDEX idx_customer_files_customer ON customer_files(customer_id);
CREATE INDEX idx_customer_files_category ON customer_files(category_id);
CREATE INDEX idx_customer_files_deleted ON customer_files(is_deleted, deleted_at);
```

### 1.3 tenant_settings Table (Extension)
Add file storage quota settings to existing tenant_settings.

```sql
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS max_file_size_mb INTEGER DEFAULT 20;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS max_storage_quota_gb INTEGER DEFAULT 5;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS current_storage_usage_gb DECIMAL(10,2) DEFAULT 0.00;
```

---

## 2. Storage Strategy

### 2.1 Development (Local Storage)
```
project_root/
└── storage/
    └── {tenant_id}/
        └── customers/
            └── {customer_id}/
                └── {unique_filename}
```

### 2.2 Production (S3/MinIO)
```
Bucket: terra-health-files
Path: {tenant_id}/customers/{customer_id}/{unique_filename}
```

### 2.3 Storage Adapter Interface
```java
public interface StorageAdapter {
    String store(UUID tenantId, UUID customerId, MultipartFile file, String uniqueFilename) throws IOException;
    byte[] retrieve(String storagePath) throws IOException;
    void delete(String storagePath) throws IOException;
}

// Implementations:
// - LocalStorageAdapter (dev)
// - S3StorageAdapter (prod)
```

---

## 3. API Endpoints

### 3.1 File Categories

#### GET /v1/health/parameters/file-categories
Get all file categories for current tenant.

**Response:**
```json
[
    {
        "id": "uuid",
        "labelTr": "Pasaport",
        "labelEn": "Passport",
        "color": "#6366f1",
        "icon": "file-text",
        "isSystemDefault": false,
        "isDeletable": true
    }
]
```

#### POST /v1/health/parameters/file-categories
Create a new file category.

**Request:**
```json
{
    "labelTr": "Epikriz",
    "labelEn": "Epicrisis",
    "color": "#8b5cf6",
    "icon": "file-medical"
}
```

#### PUT /v1/health/parameters/file-categories/{id}
Update file category.

#### DELETE /v1/health/parameters/file-categories/{id}?targetCategoryId={uuid}
Delete file category with optional migration.

**Logic:**
1. Check if category has files: `SELECT COUNT(*) FROM customer_files WHERE category_id = :id AND is_deleted = false`
2. If count > 0 and no `targetCategoryId` provided → Return 400 with `{ "error": "CATEGORY_HAS_FILES", "fileCount": X }`
3. If `targetCategoryId` provided → Migrate all files: `UPDATE customer_files SET category_id = :targetCategoryId WHERE category_id = :id`
4. Delete category: `DELETE FROM file_categories WHERE id = :id`

#### GET /v1/health/parameters/file-categories/{id}/file-count
Get file count for a category.

**Response:**
```json
{
    "categoryId": "uuid",
    "fileCount": 12
}
```

---

### 3.2 Customer Files

#### POST /v1/health/customers/{customerId}/files
Upload a file.

**Request:** `multipart/form-data`
- `file`: File binary
- `categoryId`: UUID
- `displayName`: String

**Logic:**
1. Validate tenant quota
2. Validate file size
3. Generate unique filename: `{timestamp}_{random}_{sanitized_original_name}`
4. Store file via StorageAdapter
5. Save metadata to DB
6. Update tenant storage usage

**Response:**
```json
{
    "id": "uuid",
    "customerId": "uuid",
    "categoryId": "uuid",
    "displayName": "Pasaport.pdf",
    "originalFilename": "passport_scan.pdf",
    "fileSize": "2048000",
    "mimeType": "application/pdf",
    "createdAt": "2026-02-06T22:00:00Z"
}
```

#### GET /v1/health/customers/{customerId}/files?includeDeleted=false
Get all files for a customer.

**Response:** Array of file metadata (same as upload response)

#### PUT /v1/health/customers/{customerId}/files/{fileId}
Update file metadata (display name or category).

**Request:**
```json
{
    "displayName": "Yeni İsim.pdf",
    "categoryId": "uuid"
}
```

#### DELETE /v1/health/customers/{customerId}/files/{fileId}
Soft delete a file (move to trash).

**Logic:**
```java
file.setIsDeleted(true);
file.setDeletedAt(LocalDateTime.now());
file.setDeletedBy(currentUserId);
```

#### POST /v1/health/customers/{customerId}/files/{fileId}/restore
Restore a file from trash.

**Logic:**
```java
file.setIsDeleted(false);
file.setDeletedAt(null);
file.setDeletedBy(null);
```

#### GET /v1/health/customers/{customerId}/files/{fileId}/download
Download a file.

**Response:** Binary stream with proper headers
```java
return ResponseEntity.ok()
    .contentType(MediaType.parseMediaType(file.getMimeType()))
    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getDisplayName() + "\"")
    .body(storageAdapter.retrieve(file.getStoragePath()));
```

---

### 3.3 Trash Management

#### GET /v1/health/files/trash
Get all deleted files for current tenant.

**Response:**
```json
[
    {
        "id": "uuid",
        "customerId": "uuid",
        "customerName": "John Doe",
        "categoryId": "uuid",
        "displayName": "Pasaport.pdf",
        "fileSize": "2048000",
        "deletedAt": "2026-02-01T10:00:00Z",
        "deletedBy": "uuid",
        "autoDeleteAt": "2026-03-03T10:00:00Z"
    }
]
```

**Logic:**
```sql
SELECT cf.*, c.name as customer_name
FROM customer_files cf
JOIN customers c ON cf.customer_id = c.id
WHERE cf.tenant_id = :tenantId
  AND cf.is_deleted = true
ORDER BY cf.deleted_at DESC
```

#### DELETE /v1/health/files/{fileId}/permanent
Permanently delete a file from trash.

**Logic:**
1. Delete physical file: `storageAdapter.delete(file.getStoragePath())`
2. Delete DB record: `DELETE FROM customer_files WHERE id = :fileId`
3. Update tenant storage usage

---

## 4. Scheduled Jobs

### 4.1 Auto-Delete Old Trash Files
**Cron:** Daily at 3:00 AM

```java
@Scheduled(cron = "0 0 3 * * *")
public void autoDeleteOldTrashFiles() {
    LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
    List<CustomerFile> oldFiles = fileRepository.findByIsDeletedTrueAndDeletedAtBefore(cutoffDate);
    
    for (CustomerFile file : oldFiles) {
        storageAdapter.delete(file.getStoragePath());
        fileRepository.delete(file);
    }
}
```

---

## 5. Permissions

Add these to the existing permission system:

```java
FILES_VIEW
FILES_UPLOAD
FILES_DOWNLOAD
FILES_DELETE
FILES_RESTORE
FILES_PERMANENT_DELETE
TRASH_VIEW
TRASH_MANAGE
```

**Default Role Assignments:**
- `ROLE_AGENT`: FILES_VIEW, FILES_UPLOAD, FILES_DOWNLOAD
- `ROLE_ADMIN`: All FILES_* + TRASH_VIEW, TRASH_MANAGE
- `ROLE_SUPER_ADMIN`: All permissions

---

## 6. Validation Rules

1. **File Size:** Max 20MB (configurable per tenant)
2. **Storage Quota:** Check before upload
3. **Allowed MIME Types:** (Optional) Configure per tenant
4. **Filename Sanitization:** Remove special characters, limit length to 255
5. **Category Deletion:** Prevent if `is_deletable = false` or has files without migration

---

## 7. Error Codes

```java
CATEGORY_HAS_FILES - 400
FILE_TOO_LARGE - 413
STORAGE_QUOTA_EXCEEDED - 507
FILE_NOT_FOUND - 404
CATEGORY_NOT_DELETABLE - 403
INVALID_FILE_TYPE - 415
```

---

## 8. Migration Script

### Flyway Migration: V{next}_create_file_management_tables.sql

```sql
-- Create file_categories table
CREATE TABLE file_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    label_tr VARCHAR(255) NOT NULL,
    label_en VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#6366f1',
    icon VARCHAR(50),
    is_system_default BOOLEAN DEFAULT FALSE,
    is_deletable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_file_categories_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_file_categories_tenant ON file_categories(tenant_id);

-- Create customer_files table
CREATE TABLE customer_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    category_id UUID NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    display_name VARCHAR(500) NOT NULL,
    storage_path VARCHAR(1000) NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT NOT NULL,
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    CONSTRAINT fk_customer_files_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_customer_files_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_customer_files_category FOREIGN KEY (category_id) REFERENCES file_categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_customer_files_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id),
    CONSTRAINT fk_customer_files_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id)
);

CREATE INDEX idx_customer_files_tenant ON customer_files(tenant_id);
CREATE INDEX idx_customer_files_customer ON customer_files(customer_id);
CREATE INDEX idx_customer_files_category ON customer_files(category_id);
CREATE INDEX idx_customer_files_deleted ON customer_files(is_deleted, deleted_at);

-- Add storage settings to tenant_settings
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS max_file_size_mb INTEGER DEFAULT 20;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS max_storage_quota_gb INTEGER DEFAULT 5;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS current_storage_usage_gb DECIMAL(10,2) DEFAULT 0.00;

-- Insert default categories for existing tenants
INSERT INTO file_categories (tenant_id, label_tr, label_en, color, is_system_default, is_deletable)
SELECT id, 'Genel', 'General', '#6366f1', true, false FROM tenants;

INSERT INTO file_categories (tenant_id, label_tr, label_en, color, is_system_default, is_deletable)
SELECT id, 'Arşiv', 'Archive', '#8b5cf6', true, false FROM tenants;
```

---

## 9. Testing Checklist

- [ ] Upload file to category
- [ ] Download file
- [ ] Update file name
- [ ] Move file to different category
- [ ] Delete file (soft delete)
- [ ] Restore file from trash
- [ ] Permanently delete file
- [ ] Auto-delete after 30 days
- [ ] Category deletion with migration
- [ ] Category deletion without files
- [ ] Prevent system category deletion
- [ ] Storage quota enforcement
- [ ] File size validation
- [ ] Tenant isolation (cannot access other tenant's files)
- [ ] Permission checks for all operations

---

## 10. Notes

- All file operations must be tenant-isolated
- Storage paths must be unique to prevent collisions
- Implement proper error handling and logging
- Consider implementing file virus scanning in production
- Add file upload progress tracking if needed
- Implement proper transaction management for file operations

---

**Frontend is ready. Backend implementation can start immediately using this spec.**
