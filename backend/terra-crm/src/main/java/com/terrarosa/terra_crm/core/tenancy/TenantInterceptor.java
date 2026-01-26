package com.terrarosa.terra_crm.core.tenancy;

import com.terrarosa.terra_crm.core.tenancy.entity.Tenant;
import com.terrarosa.terra_crm.core.tenancy.repository.TenantRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Interceptor that handles tenant context for public (unauthenticated) endpoints.
 * 
 * CRITICAL: For /api/v1/auth/** endpoints (login/register), this interceptor validates
 * tenant existence and sets tenant context (but keeps schema as public since users table
 * is in public schema).
 * 
 * For authenticated requests, JwtAuthenticationFilter handles tenant context.
 * This interceptor only clears the context in afterCompletion.
 * 
 * IMPORTANT: Login/register requests work in public schema (users table is in public schema).
 * This interceptor only validates tenant existence, it does NOT change database schema.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TenantInterceptor implements HandlerInterceptor {
    
    private static final String TENANT_HEADER = "X-Tenant-ID";
    
    private final TenantRepository tenantRepository;
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String path = request.getRequestURI();
        
        // CRITICAL: Super Admin endpoints don't require X-Tenant-ID header
        // They work in public schema and are handled by JwtAuthenticationFilter
        if (path != null && path.startsWith("/api/v1/super-admin/")) {
            // Set tenant context to public schema (no tenant ID needed)
            TenantContext.setCurrentTenant(null, "public");
            log.debug("TenantInterceptor: Super Admin endpoint detected, using public schema");
            return true;
        }
        
        // Only handle tenant context for auth endpoints (login/register)
        // JWT-authenticated requests are handled by JwtAuthenticationFilter
        if (!path.startsWith("/api/v1/auth/")) {
            return true;
        }
        
        String tenantId = request.getHeader(TENANT_HEADER);
        
        if (tenantId == null || tenantId.isBlank()) {
            log.warn("Request missing {} header. Public schema will be used for login/register.", TENANT_HEADER);
            // For login/register, public schema is used (users table is in public schema)
            // Set tenant context but keep schema as public
            TenantContext.setCurrentTenant(null, "public");
            return true;
        }
        
        // Validate tenant exists in public schema (tenants table is in public schema)
        // This query runs in public schema, no need to change schema
        try {
            Tenant tenant = tenantRepository.findById(java.util.UUID.fromString(tenantId))
                    .orElse(null);
            
            if (tenant == null) {
                log.error("Tenant not found with ID: {}", tenantId);
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                return false;
            }
            
            // CRITICAL: Check if tenant can accept requests (status validation)
            // SUSPENDED tenants are rejected at interceptor level (before database queries)
            if (!tenant.canAcceptRequests()) {
                log.warn("Request rejected: Tenant {} is SUSPENDED", tenantId);
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                // Write JSON error response
                try {
                    response.getWriter().write("{\"error\":\"Tenant is suspended and cannot accept requests\"}");
                } catch (java.io.IOException e) {
                    log.error("Failed to write error response", e);
                }
                return false;
            }
            
            // Set tenant context but keep schema as public
            // Login/register operations work in public schema (users table is there)
            TenantContext.setCurrentTenant(tenantId, "public");
            log.info("TenantInterceptor: Set tenant context for auth endpoint - tenantId={}, schemaName=public", tenantId);
        } catch (IllegalArgumentException e) {
            log.error("Invalid tenant ID format: {}", tenantId);
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return false;
        }
        
        return true;
    }
    
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        // Clear tenant context after request completion to prevent memory leaks
        TenantContext.clear();
    }
}
