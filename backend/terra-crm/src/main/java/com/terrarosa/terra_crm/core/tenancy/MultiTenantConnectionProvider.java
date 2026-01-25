package com.terrarosa.terra_crm.core.tenancy;

import lombok.extern.slf4j.Slf4j;
import org.hibernate.engine.jdbc.connections.spi.AbstractDataSourceBasedMultiTenantConnectionProviderImpl;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Hibernate connection provider that sets the PostgreSQL search_path
 * to the tenant's schema for each connection.
 * 
 * CRITICAL: This implementation ensures connection pool safety by:
 * 1. ALWAYS setting the schema when getting a connection (prevents pollution from pool)
 * 2. ALWAYS resetting to public when releasing (prevents leakage to next tenant)
 * 3. Validating connection state before use
 */
@Slf4j
@Component
public class MultiTenantConnectionProvider extends AbstractDataSourceBasedMultiTenantConnectionProviderImpl<String> {
    
    private static final String RESET_SCHEMA_SQL = "SET search_path TO public";
    
    private final DataSource dataSource;
    
    /**
     * Constructor injection ensures DataSource is provided by Spring.
     * This is critical because Hibernate will use the Spring-managed bean instance
     * provided via HibernateConfig, not instantiate this class directly.
     */
    public MultiTenantConnectionProvider(DataSource dataSource) {
        this.dataSource = dataSource;
    }
    
    @Override
    protected DataSource selectAnyDataSource() {
        return dataSource; // Hibernate'in başlangıçta kullanacağı default kaynak
    }
    
    @Override
    protected DataSource selectDataSource(String tenantIdentifier) {
        return dataSource;
    }
    
    /**
     * Get any connection for Hibernate metadata validation.
     * This is called during application startup when Hibernate validates the schema.
     * Returns a connection without setting any tenant schema (uses default/public).
     */
    @Override
    public Connection getAnyConnection() throws SQLException {
        return dataSource.getConnection(); // Metadata kontrolü için public/default bağlantı
    }
    
    /**
     * Release any connection used for metadata validation.
     */
    @Override
    public void releaseAnyConnection(Connection connection) throws SQLException {
        connection.close();
    }
    
    @Override
    public Connection getConnection(String tenantIdentifier) throws SQLException {
        Connection connection = super.getConnection(tenantIdentifier);
        
        // CRITICAL: Always set schema when getting connection from pool
        // Even if connection was reset, we must set it again to prevent pollution
        // Connection pool may return a connection that was used by another tenant
        String schemaName = tenantIdentifier != null ? tenantIdentifier : "public";
        
        // Validate connection is still open
        if (connection.isClosed()) {
            throw new SQLException("Connection from pool is already closed");
        }
        
        try {
            // Always set search_path - this is idempotent and safe
            // This prevents schema pollution from previous tenant usage
            setSearchPath(connection, schemaName);
            log.debug("Set search_path to schema: {} for connection", schemaName);
        } catch (SQLException e) {
            log.error("Failed to set search_path to schema: {}", schemaName, e);
            // Don't return polluted connection to pool - close it
            try {
                connection.close();
            } catch (SQLException closeEx) {
                log.error("Failed to close connection after schema set failure", closeEx);
            }
            throw new SQLException("Failed to set tenant schema on connection", e);
        }
        
        return connection;
    }
    
    @Override
    public void releaseConnection(String tenantIdentifier, Connection connection) throws SQLException {
        if (connection == null || connection.isClosed()) {
            // Connection already closed, nothing to do
            return;
        }
        
        // CRITICAL: Always reset to public before returning to pool
        // This prevents schema leakage to the next tenant that uses this connection
        try {
            resetSearchPath(connection);
            log.debug("Reset search_path to public before releasing connection to pool");
        } catch (SQLException e) {
            log.error("CRITICAL: Failed to reset search_path to public. Destroying connection to prevent data leakage!", e);
            // CRITICAL: Don't return polluted connection to pool - destroy it
            try {
                connection.close();
            } catch (SQLException closeEx) {
                log.error("Failed to close polluted connection", closeEx);
            }
            // Don't call super.releaseConnection - connection is destroyed
            return;
        }
        
        // Only release if reset was successful
        super.releaseConnection(tenantIdentifier, connection);
    }
    
    /**
     * Set search_path to the specified schema.
     * This method is idempotent - safe to call multiple times.
     */
    private void setSearchPath(Connection connection, String schemaName) throws SQLException {
        // Escape schema name to prevent SQL injection
        String escapedSchemaName = "\"" + schemaName.replace("\"", "\"\"") + "\"";
        String sql = "SET search_path TO " + escapedSchemaName;
        
        try (Statement statement = connection.createStatement()) {
            statement.execute(sql);
        }
    }
    
    /**
     * Reset search_path to public schema.
     * This must be called before returning connection to pool.
     */
    private void resetSearchPath(Connection connection) throws SQLException {
        try (Statement statement = connection.createStatement()) {
            statement.execute(RESET_SCHEMA_SQL);
        }
    }
}
