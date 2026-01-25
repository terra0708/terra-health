package com.terrarosa.terra_crm.core.security.filter;

import com.terrarosa.terra_crm.core.security.service.CustomUserDetailsService;
import com.terrarosa.terra_crm.core.security.service.JwtService;
import com.terrarosa.terra_crm.core.tenancy.TenantContext;
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
        
        // CRITICAL: Extract tenant ID from header
        String headerTenantId = request.getHeader(TENANT_HEADER);
        
        if (headerTenantId == null || headerTenantId.isBlank()) {
            log.error("X-Tenant-ID header is required for authenticated requests");
            throw new AccessDeniedException("X-Tenant-ID header is required");
        }
        
        // CRITICAL: Extract tenant ID from JWT
        String jwtTenantId = jwtService.extractTenantId(token);
        
        if (jwtTenantId == null || jwtTenantId.isBlank()) {
            log.error("JWT token does not contain tenantId claim");
            throw new AccessDeniedException("Invalid JWT token: missing tenantId");
        }
        
        // CRITICAL: Compare header tenant ID with JWT tenant ID
        if (!jwtTenantId.equals(headerTenantId)) {
            log.error("Tenant ID mismatch: JWT tenantId={}, Header tenantId={}", jwtTenantId, headerTenantId);
            throw new AccessDeniedException("Tenant ID mismatch between JWT and header");
        }
        
        // Extract schema name from JWT
        String schemaName = jwtService.extractSchemaName(token);
        
        if (schemaName == null || schemaName.isBlank()) {
            log.error("JWT token does not contain schema_name claim");
            throw new AccessDeniedException("Invalid JWT token: missing schema_name");
        }
        
        // Set TenantContext
        TenantContext.setCurrentTenant(jwtTenantId, schemaName);
        log.debug("Set tenant context from JWT: tenantId={}, schemaName={}", jwtTenantId, schemaName);
        
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
     * Extract JWT token from Authorization header.
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
        
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length());
        }
        
        return null;
    }
}
