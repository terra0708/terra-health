package com.terrarosa.terra_crm.core.audit.aspect;

import com.terrarosa.terra_crm.core.audit.annotation.AuditLog;
import com.terrarosa.terra_crm.core.audit.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * AOP Aspect for automatic audit logging.
 * 
 * CRITICAL: This aspect only intercepts public methods in *Service classes
 * that are annotated with @AuditLog. Helper methods, private methods, and
 * non-Service classes are NOT intercepted to prevent log flooding.
 * 
 * Pointcut: "@annotation(auditLog) && execution(public * com.terrarosa.terra_crm..*Service.*(..))"
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class AuditLogAspect {
    
    private final AuditLogService auditLogService;
    
    /**
     * Intercept methods annotated with @AuditLog.
     * 
     * CRITICAL: Pointcut targets ONLY:
     * - Methods annotated with @AuditLog
     * - Public methods (excludes private/protected)
     * - Methods in *Service classes (excludes repositories, entities, helpers)
     * 
     * This prevents logging of:
     * - Helper methods called from within service methods
     * - Loop iterations
     * - Internal operations
     */
    @Around("@annotation(auditLog) && execution(public * com.terrarosa.terra_crm..*Service.*(..))")
    public Object logAudit(ProceedingJoinPoint joinPoint, AuditLog auditLog) throws Throwable {
        long startTime = System.currentTimeMillis();
        Object result = null;
        Throwable exception = null;
        
        try {
            // Execute the method
            result = joinPoint.proceed();
            return result;
        } catch (Throwable e) {
            exception = e;
            throw e;
        } finally {
            // Log the action (always log, even on exception)
            try {
                logAuditAction(joinPoint, auditLog, result, exception, startTime);
            } catch (Exception logException) {
                // Don't let logging exceptions break the business logic
                log.error("Failed to log audit action: {}", logException.getMessage(), logException);
            }
        }
    }
    
    /**
     * Log the audit action with all extracted information.
     */
    private void logAuditAction(ProceedingJoinPoint joinPoint, AuditLog auditLog, Object result, Throwable exception, long startTime) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        
        // Extract resource ID from method parameters or return value
        UUID resourceId = extractResourceId(joinPoint, auditLog, result);
        
        // Build metadata
        Map<String, Object> metadata = new HashMap<>();
        
        // Add method execution time
        long executionTime = System.currentTimeMillis() - startTime;
        metadata.put("execution_time_ms", executionTime);
        
        // Add method name
        metadata.put("method", method.getName());
        metadata.put("class", method.getDeclaringClass().getName());
        
        // Add parameters if requested
        if (auditLog.includeParams()) {
            Object[] args = joinPoint.getArgs();
            String[] paramNames = signature.getParameterNames();
            Map<String, Object> params = new HashMap<>();
            for (int i = 0; i < args.length; i++) {
                // Exclude sensitive parameters (passwords, tokens)
                if (paramNames[i] != null && 
                    (paramNames[i].toLowerCase().contains("password") || 
                     paramNames[i].toLowerCase().contains("token") ||
                     paramNames[i].toLowerCase().contains("secret"))) {
                    params.put(paramNames[i], "***REDACTED***");
                } else {
                    params.put(paramNames[i], args[i] != null ? args[i].toString() : null);
                }
            }
            metadata.put("parameters", params);
        }
        
        // Add return value (only on success)
        if (result != null && exception == null) {
            // Don't log full return value if it's large (e.g., lists)
            if (result instanceof java.util.Collection) {
                metadata.put("return_type", "Collection");
                metadata.put("return_size", ((java.util.Collection<?>) result).size());
            } else {
                metadata.put("return_value", result.toString());
            }
        }
        
        // Add exception info if method failed
        if (exception != null) {
            metadata.put("exception", exception.getClass().getName());
            metadata.put("exception_message", exception.getMessage());
        }
        
        // Extract IP address and user agent
        String ipAddress = auditLogService.getCurrentIpAddress();
        String userAgent = auditLogService.getCurrentUserAgent();
        
        // Log the action
        auditLogService.logAction(
                auditLog.action(),
                auditLog.resourceType().isEmpty() ? null : auditLog.resourceType(),
                resourceId,
                metadata,
                ipAddress,
                userAgent
        );
    }
    
    /**
     * Extract resource ID from method parameters or return value.
     * Looks for UUID parameters that match common resource ID patterns.
     */
    private UUID extractResourceId(ProceedingJoinPoint joinPoint, AuditLog auditLog, Object result) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        Object[] args = joinPoint.getArgs();
        String[] paramNames = signature.getParameterNames();
        
        // Try to find resource ID in method parameters
        // Common patterns: tenantId, userId, id, resourceId
        for (int i = 0; i < args.length; i++) {
            if (args[i] instanceof UUID) {
                String paramName = paramNames[i] != null ? paramNames[i].toLowerCase() : "";
                if (paramName.contains("id") && 
                    (paramName.contains("tenant") || 
                     paramName.contains("user") || 
                     paramName.contains("resource") ||
                     paramName.equals("id"))) {
                    return (UUID) args[i];
                }
            }
        }
        
        // If no resource ID found in parameters, try return value
        if (result instanceof UUID) {
            return (UUID) result;
        }
        
        // If result is an entity with getId() method, extract ID
        if (result != null) {
            try {
                Method getIdMethod = result.getClass().getMethod("getId");
                Object id = getIdMethod.invoke(result);
                if (id instanceof UUID) {
                    return (UUID) id;
                }
            } catch (Exception e) {
                // Ignore - not all return types have getId()
            }
        }
        
        return null;
    }
}
