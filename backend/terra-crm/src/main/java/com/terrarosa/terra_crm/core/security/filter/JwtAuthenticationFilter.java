package com.terrarosa.terra_crm.core.security.filter;

import com.terrarosa.terra_crm.core.security.service.CustomUserDetailsService;
import com.terrarosa.terra_crm.core.security.service.JwtService;
import com.terrarosa.terra_crm.core.tenancy.TenantContext;
import com.terrarosa.terra_crm.core.tenancy.entity.Tenant;
import com.terrarosa.terra_crm.core.tenancy.repository.TenantRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * JWT Authentication Filter that validates JWT tokens and sets authentication context.
 * CRITICAL: Validates that X-Tenant-ID header matches the tenantId in JWT to prevent cross-tenant access.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String TENANT_HEADER = "X-Tenant-ID";
    
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final TenantRepository tenantRepository;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String token = extractTokenFromRequest(request);
        
        // If no token, continue filter chain (public endpoints)
        if (!StringUtils.hasText(token)) {
            filterChain.doFilter(request, response);
            return;
        }
        
        // Validate token
        if (!jwtService.validateToken(token)) {
            log.warn("Invalid JWT token");
            filterChain.doFilter(request, response);
            return;
        }
        
        // Extract roles from JWT to check if user is Super Admin
        List<String> roles = jwtService.extractRoles(token);
        boolean isSuperAdmin = roles != null && roles.contains("ROLE_SUPER_ADMIN");
        
        // Check if this is a Super Admin endpoint
        String requestPath = request.getRequestURI();
        boolean isSuperAdminEndpoint = requestPath != null && requestPath.startsWith("/api/v1/super-admin/");
        
        // CRITICAL: Extract tenant ID from header
        String headerTenantId = request.getHeader(TENANT_HEADER);
        
        // CRITICAL: Extract tenant ID from JWT
        String jwtTenantId = jwtService.extractTenantId(token);
        
        if (jwtTenantId == null || jwtTenantId.isBlank()) {
            log.error("JWT token does not contain tenantId claim");
            throw new AccessDeniedException("Invalid JWT token: missing tenantId");
        }
        
        // Extract schema name from JWT
        String schemaName = jwtService.extractSchemaName(token);
        
        if (schemaName == null || schemaName.isBlank()) {
            log.error("JWT token does not contain schema_name claim");
            throw new AccessDeniedException("Invalid JWT token: missing schema_name");
        }
        
        // Super Admin special handling
        if (isSuperAdmin && isSuperAdminEndpoint) {
            // Super Admin endpoints work in public schema
            // X-Tenant-ID header is optional (handled by TenantInterceptor)
            // Always use public schema for Super Admin operations
            TenantContext.setCurrentTenant(jwtTenantId, "public");
            log.debug("Set tenant context for Super Admin: tenantId={}, schemaName=public", jwtTenantId);
        } else {
            // Normal tenant user handling
            if (headerTenantId == null || headerTenantId.isBlank()) {
                log.error("X-Tenant-ID header is required for authenticated requests");
                throw new AccessDeniedException("X-Tenant-ID header is required");
            }
            
            // CRITICAL: Compare header tenant ID with JWT tenant ID
            if (!jwtTenantId.equals(headerTenantId)) {
                log.error("Tenant ID mismatch: JWT tenantId={}, Header tenantId={}", jwtTenantId, headerTenantId);
                throw new AccessDeniedException("Tenant ID mismatch between JWT and header");
            }
            
            // CRITICAL: Check if tenant can accept requests (status validation)
            // SUSPENDED tenants are rejected at filter level (before business logic)
            try {
                UUID tenantUuid = UUID.fromString(jwtTenantId);
                Tenant tenant = tenantRepository.findById(tenantUuid).orElse(null);
                
                if (tenant == null) {
                    log.error("Tenant not found with ID: {}", jwtTenantId);
                    throw new AccessDeniedException("Tenant not found");
                }
                
                if (!tenant.canAcceptRequests()) {
                    log.warn("Request rejected: Tenant {} is SUSPENDED", jwtTenantId);
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"Tenant is suspended and cannot accept requests\"}");
                    return;
                }
            } catch (IllegalArgumentException e) {
                log.error("Invalid tenant ID format: {}", jwtTenantId);
                throw new AccessDeniedException("Invalid tenant ID format");
            }
            
            // Set TenantContext
            TenantContext.setCurrentTenant(jwtTenantId, schemaName);
            log.debug("Set tenant context from JWT: tenantId={}, schemaName={}", jwtTenantId, schemaName);
        }
        
        // Extract email and load user details
        String email = jwtService.extractEmail(token);
        
        // Extract permissions from JWT token
        List<String> permissions = jwtService.extractPermissions(token);
        
        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            
            // Create authentication token
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetails,
                    null,
                    userDetails.getAuthorities()
            );
            
            // Set JWT details including permissions for permission evaluator
            com.terrarosa.terra_crm.core.security.config.PermissionEvaluator.JwtAuthenticationDetails jwtDetails = 
                    new com.terrarosa.terra_crm.core.security.config.PermissionEvaluator.JwtAuthenticationDetails(permissions, token);
            authentication.setDetails(jwtDetails);
            
            // Set authentication in security context
            SecurityContextHolder.getContext().setAuthentication(authentication);
            log.debug("Set authentication for user: {} with {} permissions", email, permissions.size());
        }
        
        try {
            filterChain.doFilter(request, response);
        } finally {
            // Clear tenant context after request completion to prevent memory leaks
            TenantContext.clear();
        }
    }
    
    /**
     * Extract JWT token from request.
     * Priority: 1. Cookie (accessToken), 2. Authorization header (DEPRECATED - backward compatibility)
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        // 1. Önce cookie'den oku (PRIMARY METHOD)
        jakarta.servlet.http.Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (jakarta.servlet.http.Cookie cookie : cookies) {
                if ("accessToken".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        
        // 2. DEPRECATED: Authorization header'dan oku (backward compatibility)
        // TODO: Bu fallback mekanizması 2026-03-01 tarihinde kaldırılacak
        // Migration tamamlandıktan sonra bu blok silinecek
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            log.warn("DEPRECATED: Token read from Authorization header. Cookie-based auth should be used.");
            return bearerToken.substring(BEARER_PREFIX.length());
        }
        
        return null;
    }
}
