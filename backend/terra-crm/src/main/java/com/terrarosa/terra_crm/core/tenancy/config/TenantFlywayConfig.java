package com.terrarosa.terra_crm.core.tenancy.config;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

/**
 * Configuration for reusable Flyway bean for tenant schema migrations.
 * This bean is used by SchemaPoolService to efficiently run migrations
 * on pre-provisioned schemas without creating a new Flyway instance each time.
 */
@Configuration
public class TenantFlywayConfig {
    
    /**
     * Reusable Flyway bean for tenant migrations.
     * This bean is configured once and reused for all tenant schema migrations.
     * Only the schema name needs to be changed when running migrations.
     * 
     * Note: This bean is not directly used - SchemaPoolService creates a new instance
     * based on this template configuration for each schema to avoid state conflicts.
     */
    @Bean(name = "tenantFlywayTemplate")
    public Flyway tenantFlywayTemplate(DataSource dataSource) {
        return Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration/tenant")
                .baselineOnMigrate(true)
                .validateOnMigrate(true)
                .load();
    }
}
