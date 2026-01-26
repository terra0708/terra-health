package com.terrarosa.terra_crm.modules.auth.controller;

import com.terrarosa.terra_crm.core.audit.entity.AuditLog;
import com.terrarosa.terra_crm.core.audit.service.AuditLogService;
import com.terrarosa.terra_crm.core.common.dto.ApiResponse;
import com.terrarosa.terra_crm.core.tenancy.TenantContext;
import com.terrarosa.terra_crm.core.tenancy.dto.SchemaPoolStatsResponse;
import com.terrarosa.terra_crm.core.tenancy.entity.Tenant;
import com.terrarosa.terra_crm.core.tenancy.repository.TenantRepository;
import com.terrarosa.terra_crm.core.tenancy.service.SchemaPoolService;
import com.terrarosa.terra_crm.core.tenancy.service.TenantService;
import com.terrarosa.terra_crm.modules.auth.dto.*;
import com.terrarosa.terra_crm.modules.auth.entity.User;
import com.terrarosa.terra_crm.modules.auth.repository.UserRepository;
import com.terrarosa.terra_crm.modules.auth.service.SuperAdminService;
import com.terrarosa.terra_crm.core.maintenance.entity.MaintenanceMode;
import com.terrarosa.terra_crm.core.maintenance.service.MaintenanceModeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
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
    private final SchemaPoolService schemaPoolService;
    private final TenantService tenantService;
    private final AuditLogService auditLogService;
    private final UserRepository userRepository;
    private final MaintenanceModeService maintenanceModeService;
    
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
     * Get schema pool statistics for Super Admin dashboard.
     * Provides comprehensive information about READY, ASSIGNED, and ERROR schema counts,
     * total count, minimum ready threshold, and last provisioning time.
     * 
     * CRITICAL: This endpoint requires SYSTEM tenant context for additional security.
     * Defense in depth: Both filter layer and controller layer validate SYSTEM tenant.
     */
    @GetMapping("/schema-pool/stats")
    public ResponseEntity<ApiResponse<SchemaPoolStatsResponse>> getPoolStats() {
        log.info("Super Admin requesting schema pool statistics");
        
        // SYSTEM Tenant validation (defense in depth)
        Tenant systemTenant = tenantService.getSystemTenant();
        String systemTenantId = systemTenant.getId().toString();
        String currentTenantId = TenantContext.getCurrentTenantId();
        
        if (currentTenantId == null || !systemTenantId.equals(currentTenantId)) {
            log.error("Schema pool stats access denied: Expected SYSTEM tenantId={}, but got tenantId={}",
                    systemTenantId, currentTenantId);
            throw new AccessDeniedException("Schema pool stats can only be accessed with SYSTEM tenant context");
        }
        
        SchemaPoolStatsResponse stats = schemaPoolService.getPoolStats();
        
        log.debug("Schema pool statistics retrieved: READY={}, ASSIGNED={}, ERROR={}, TOTAL={}",
                stats.readyCount(), stats.assignedCount(), stats.errorCount(), stats.totalCount());
        
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
    
    // ========== Tenant Management Endpoints ==========
    
    /**
     * Suspend a tenant.
     */
    @PutMapping("/tenants/{id}/suspend")
    public ResponseEntity<ApiResponse<Void>> suspendTenant(
            @PathVariable UUID id,
            @Valid @RequestBody SuspendTenantRequest request) {
        
        superAdminService.suspendTenant(id, request.getReason());
        return ResponseEntity.ok(ApiResponse.success(null, "Tenant suspended successfully"));
    }
    
    /**
     * Activate a tenant.
     */
    @PutMapping("/tenants/{id}/activate")
    public ResponseEntity<ApiResponse<Void>> activateTenant(@PathVariable UUID id) {
        superAdminService.activateTenant(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Tenant activated successfully"));
    }
    
    /**
     * Hard delete a tenant (physical deletion).
     */
    @DeleteMapping("/tenants/{id}")
    public ResponseEntity<ApiResponse<Void>> hardDeleteTenant(@PathVariable UUID id) {
        superAdminService.hardDeleteTenant(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Tenant deleted successfully"));
    }
    
    /**
     * Toggle a module (feature flag) for a tenant.
     */
    @PutMapping("/tenants/{id}/modules")
    public ResponseEntity<ApiResponse<Void>> toggleModule(
            @PathVariable UUID id,
            @Valid @RequestBody ToggleModuleRequest request) {
        
        superAdminService.toggleModuleForTenant(id, request.getModuleName(), request.getEnabled());
        return ResponseEntity.ok(ApiResponse.success(null, "Module toggled successfully"));
    }
    
    /**
     * Get assigned modules for a tenant.
     */
    @GetMapping("/tenants/{id}/modules")
    public ResponseEntity<ApiResponse<List<String>>> getTenantModules(@PathVariable UUID id) {
        List<String> modules = superAdminService.getTenantModules(id);
        return ResponseEntity.ok(ApiResponse.success(modules));
    }
    
    /**
     * Set quota limits for a tenant.
     */
    @PutMapping("/tenants/{id}/quotas")
    public ResponseEntity<ApiResponse<Void>> setTenantQuotas(
            @PathVariable UUID id,
            @Valid @RequestBody QuotaLimitsRequest request) {
        
        superAdminService.setTenantQuotas(id, request.getQuotas());
        return ResponseEntity.ok(ApiResponse.success(null, "Quota limits updated successfully"));
    }
    
    /**
     * Update getAllTenants and getTenantById to include status, quotaLimits, and assignedModules.
     */
    @GetMapping("/tenants")
    public ResponseEntity<ApiResponse<List<TenantDto>>> getAllTenants() {
        List<TenantDto> tenants = tenantRepository.findAll().stream()
                .map(tenant -> {
                    List<String> modules = superAdminService.getTenantModules(tenant.getId());
                    return TenantDto.builder()
                            .id(tenant.getId())
                            .name(tenant.getName())
                            .schemaName(tenant.getSchemaName())
                            .status(tenant.getStatus())
                            .quotaLimits(tenant.getQuotaLimits())
                            .assignedModules(modules)
                            .createdAt(tenant.getCreatedAt())
                            .updatedAt(tenant.getUpdatedAt())
                            .build();
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success(tenants));
    }
    
    /**
     * Get tenant by ID (updated with status, quotaLimits, assignedModules).
     */
    @GetMapping("/tenants/{id}")
    public ResponseEntity<ApiResponse<TenantDto>> getTenantById(@PathVariable UUID id) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found with id: " + id));
        
        List<String> modules = superAdminService.getTenantModules(tenant.getId());
        TenantDto tenantDto = TenantDto.builder()
                .id(tenant.getId())
                .name(tenant.getName())
                .schemaName(tenant.getSchemaName())
                .status(tenant.getStatus())
                .quotaLimits(tenant.getQuotaLimits())
                .assignedModules(modules)
                .createdAt(tenant.getCreatedAt())
                .updatedAt(tenant.getUpdatedAt())
                .build();
        
        return ResponseEntity.ok(ApiResponse.success(tenantDto));
    }
    
    // ========== User Management Endpoints ==========
    
    /**
     * Search users globally by email.
     */
    @GetMapping("/users/search")
    public ResponseEntity<ApiResponse<GlobalUserSearchResponse>> searchUsers(
            @RequestParam String email) {
        
        List<User> users = superAdminService.searchUsersGlobally(email);
        
        List<GlobalUserSearchResponse.UserWithTenantDto> userDtos = users.stream()
                .map(user -> {
                    List<String> roles = user.getRoles().stream()
                            .map(role -> role.getName())
                            .collect(Collectors.toList());
                    
                    return GlobalUserSearchResponse.UserWithTenantDto.builder()
                            .userId(user.getId().toString())
                            .email(user.getEmail())
                            .firstName(user.getFirstName())
                            .lastName(user.getLastName())
                            .tenantId(user.getTenant() != null ? user.getTenant().getId().toString() : null)
                            .tenantName(user.getTenant() != null ? user.getTenant().getName() : null)
                            .enabled(user.getEnabled())
                            .roles(roles)
                            .build();
                })
                .collect(Collectors.toList());
        
        GlobalUserSearchResponse response = GlobalUserSearchResponse.builder()
                .users(userDtos)
                .totalCount(userDtos.size())
                .build();
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    /**
     * Reset a user's password.
     */
    @PutMapping("/users/{id}/password/reset")
    public ResponseEntity<ApiResponse<Void>> resetUserPassword(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        
        String newPassword = request.get("newPassword");
        if (newPassword == null || newPassword.isBlank()) {
            throw new IllegalArgumentException("newPassword is required");
        }
        
        superAdminService.resetUserPassword(id, newPassword);
        return ResponseEntity.ok(ApiResponse.success(null, "Password reset successfully"));
    }
    
    /**
     * Enable or disable a user.
     */
    @PutMapping("/users/{id}/enable")
    public ResponseEntity<ApiResponse<Void>> setUserEnabled(
            @PathVariable UUID id,
            @RequestBody Map<String, Boolean> request) {
        
        Boolean enabled = request.get("enabled");
        if (enabled == null) {
            throw new IllegalArgumentException("enabled flag is required");
        }
        
        superAdminService.setUserEnabled(id, enabled);
        return ResponseEntity.ok(ApiResponse.success(null, "User enabled status updated successfully"));
    }
    
    /**
     * Start impersonation session for a user.
     */
    @PostMapping("/users/{id}/impersonate")
    public ResponseEntity<ApiResponse<ImpersonationResponse>> impersonateUser(@PathVariable UUID id) {
        String impersonationToken = superAdminService.impersonateUser(id);
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        
        ImpersonationResponse response = ImpersonationResponse.builder()
                .impersonationToken(impersonationToken)
                .impersonatedUserEmail(user.getEmail())
                .impersonatedUserId(user.getId().toString())
                .tenantId(user.getTenant() != null ? user.getTenant().getId().toString() : null)
                .tenantName(user.getTenant() != null ? user.getTenant().getName() : null)
                .build();
        
        return ResponseEntity.ok(ApiResponse.success(response, "Impersonation session started"));
    }
    
    // ========== Audit & Monitoring Endpoints ==========
    
    /**
     * Get audit logs with filters.
     */
    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<Page<AuditLogDto>>> getAuditLogs(
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) LocalDateTime fromDate,
            @RequestParam(required = false) LocalDateTime toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLog> auditLogs = auditLogService.getAuditLogs(tenantId, action, fromDate, toDate, pageable);
        
        // Convert to DTOs (simplified - would need user/tenant lookups for full DTO)
        Page<AuditLogDto> auditLogDtos = auditLogs.map(log -> AuditLogDto.builder()
                .id(log.getId())
                .userId(log.getUserId())
                .action(log.getAction())
                .resourceType(log.getResourceType())
                .resourceId(log.getResourceId())
                .tenantId(log.getTenantId())
                .ipAddress(log.getIpAddress())
                .userAgent(log.getUserAgent())
                .metadata(log.getMetadata())
                .createdAt(log.getCreatedAt())
                .build());
        
        return ResponseEntity.ok(ApiResponse.success(auditLogDtos));
    }
    
    /**
     * Get system-wide statistics for dashboard.
     */
    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<SystemStatsResponse>> getSystemStats() {
        // Get tenant statistics
        List<Tenant> allTenants = tenantRepository.findAll();
        long totalTenants = allTenants.size();
        long activeTenants = allTenants.stream()
                .filter(t -> t.getStatus() == com.terrarosa.terra_crm.core.tenancy.entity.TenantStatus.ACTIVE)
                .count();
        long suspendedTenants = allTenants.stream()
                .filter(t -> t.getStatus() == com.terrarosa.terra_crm.core.tenancy.entity.TenantStatus.SUSPENDED)
                .count();
        
        // Get user statistics
        long totalUsers = userRepository.findAll().size();
        
        // Get audit log statistics
        long totalAuditLogs = auditLogService.getAuditLogs(null, null, null, null, 
                PageRequest.of(0, 1)).getTotalElements();
        
        // Get schema pool statistics
        SchemaPoolStatsResponse poolStats = schemaPoolService.getPoolStats();
        
        // Get last tenant created date
        LocalDateTime lastTenantCreated = allTenants.stream()
                .map(Tenant::getCreatedAt)
                .max(LocalDateTime::compareTo)
                .orElse(null);
        
        // Get last audit log date
        Page<AuditLog> recentLogs = auditLogService.getAuditLogs(null, null, null, null,
                PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "createdAt")));
        LocalDateTime lastAuditLog = recentLogs.getContent().isEmpty() ? null :
                recentLogs.getContent().get(0).getCreatedAt();
        
        SystemStatsResponse stats = SystemStatsResponse.builder()
                .totalTenants(totalTenants)
                .activeTenants(activeTenants)
                .suspendedTenants(suspendedTenants)
                .totalUsers(totalUsers)
                .totalAuditLogs(totalAuditLogs)
                .schemaPoolReady((long) poolStats.readyCount())
                .schemaPoolAssigned((long) poolStats.assignedCount())
                .schemaPoolError((long) poolStats.errorCount())
                .lastTenantCreated(lastTenantCreated)
                .lastAuditLog(lastAuditLog)
                .build();
        
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
    
    // ========== Maintenance Mode Endpoints ==========
    
    /**
     * Enable global maintenance mode.
     */
    @PutMapping("/maintenance/global/enable")
    public ResponseEntity<ApiResponse<MaintenanceModeResponse>> enableGlobalMaintenance(
            @Valid @RequestBody MaintenanceModeRequest request) {
        
        MaintenanceMode mode = maintenanceModeService.enableGlobalMaintenance(
                request.getMessage(), request.getScheduledStart(), request.getScheduledEnd());
        
        MaintenanceModeResponse response = MaintenanceModeResponse.builder()
                .id(mode.getId())
                .tenantId(null)
                .active(mode.getActive())
                .message(mode.getMessage())
                .scheduledStart(mode.getScheduledStart())
                .scheduledEnd(mode.getScheduledEnd())
                .isGlobal(true)
                .isCurrentlyActive(mode.isCurrentlyActive())
                .build();
        
        return ResponseEntity.ok(ApiResponse.success(response, "Global maintenance mode enabled"));
    }
    
    /**
     * Disable global maintenance mode.
     */
    @PutMapping("/maintenance/global/disable")
    public ResponseEntity<ApiResponse<Void>> disableGlobalMaintenance() {
        maintenanceModeService.disableGlobalMaintenance();
        return ResponseEntity.ok(ApiResponse.success(null, "Global maintenance mode disabled"));
    }
    
    /**
     * Get global maintenance mode status.
     */
    @GetMapping("/maintenance/global")
    public ResponseEntity<ApiResponse<MaintenanceModeResponse>> getGlobalMaintenance() {
        return maintenanceModeService.getGlobalMaintenanceMode()
                .map(mode -> {
                    MaintenanceModeResponse response = MaintenanceModeResponse.builder()
                            .id(mode.getId())
                            .tenantId(null)
                            .active(mode.getActive())
                            .message(mode.getMessage())
                            .scheduledStart(mode.getScheduledStart())
                            .scheduledEnd(mode.getScheduledEnd())
                            .isGlobal(true)
                            .isCurrentlyActive(mode.isCurrentlyActive())
                            .build();
                    return ResponseEntity.ok(ApiResponse.success(response));
                })
                .orElse(ResponseEntity.ok(ApiResponse.success(null, "No global maintenance mode configured")));
    }
    
    /**
     * Enable tenant-specific maintenance mode.
     */
    @PutMapping("/maintenance/tenants/{id}/enable")
    public ResponseEntity<ApiResponse<MaintenanceModeResponse>> enableTenantMaintenance(
            @PathVariable UUID id,
            @Valid @RequestBody MaintenanceModeRequest request) {
        
        MaintenanceMode mode = maintenanceModeService.enableTenantMaintenance(
                id, request.getMessage(), request.getScheduledStart(), request.getScheduledEnd());
        
        MaintenanceModeResponse response = MaintenanceModeResponse.builder()
                .id(mode.getId())
                .tenantId(mode.getTenantId())
                .active(mode.getActive())
                .message(mode.getMessage())
                .scheduledStart(mode.getScheduledStart())
                .scheduledEnd(mode.getScheduledEnd())
                .isGlobal(false)
                .isCurrentlyActive(mode.isCurrentlyActive())
                .build();
        
        return ResponseEntity.ok(ApiResponse.success(response, "Tenant maintenance mode enabled"));
    }
    
    /**
     * Disable tenant-specific maintenance mode.
     */
    @PutMapping("/maintenance/tenants/{id}/disable")
    public ResponseEntity<ApiResponse<Void>> disableTenantMaintenance(@PathVariable UUID id) {
        maintenanceModeService.disableTenantMaintenance(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Tenant maintenance mode disabled"));
    }
    
    /**
     * Get tenant-specific maintenance mode status.
     */
    @GetMapping("/maintenance/tenants/{id}")
    public ResponseEntity<ApiResponse<MaintenanceModeResponse>> getTenantMaintenance(@PathVariable UUID id) {
        return maintenanceModeService.getTenantMaintenanceMode(id)
                .map(mode -> {
                    MaintenanceModeResponse response = MaintenanceModeResponse.builder()
                            .id(mode.getId())
                            .tenantId(mode.getTenantId())
                            .active(mode.getActive())
                            .message(mode.getMessage())
                            .scheduledStart(mode.getScheduledStart())
                            .scheduledEnd(mode.getScheduledEnd())
                            .isGlobal(false)
                            .isCurrentlyActive(mode.isCurrentlyActive())
                            .build();
                    return ResponseEntity.ok(ApiResponse.success(response));
                })
                .orElse(ResponseEntity.ok(ApiResponse.success(null, "No maintenance mode configured for tenant")));
    }
}
