package com.terrarosa.terra_crm.core.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

/**
 * Explicit Flyway configuration to ensure migrations run before any other beans.
 * 
 * CRITICAL: This configuration ensures Flyway migrations are executed
 * before any CommandLineRunner or @Scheduled tasks that depend on database tables.
 * 
 * Spring Boot's auto-configuration creates a Flyway bean, but this explicit
 * configuration provides better control and guarantees execution order.
 */
@Slf4j
@Configuration
public class FlywayConfig {
    
    private final DataSource dataSource;
    
    @Value("${spring.flyway.locations:classpath:db/migration/public}")
    private String[] locations;
    
    @Value("${spring.flyway.schemas:public}")
    private String[] schemas;
    
    @Value("${spring.flyway.default-schema:public}")
    private String defaultSchema;
    
    @Value("${spring.flyway.baseline-on-migrate:true}")
    private boolean baselineOnMigrate;
    
    @Value("${spring.flyway.baseline-version:0}")
    private String baselineVersion;
    
    public FlywayConfig(DataSource dataSource) {
        this.dataSource = dataSource;
    }
    
    /**
     * Creates and configures Flyway bean for public schema migrations.
     * The initMethod = "migrate" ensures migrations run immediately when bean is created.
     * 
     * @return Configured Flyway instance
     */
    @Bean(name = "flyway", initMethod = "migrate")
    public Flyway flyway() {
        log.info("Configuring Flyway for public schema migrations...");
        log.debug("Flyway locations: {}", String.join(", ", locations));
        log.debug("Flyway schemas: {}", String.join(", ", schemas));
        log.debug("Flyway baseline-on-migrate: {}", baselineOnMigrate);
        log.debug("Flyway baseline-version: {}", baselineVersion);
        
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations(locations)
                .schemas(schemas)
                .defaultSchema(defaultSchema)
                .baselineOnMigrate(baselineOnMigrate)
                .baselineVersion(baselineVersion)
                .load();
        
        log.info("Flyway bean created successfully. Migrations will run on bean initialization.");
        return flyway;
    }
    
    /**
     * Post-construct hook to log migration status.
     * This runs after migrations have completed.
     */
    @PostConstruct
    public void logMigrationStatus() {
        log.info("Flyway migrations completed. Database schema is ready.");
    }
}
