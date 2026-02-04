# Customer Parameters Backend Integration - Implementation Summary

## Overview
This document summarizes the complete backend integration for Customer Parameters (Categories, Services, Statuses, Sources, Tags, File Categories).

## Database Schema

### Tables Created (via Flyway Migration V12)
All tables are tenant-scoped and include:
- **categories**: Service categories (e.g., Aesthetics, Dental, Eye)
- **services**: Medical services linked to categories
- **statuses**: Customer statuses (e.g., New, In Process, Sale)
- **sources**: Lead sources (e.g., Google Ads, Facebook Ads)
- **tags**: Customer tags (e.g., VIP, Priority, Language tags)
- **file_categories**: Document categories for customer files

### Common Fields
- `id` (UUID, Primary Key)
- `tenant_id` (VARCHAR, Foreign Key to tenants)
- `label_tr` / `name_tr` (Turkish label/name)
- `label_en` / `name_en` (English label/name)
- `value` (VARCHAR, optional slug/value)
- `color` (VARCHAR, hex color code)
- `icon` (VARCHAR, icon name)
- `is_system` (BOOLEAN, default false) - Prevents editing/deletion of system items
- `created_at`, `updated_at`, `deleted_at`, `deleted_by` (Audit fields)

### Special Fields
- **services.category_id**: UUID reference to categories table (NOT NULL)

### Default System Data
Each table has one system item that cannot be edited or deleted:
- Category: "System" (id: system-generated UUID)
- Service: "General Consultation" linked to System category
- Status: "New"
- Source: "Manual"
- Tag: "General"
- File Category: "General Documents"

## Backend Implementation

### 1. Entities (`modules/health/entity/`)
- `Category.java`
- `ServiceEntity.java`
- `Status.java`
- `Source.java`
- `Tag.java`
- `FileCategory.java`

All entities:
- Extend `BaseEntity` (includes tenant_id, audit fields)
- Use `@Builder` with `@Builder.Default` for `isSystem` field
- Include validation annotations

### 2. Repositories (`modules/health/repository/`)
- `CategoryRepository.java`
- `ServiceEntityRepository.java`
- `StatusRepository.java`
- `SourceRepository.java`
- `TagRepository.java`
- `FileCategoryRepository.java`

All extend `JpaRepository<Entity, UUID>` and are tenant-aware.

Special query in `ServiceEntityRepository`:
```java
List<ServiceEntity> findByCategoryId(UUID categoryId);
```

### 3. DTOs (`modules/health/dto/`)
**Response DTOs:**
- `CategoryDto.java`
- `ServiceDto.java` (includes categoryLabelTr, categoryLabelEn)
- `StatusDto.java`
- `SourceDto.java`
- `TagDto.java`
- `FileCategoryDto.java`

**Request DTOs:**
- `ParameterRequest.java` (for categories, statuses, sources, tags, file categories)
- `ServiceRequest.java` (includes categoryId validation)

### 4. Service Layer (`modules/health/service/`)
**`CustomerParametersService.java`** provides:
- CRUD operations for all parameter types
- System item protection (cannot edit/delete items where `isSystem = true`)
- Category-Service relationship validation
- DTO conversion methods
- Transaction management with `@Transactional`

Key validations:
- Cannot update/delete system items
- Cannot delete category if services are linked to it
- Service must have a valid category

### 5. Controller (`modules/health/controller/`)
**`CustomerParametersController.java`**
- Base path: `/api/v1/health/parameters`
- Endpoints for each parameter type:
  - `GET /categories`, `POST /categories`, `PUT /categories/{id}`, `DELETE /categories/{id}`
  - `GET /services`, `POST /services`, `PUT /services/{id}`, `DELETE /services/{id}`
  - `GET /statuses`, `POST /statuses`, `PUT /statuses/{id}`, `DELETE /statuses/{id}`
  - `GET /sources`, `POST /sources`, `PUT /sources/{id}`, `DELETE /sources/{id}`
  - `GET /tags`, `POST /tags`, `PUT /tags/{id}`, `DELETE /tags/{id}`
  - `GET /file-categories`, `POST /file-categories`, `PUT /file-categories/{id}`, `DELETE /file-categories/{id}`

Security:
- View operations: `SETTINGS_CUSTOMER_PANEL_MANAGE` OR `CUSTOMERS_VIEW`
- Create/Update/Delete: `SETTINGS_CUSTOMER_PANEL_MANAGE`

## Frontend Implementation

### 1. API Client (`modules/customers/api/customerParametersAPI.js`)
Provides async functions for all CRUD operations:
- `getAllCategories()`, `createCategory(data)`, `updateCategory(id, data)`, `deleteCategory(id)`
- Similar functions for services, statuses, sources, tags, file categories

### 2. Zustand Store (`modules/customers/hooks/useCustomerSettingsStore.js`)
**State:**
- Data arrays: `categories`, `services`, `statuses`, `sources`, `tags`, `fileCategories`
- Loading states for each type
- Error states for each type

**Actions:**
- `fetchAll()` - Fetches all parameters on mount
- `fetchCategories()`, `fetchServices()`, etc. - Individual fetch methods
- `addCategory(category)`, `updateCategory(id, updated)`, `deleteCategory(id)` - CRUD operations
- Similar methods for all parameter types

**Data Conversion:**
- `convertDtoToFrontend(dto, type)` - Converts backend DTO to frontend format
- `convertFrontendToDto(item, type)` - Converts frontend format to backend DTO

Frontend format uses snake_case (label_tr, name_tr) while backend uses camelCase (labelTr, nameTr).

### 3. UI Components

**`CustomerPanel.jsx`** (Settings page):
- Fetches all parameters on mount via `useEffect(() => settings.fetchAll(), [])`
- Async save/delete operations with try-catch error handling
- Shows success/error snackbar messages

**`CustomerEditDialog.jsx`**:
- System item warning banner
- Disabled fields for system items
- Category selection for services (uses category ID, not label)
- Disabled color picker for system items

**`CustomerDeleteDialog.jsx`**:
- System item protection warning
- Disabled delete button for system items

**`CustomerItemGrid.jsx`**:
- Displays items in grid layout
- Shows system badge for system items
- Disabled edit/delete buttons for system items

## Key Features

### 1. System Item Protection
- System items have `isSystem = true`
- Cannot be edited or deleted
- UI shows warning and disables controls
- Backend throws exception if attempted

### 2. Service-Category Relationship
- Every service MUST have a category
- Category selection is required when creating/editing services
- Cannot delete a category if services are linked to it
- Service DTO includes category labels for display

### 3. File Categories
- When a new file category is created, it automatically appears in the customer add/edit form
- Allows dynamic file upload sections based on categories

### 4. Multi-language Support
- All items have Turkish (tr) and English (en) labels
- Frontend displays based on current language (`i18n.language`)

### 5. Error Handling
- Backend: Custom exceptions with meaningful messages
- Frontend: Try-catch blocks with snackbar notifications
- Loading states prevent duplicate requests

## API Examples

### Create a Category
```http
POST /api/v1/health/parameters/categories
Content-Type: application/json

{
  "labelTr": "Göz",
  "labelEn": "Eye",
  "color": "#3b82f6",
  "icon": "Eye"
}
```

### Create a Service
```http
POST /api/v1/health/parameters/services
Content-Type: application/json

{
  "nameTr": "Katarakt Ameliyatı",
  "nameEn": "Cataract Surgery",
  "value": "cataract_surgery",
  "categoryId": "uuid-of-eye-category",
  "color": "#10b981",
  "icon": "Eye"
}
```

### Update a Status
```http
PUT /api/v1/health/parameters/statuses/{id}
Content-Type: application/json

{
  "labelTr": "Tamamlandı",
  "labelEn": "Completed",
  "value": "completed",
  "color": "#10b981",
  "icon": "CheckCircle"
}
```

### Delete a Tag
```http
DELETE /api/v1/health/parameters/tags/{id}
```

## Testing Checklist

### Backend
- [ ] Migration runs successfully
- [ ] Default system items are created
- [ ] Cannot edit system items (returns error)
- [ ] Cannot delete system items (returns error)
- [ ] Cannot delete category with linked services (returns error)
- [ ] Service creation requires valid category
- [ ] All CRUD operations work for non-system items
- [ ] Tenant isolation works correctly

### Frontend
- [ ] Parameters load on page mount
- [ ] Loading states display correctly
- [ ] Can create new items
- [ ] Can edit non-system items
- [ ] Cannot edit system items (fields disabled)
- [ ] Can delete non-system items
- [ ] Cannot delete system items (button disabled)
- [ ] Service category selection works
- [ ] Error messages display in snackbar
- [ ] Success messages display in snackbar
- [ ] Multi-language labels display correctly

## Next Steps

1. **Test the integration**:
   - Start backend server
   - Navigate to Settings > Customer Panel
   - Test CRUD operations for all parameter types

2. **Verify system item protection**:
   - Try to edit/delete system items
   - Confirm UI prevents it and backend rejects it

3. **Test service-category relationship**:
   - Create a category
   - Create a service linked to that category
   - Try to delete the category (should fail)
   - Delete the service first, then delete the category (should succeed)

4. **Customer Integration** (Next Phase):
   - Update Customer entity to use parameter IDs instead of strings
   - Update CustomerDrawer to fetch parameters from store
   - Update CustomerFilters to use parameters from store
   - Migrate existing customer data to use new parameter system

## Migration Notes

### From Local Storage to Database
The old system used Zustand with persist middleware and hardcoded initial data. The new system:
- Fetches data from backend on mount
- Stores in Zustand without persistence
- All changes go through API
- Data is tenant-specific and stored in database

### Data Format Changes
**Old (Frontend only)**:
```javascript
{ id: '1', label_tr: 'VIP', label_en: 'VIP', value: 'vip', color: '#8b5cf6' }
```

**New (Backend + Frontend)**:
```javascript
{
  id: 'uuid',
  labelTr: 'VIP',  // Backend format
  labelEn: 'VIP',
  value: 'vip',
  color: '#8b5cf6',
  icon: 'Star',
  isSystem: false,
  createdAt: '2026-02-04T10:00:00Z',
  updatedAt: '2026-02-04T10:00:00Z'
}
```

Frontend store converts between formats automatically.

## Conclusion

The customer parameters backend integration is complete with:
- ✅ Database schema with migrations
- ✅ Full backend implementation (entities, repositories, services, controllers)
- ✅ Frontend API client and Zustand store
- ✅ UI components with system item protection
- ✅ Service-category relationship enforcement
- ✅ Multi-language support
- ✅ Error handling and validation

The system is ready for testing and customer integration.
