package com.terrarosa.terra_crm.core.audit.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation for automatic audit logging via AOP.
 * 
 * Methods annotated with @AuditLog will be automatically intercepted by AuditLogAspect
 * and logged to the audit_logs table.
 * 
 * CRITICAL: Only public methods in *Service classes are intercepted.
 * Helper methods, private methods, and non-Service classes are NOT logged.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface AuditLog {
    
    /**
     * Action name to log (e.g., "TENANT_SUSPENDED", "SESSION_STARTED").
     * This is a required field.
     */
    String action();
    
    /**
     * Resource type affected by this action (e.g., "TENANT", "USER", "MODULE").
     * Optional - can be null if not applicable.
     */
    String resourceType() default "";
    
    /**
     * Whether to include method parameters in the audit log metadata.
     * Default is true. Set to false for sensitive data.
     */
    boolean includeParams() default true;
}
