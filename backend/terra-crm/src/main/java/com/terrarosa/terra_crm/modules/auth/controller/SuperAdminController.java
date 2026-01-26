package com.terrarosa.terra_crm.modules.auth.controller;

import com.terrarosa.terra_crm.core.common.dto.ApiResponse;
import com.terrarosa.terra_crm.core.tenancy.entity.Tenant;
import com.terrarosa.terra_crm.core.tenancy.repository.TenantRepository;
import com.terrarosa.terra_crm.modules.auth.dto.CreateTenantRequest;
import com.terrarosa.terra_crm.modules.auth.dto.TenantAdminDto;
import com.terrarosa.terra_crm.modules.auth.dto.TenantDto;
import com.terrarosa.terra_crm.modules.auth.service.SuperAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Controller for Super Admin operations.
 * All endpoints require ROLE_SUPER_ADMIN role.
 * 
 * CRITICAL: Super Admin operations work in public schema.
 * X-Tenant-ID header is not required for these endpoints (handled by TenantInterceptor).
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/super-admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ROLE_SUPER_ADMIN')")
public class SuperAdminController {
    
    private final SuperAdminService superAdminService;
    private final TenantRepository tenantRepository;
    
    /**
     * Create a new tenant with admin user and assigned modules.
     * This is an atomic operation that creates:
     * - Tenant record
     * - Tenant schema (via Flyway)
     * - Module assignments
     * - Admin user (in public.users table)
     * - Admin role assignment
     * - All module permissions for admin
     */
    @PostMapping("/tenants")
    public ResponseEntity<ApiResponse<SuperAdminService.TenantAdminCreationResult>> createTenant(
            @Valid @RequestBody CreateTenantRequest request) {
        
        log.info("Super Admin creating tenant: {}", request.getTenantName());
        
        SuperAdminService.TenantAdminCreationResult result = 
                superAdminService.createTenantWithAdminAndModules(request);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(result, "Tenant and admin created successfully"));
    }
    
    /**
     * Get all tenants.
     */
    @GetMapping("/tenants")
    public ResponseEntity<ApiResponse<List<TenantDto>>> getAllTenants() {
        List<TenantDto> tenants = tenantRepository.findAll().stream()
                .map(tenant -> TenantDto.builder()
                        .id(tenant.getId())
                        .name(tenant.getName())
                        .schemaName(tenant.getSchemaName())
                        .createdAt(tenant.getCreatedAt())
                        .updatedAt(tenant.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success(tenants));
    }
    
    /**
     * Get tenant by ID.
     */
    @GetMapping("/tenants/{id}")
    public ResponseEntity<ApiResponse<TenantDto>> getTenantById(@PathVariable UUID id) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found with id: " + id));
        
        TenantDto tenantDto = TenantDto.builder()
                .id(tenant.getId())
                .name(tenant.getName())
                .schemaName(tenant.getSchemaName())
                .createdAt(tenant.getCreatedAt())
                .updatedAt(tenant.getUpdatedAt())
                .build();
        
        return ResponseEntity.ok(ApiResponse.success(tenantDto));
    }
}
