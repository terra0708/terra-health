package com.terrarosa.terra_crm.core.tenancy.service;

import com.terrarosa.terra_crm.core.tenancy.entity.Tenant;
import com.terrarosa.terra_crm.core.tenancy.repository.TenantRepository;
import com.terrarosa.terra_crm.modules.auth.service.PermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

/**
 * Service for managing tenants and their schemas.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TenantService {
    
    private final TenantRepository tenantRepository;
    private final JdbcTemplate jdbcTemplate;
    private final PermissionService permissionService;
    
    // Core modules to assign to new tenants
    private static final List<String> CORE_MODULES = Arrays.asList(
        "MODULE_DASHBOARD",
        "MODULE_APPOINTMENTS",
        "MODULE_CUSTOMERS",
        "MODULE_REMINDERS"
    );
    
    /**
     * Create a new tenant with its own schema.
     * Automatically assigns core modules to the tenant.
     */
    @Transactional
    public Tenant createTenant(String name) {
        // Generate schema name from tenant name (sanitized)
        String schemaName = generateSchemaName(name);
        
        // Create the schema
        createTenantSchema(schemaName);
        
        // Run migrations on the new schema
        runTenantMigrations(schemaName);
        
        // Create tenant record in public schema
        Tenant tenant = Tenant.builder()
                .name(name)
                .schemaName(schemaName)
                .build();
        
        Tenant savedTenant = tenantRepository.save(tenant);
        
        // Assign core modules to the tenant
        assignCoreModulesToTenant(savedTenant);
        
        return savedTenant;
    }
    
    /**
     * Assign core modules to a tenant.
     */
    private void assignCoreModulesToTenant(Tenant tenant) {
        for (String moduleName : CORE_MODULES) {
            try {
                permissionService.assignModuleToTenant(tenant, moduleName);
            } catch (Exception e) {
                log.error("Failed to assign module {} to tenant {}: {}", moduleName, tenant.getId(), e.getMessage());
                // Continue with other modules even if one fails
            }
        }
        log.info("Assigned {} core modules to tenant {}", CORE_MODULES.size(), tenant.getName());
    }
    
    /**
     * Create a PostgreSQL schema for a tenant.
     */
    public void createTenantSchema(String schemaName) {
        // Validate schema name before processing
        validateSchemaName(schemaName);
        
        // Sanitize schema name to prevent SQL injection
        String sanitizedSchemaName = sanitizeSchemaName(schemaName);
        
        String sql = "CREATE SCHEMA IF NOT EXISTS \"" + sanitizedSchemaName + "\"";
        jdbcTemplate.execute(sql);
        log.info("Created schema: {}", sanitizedSchemaName);
    }
    
    /**
     * Run Flyway migrations on a tenant schema.
     * Creates a new Flyway instance dynamically for the specific tenant schema.
     * This is the correct approach for runtime schema migrations.
     */
    public void runTenantMigrations(String schemaName) {
        // Validate schema name before processing
        validateSchemaName(schemaName);
        
        String sanitizedSchemaName = sanitizeSchemaName(schemaName);
        
        try {
            // Create a new Flyway instance dynamically for this tenant schema
            // This is the correct approach: don't reuse the application's Flyway bean,
            // but create a new instance with the specific schema configuration
            Flyway flyway = Flyway.configure()
                    .dataSource(jdbcTemplate.getDataSource())
                    .locations("classpath:db/migration/tenant")
                    .schemas(sanitizedSchemaName)
                    .defaultSchema(sanitizedSchemaName)
                    .baselineOnMigrate(true)
                    .validateOnMigrate(true)
                    .load();
            
            // Run migrations on the tenant schema
            flyway.migrate();
            log.info("Successfully ran migrations on tenant schema: {}", sanitizedSchemaName);
        } catch (Exception e) {
            log.error("Failed to run migrations on tenant schema: {}", sanitizedSchemaName, e);
            throw new RuntimeException("Failed to migrate tenant schema: " + sanitizedSchemaName, e);
        }
    }
    
    /**
     * Get tenant by schema name.
     */
    public Tenant getTenantBySchemaName(String schemaName) {
        return tenantRepository.findBySchemaName(schemaName)
                .orElseThrow(() -> new RuntimeException("Tenant not found with schema: " + schemaName));
    }
    
    /**
     * Generate a valid PostgreSQL schema name from tenant name.
     */
    private String generateSchemaName(String name) {
        // Convert to lowercase, replace spaces and special chars with underscores
        String schemaName = name.toLowerCase()
                .replaceAll("[^a-z0-9_]", "_")
                .replaceAll("_+", "_");
        
        // Ensure it starts with a letter
        if (!schemaName.matches("^[a-z].*")) {
            schemaName = "t_" + schemaName;
        }
        
        // Limit length (PostgreSQL schema name limit is 63 chars)
        if (schemaName.length() > 63) {
            schemaName = schemaName.substring(0, 63);
        }
        
        // Add timestamp to ensure uniqueness
        return schemaName + "_" + System.currentTimeMillis();
    }
    
    /**
     * Validate schema name contains only safe characters.
     * Throws IllegalArgumentException if validation fails.
     */
    private void validateSchemaName(String schemaName) {
        if (schemaName == null || schemaName.isBlank()) {
            throw new IllegalArgumentException("Schema name cannot be null or blank");
        }
        
        // Only allow lowercase letters, numbers, and underscores
        // Must start with a letter
        String pattern = "^[a-z][a-z0-9_]*$";
        if (!schemaName.matches(pattern)) {
            throw new IllegalArgumentException(
                String.format("Schema name '%s' contains invalid characters. Only lowercase letters, numbers, and underscores are allowed, and it must start with a letter.", schemaName)
            );
        }
        
        // PostgreSQL schema name limit
        if (schemaName.length() > 63) {
            throw new IllegalArgumentException("Schema name exceeds PostgreSQL limit of 63 characters");
        }
    }
    
    /**
     * Sanitize schema name to prevent SQL injection.
     */
    private String sanitizeSchemaName(String schemaName) {
        // Remove any characters that could be used for SQL injection
        // Only allow alphanumeric, underscore, and ensure it doesn't start with numbers
        return schemaName.replaceAll("[^a-zA-Z0-9_]", "");
    }
}
