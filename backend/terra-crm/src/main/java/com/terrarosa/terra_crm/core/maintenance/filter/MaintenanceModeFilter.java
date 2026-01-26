package com.terrarosa.terra_crm.core.maintenance.filter;

import com.terrarosa.terra_crm.core.maintenance.service.MaintenanceModeService;
import com.terrarosa.terra_crm.core.security.service.JwtService;
import com.terrarosa.terra_crm.core.tenancy.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Filter to check maintenance mode before processing requests.
 * Super Admin requests bypass maintenance mode.
 * 
 * Order: Should run after JWT authentication but before business logic.
 */
@Slf4j
@Component
@Order(2) // Run after JwtAuthenticationFilter (order 1)
@RequiredArgsConstructor
public class MaintenanceModeFilter extends OncePerRequestFilter {
    
    private final MaintenanceModeService maintenanceModeService;
    private final JwtService jwtService;
    
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String path = request.getRequestURI();
        
        // Skip maintenance check for:
        // 1. Super Admin endpoints (they can manage maintenance mode)
        // 2. Public endpoints (login, register, etc.)
        // 3. Actuator endpoints (health checks)
        if (path != null && (
                path.startsWith("/api/v1/super-admin/") ||
                path.startsWith("/api/v1/auth/") ||
                path.startsWith("/actuator/"))) {
            filterChain.doFilter(request, response);
            return;
        }
        
        // Check if user is Super Admin (bypass maintenance mode)
        String token = extractTokenFromRequest(request);
        if (token != null && jwtService.validateToken(token)) {
            try {
                var roles = jwtService.extractRoles(token);
                if (roles != null && roles.contains("ROLE_SUPER_ADMIN")) {
                    // Super Admin bypasses maintenance mode
                    filterChain.doFilter(request, response);
                    return;
                }
            } catch (Exception e) {
                log.warn("Failed to extract roles from token for maintenance check: {}", e.getMessage());
            }
        }
        
        // Check global maintenance mode
        if (maintenanceModeService.isGlobalMaintenanceActive()) {
            log.info("Request blocked: Global maintenance mode is active");
            sendMaintenanceResponse(response, maintenanceModeService.getGlobalMaintenanceMode()
                    .map(mode -> mode.getMessage())
                    .orElse("System is under maintenance. Please try again later."));
            return;
        }
        
        // Check tenant-specific maintenance mode
        String tenantIdStr = TenantContext.getCurrentTenantId();
        if (tenantIdStr != null && !tenantIdStr.isBlank()) {
            try {
                UUID tenantId = UUID.fromString(tenantIdStr);
                if (maintenanceModeService.isTenantMaintenanceActive(tenantId)) {
                    log.info("Request blocked: Tenant {} is under maintenance", tenantId);
                    sendMaintenanceResponse(response, maintenanceModeService.getTenantMaintenanceMode(tenantId)
                            .map(mode -> mode.getMessage())
                            .orElse("This tenant is under maintenance. Please try again later."));
                    return;
                }
            } catch (IllegalArgumentException e) {
                log.warn("Invalid tenant ID in context: {}", tenantIdStr);
            }
        }
        
        // No maintenance mode active, continue
        filterChain.doFilter(request, response);
    }
    
    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
        if (bearerToken != null && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length());
        }
        return null;
    }
    
    private void sendMaintenanceResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(String.format(
                "{\"error\":{\"code\":\"MAINTENANCE_MODE\",\"message\":\"%s\"}}",
                message != null ? message.replace("\"", "\\\"") : "System is under maintenance"
        ));
    }
}
