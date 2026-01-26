package com.terrarosa.terra_crm.core.tenancy.entity;

/**
 * Status enum for SchemaPool entries.
 */
public enum SchemaPoolStatus {
    /**
     * Schema is ready and available for assignment to a new tenant.
     */
    READY,
    
    /**
     * Schema has been assigned to a tenant.
     */
    ASSIGNED,
    
    /**
     * Schema creation or migration failed.
     */
    ERROR
}
