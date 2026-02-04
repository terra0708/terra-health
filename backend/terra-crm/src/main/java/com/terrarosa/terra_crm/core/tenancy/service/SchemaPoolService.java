package com.terrarosa.terra_crm.core.tenancy.service;

import com.terrarosa.terra_crm.core.tenancy.TenantContext;
import com.terrarosa.terra_crm.core.tenancy.dto.SchemaPoolStatsResponse;
import com.terrarosa.terra_crm.core.tenancy.entity.SchemaPool;
import com.terrarosa.terra_crm.core.tenancy.entity.SchemaPoolStatus;
import com.terrarosa.terra_crm.core.tenancy.repository.SchemaPoolRepository;
import com.terrarosa.terra_crm.core.tenancy.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.DependsOn;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing the schema pool.
 * Pre-provisions tenant schemas to enable fast tenant creation.
 * 
 * CRITICAL: This service depends on Flyway to ensure migrations are complete
 * before attempting to access schema_pool table.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@DependsOn("flyway") // CRITICAL: Wait for Flyway migrations to complete before accessing tables
public class SchemaPoolService {

    private final SchemaPoolRepository schemaPoolRepository;
    private final TenantRepository tenantRepository;
    private final JdbcTemplate jdbcTemplate;
    private final TenantService tenantService; // For reusing createTenantSchema and runTenantMigrations
    private final com.terrarosa.terra_crm.modules.health.service.CustomerParametersService customerParametersService;
    private final com.terrarosa.terra_crm.modules.health.service.ReminderSettingsService reminderSettingsService;

    @Value("${schema-pool.min-ready-count:3}")
    private int minReadyCount;

    @Value("${schema-pool.schema-prefix:tp_}")
    private String schemaPrefix;

    @Value("${schema-pool.schema-name-length:8}")
    private int schemaNameLength;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String ALPHANUMERIC = "abcdefghijklmnopqrstuvwxyz0123456789";

    /**
     * Scheduled task to replenish the schema pool.
     * Runs every 5 minutes and ensures minimum number of READY schemas.
     * 
     * CRITICAL: DDL operations (schema creation, migrations) run outside
     * transaction
     * to prevent connection pool exhaustion.
     */
    @Scheduled(fixedDelay = 300000) // 5 minutes = 300000 milliseconds
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void replenishPool() {
        try {
            long readyCount = schemaPoolRepository.countByStatus(SchemaPoolStatus.READY);
            log.debug("Schema pool status: {} READY schemas (minimum: {})", readyCount, minReadyCount);

            if (readyCount < minReadyCount) {
                int schemasToCreate = (int) (minReadyCount - readyCount);
                log.info("Pool replenishment needed. Creating {} schema(s)...", schemasToCreate);

                for (int i = 0; i < schemasToCreate; i++) {
                    try {
                        provisionSchema();
                    } catch (Exception e) {
                        log.error("Failed to provision schema during pool replenishment: {}", e.getMessage(), e);
                        // Continue with next schema instead of failing entire task
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error during schema pool replenishment: {}", e.getMessage(), e);
            // Don't rethrow - scheduled tasks should not crash the application
        }
    }

    /**
     * Provision a new schema and add it to the pool.
     * Creates the schema, runs migrations, and adds it to the pool with READY
     * status.
     * 
     * @return The created SchemaPool entry
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public SchemaPool provisionSchema() {
        String schemaName = generateUniqueSchemaName();
        log.info("Provisioning new schema: {}", schemaName);

        try {
            // Create schema
            tenantService.createTenantSchema(schemaName);

            // Run migrations using reusable Flyway configuration
            runTenantMigrations(schemaName);

            // Seed system default parameters for the health module
            // CRITICAL: Set context BEFORE calling transactional seeding method
            TenantContext.setCurrentTenant(null, schemaName);
            try {
                customerParametersService.ensureSystemDefaults();
                reminderSettingsService.ensureSystemDefaults();
            } finally {
                TenantContext.clear();
            }

            // Create SchemaPool entry with READY status
            SchemaPool schemaPool = SchemaPool.builder()
                    .schemaName(schemaName)
                    .status(SchemaPoolStatus.READY)
                    .build();

            SchemaPool saved = schemaPoolRepository.save(schemaPool);
            log.info("Successfully provisioned schema: {} (id: {})", schemaName, saved.getId());

            return saved;
        } catch (Exception e) {
            log.error("Failed to provision schema {}: {}", schemaName, e.getMessage(), e);

            // Try to drop the schema if it was created
            try {
                dropSchema(schemaName);
            } catch (Exception dropException) {
                log.error("Failed to drop schema {} after provisioning failure: {}", schemaName,
                        dropException.getMessage());
            }

            // Create SchemaPool entry with ERROR status for tracking
            SchemaPool errorEntry = SchemaPool.builder()
                    .schemaName(schemaName)
                    .status(SchemaPoolStatus.ERROR)
                    .build();

            schemaPoolRepository.save(errorEntry);

            throw new RuntimeException("Failed to provision schema: " + schemaName, e);
        }
    }

    /**
     * Generate a unique schema name with retry loop to prevent collisions.
     * Checks both SchemaPool and Tenant tables for uniqueness.
     * 
     * @return Unique schema name (e.g., tp_a7b2c9d1)
     */
    private String generateUniqueSchemaName() {
        String schemaName;
        int maxRetries = 10;
        int retryCount = 0;

        do {
            // Use String.format for compatibility (Java 25 String Templates may not be
            // stable)
            String randomPart = generateRandomString(schemaNameLength);
            schemaName = String.format("%s%s", schemaPrefix, randomPart);

            retryCount++;
            if (retryCount >= maxRetries) {
                throw new IllegalStateException(
                        String.format("Failed to generate unique schema name after %d attempts", maxRetries));
            }
        } while (schemaPoolRepository.existsBySchemaName(schemaName) ||
                tenantRepository.findBySchemaName(schemaName).isPresent());

        return schemaName;
    }

    /**
     * Generate a random alphanumeric string of specified length.
     * Uses SecureRandom for cryptographically secure randomness.
     * 
     * @param length Desired length of the random string
     * @return Random alphanumeric string (lowercase)
     */
    private String generateRandomString(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int index = SECURE_RANDOM.nextInt(ALPHANUMERIC.length());
            sb.append(ALPHANUMERIC.charAt(index));
        }
        return sb.toString();
    }

    /**
     * Run Flyway migrations on a tenant schema.
     * Uses the same approach as TenantService but with reusable configuration.
     * 
     * @param schemaName Schema name to migrate
     */
    private void runTenantMigrations(String schemaName) {
        // Validate schema name
        tenantService.validateSchemaName(schemaName);

        String sanitizedSchemaName = tenantService.sanitizeSchemaName(schemaName);

        try {
            // Create Flyway instance for this specific schema
            // Reuse configuration pattern from TenantService for consistency
            Flyway flyway = Flyway.configure()
                    .dataSource(jdbcTemplate.getDataSource())
                    .locations("classpath:db/migration/tenant")
                    .schemas(sanitizedSchemaName)
                    .defaultSchema(sanitizedSchemaName)
                    .baselineOnMigrate(true)
                    .validateOnMigrate(true)
                    .load();

            // Run migrations
            flyway.migrate();
            log.info("Successfully ran migrations on schema: {}", sanitizedSchemaName);
        } catch (Exception e) {
            log.error("Failed to run migrations on schema: {}", sanitizedSchemaName, e);
            throw new RuntimeException("Failed to migrate schema: " + sanitizedSchemaName, e);
        }
    }

    /**
     * Drop a schema (used for cleanup on provisioning failure).
     * 
     * @param schemaName Schema name to drop
     */
    private void dropSchema(String schemaName) {
        String sanitizedSchemaName = tenantService.sanitizeSchemaName(schemaName);
        String sql = String.format("DROP SCHEMA IF EXISTS \"%s\" CASCADE", sanitizedSchemaName);
        jdbcTemplate.execute(sql);
        log.info("Dropped schema: {}", sanitizedSchemaName);
    }

    /**
     * Get comprehensive statistics about the schema pool.
     * Uses a single GROUP BY query to minimize database I/O.
     * 
     * CRITICAL: Uses EnumMap for safe parsing because PostgreSQL GROUP BY
     * does not return rows for statuses with zero records. This prevents
     * IndexOutOfBoundsException when accessing results by index.
     * 
     * @return SchemaPoolStatsResponse containing all pool statistics
     */
    @Transactional(readOnly = true)
    public SchemaPoolStatsResponse getPoolStats() {
        log.debug("Fetching schema pool statistics");

        // 1. Get all status counts in a single GROUP BY query
        List<Object[]> groupedResults = schemaPoolRepository.countByStatusGrouped();

        // 2. Initialize EnumMap with default 0L for all statuses
        // This ensures that even if PostgreSQL doesn't return a row for a status,
        // we have a safe default value (0L)
        EnumMap<SchemaPoolStatus, Long> statusCounts = new EnumMap<>(SchemaPoolStatus.class);
        for (SchemaPoolStatus status : SchemaPoolStatus.values()) {
            statusCounts.put(status, 0L);
        }

        // 3. Parse database results and populate the map
        // Each Object[] contains [status, count]
        for (Object[] row : groupedResults) {
            SchemaPoolStatus status = (SchemaPoolStatus) row[0];
            Long count = ((Number) row[1]).longValue();
            statusCounts.put(status, count);
        }

        // 4. Safely extract counts from EnumMap (guaranteed to have values)
        Long readyCount = statusCounts.get(SchemaPoolStatus.READY);
        Long assignedCount = statusCounts.get(SchemaPoolStatus.ASSIGNED);
        Long errorCount = statusCounts.get(SchemaPoolStatus.ERROR);

        // 5. Calculate total count
        Long totalCount = readyCount + assignedCount + errorCount;

        // 6. Get last provisioning time (most recently created READY schema)
        Optional<SchemaPool> lastReadySchema = schemaPoolRepository
                .findFirstByStatusAndDeletedFalseOrderByCreatedAtDesc(SchemaPoolStatus.READY);
        LocalDateTime lastProvisioningTime = lastReadySchema
                .map(SchemaPool::getCreatedAt)
                .orElse(null);

        // 7. Get minReadyCount from configuration (already injected via @Value)
        Long minReadyCountLong = (long) minReadyCount;

        // 8. Create and return response
        SchemaPoolStatsResponse response = new SchemaPoolStatsResponse(
                readyCount,
                assignedCount,
                errorCount,
                totalCount,
                minReadyCountLong,
                lastProvisioningTime);

        log.debug("Schema pool statistics: READY={}, ASSIGNED={}, ERROR={}, TOTAL={}, MIN_READY={}",
                readyCount, assignedCount, errorCount, totalCount, minReadyCountLong);

        return response;
    }
}
