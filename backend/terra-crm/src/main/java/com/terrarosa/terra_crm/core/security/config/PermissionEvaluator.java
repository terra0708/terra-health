package com.terrarosa.terra_crm.core.security.config;

import com.terrarosa.terra_crm.core.security.service.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.util.Collection;
import java.util.List;

/**
 * Custom permission evaluator that checks permissions from JWT token.
 * Used with @PreAuthorize annotations to protect endpoints.
 */
@Slf4j
@Component("permissionEvaluator")
@RequiredArgsConstructor
public class PermissionEvaluator implements org.springframework.security.access.PermissionEvaluator {
    
    private final JwtService jwtService;
    
    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        if (authentication == null || permission == null) {
            return false;
        }
        
        String permissionName = permission.toString();
        
        // Extract permissions from JWT token
        // The token should be in the authentication details or we need to extract it from the request
        // For now, we'll check if the user has the required permission in their authorities
        // In a real implementation, we'd extract permissions from JWT claims
        
        // Check if user has the required permission
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        return authorities.stream()
                .anyMatch(auth -> auth.getAuthority().equals(permissionName));
    }
    
    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        return hasPermission(authentication, null, permission);
    }
    
    /**
     * Check if the authenticated user has a specific permission.
     * This method extracts permissions from JWT token claims.
     * Used by @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'PERMISSION_NAME')")
     */
    public boolean hasPermission(Authentication authentication, String permissionName) {
        if (authentication == null || permissionName == null) {
            return false;
        }
        
        // Try to get permissions from authentication details (JWT token)
        // The JwtAuthenticationFilter should set permissions in the authentication
        Object details = authentication.getDetails();
        if (details instanceof JwtAuthenticationDetails) {
            JwtAuthenticationDetails jwtDetails = (JwtAuthenticationDetails) details;
            List<String> permissions = jwtDetails.getPermissions();
            if (permissions != null && permissions.contains(permissionName)) {
                log.debug("User has permission: {}", permissionName);
                return true;
            }
        }
        
        // Fallback: check authorities (for backward compatibility with roles)
        boolean hasAuthority = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals(permissionName));
        
        if (hasAuthority) {
            log.debug("User has authority: {}", permissionName);
            return true;
        }
        
        log.debug("User does not have permission: {}", permissionName);
        return false;
    }
    
    /**
     * Wrapper class to hold JWT details including permissions.
     */
    public static class JwtAuthenticationDetails {
        private final List<String> permissions;
        private final String token;
        
        public JwtAuthenticationDetails(List<String> permissions, String token) {
            this.permissions = permissions;
            this.token = token;
        }
        
        public List<String> getPermissions() {
            return permissions;
        }
        
        public String getToken() {
            return token;
        }
    }
}
