package com.terrarosa.terra_crm.core.audit.service;

import com.terrarosa.terra_crm.core.audit.entity.AuditLog;
import com.terrarosa.terra_crm.core.audit.repository.AuditLogRepository;
import com.terrarosa.terra_crm.core.security.service.JwtService;
import com.terrarosa.terra_crm.core.tenancy.TenantContext;
import com.terrarosa.terra_crm.modules.auth.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service for managing audit logs.
 * Provides methods for logging actions and querying audit logs.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {
    
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    
    @PersistenceContext
    private EntityManager entityManager;
    
    /**
     * Log an action to the audit log.
     * 
     * @param action Action name (e.g., "TENANT_SUSPENDED")
     * @param resourceType Resource type (e.g., "TENANT", "USER")
     * @param resourceId Resource ID (optional)
     * @param metadata Additional metadata (optional)
     * @param ipAddress IP address of the client (optional)
     * @param userAgent User agent string (optional)
     */
    @Transactional
    public void logAction(String action, String resourceType, UUID resourceId, Map<String, Object> metadata, String ipAddress, String userAgent) {
        // Get current user from SecurityContext
        UUID userId = getCurrentUserId();
        if (userId == null) {
            log.warn("Cannot log action {}: No authenticated user found", action);
            return;
        }
        
        // Get tenant ID from TenantContext
        String tenantIdStr = TenantContext.getCurrentTenantId();
        UUID tenantId = null;
        if (tenantIdStr != null && !tenantIdStr.isBlank()) {
            try {
                tenantId = UUID.fromString(tenantIdStr);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid tenant ID in context: {}", tenantIdStr);
            }
        }
        
        AuditLog auditLog = AuditLog.builder()
                .userId(userId)
                .action(action)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .tenantId(tenantId)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .metadata(metadata != null ? metadata : Map.of())
                .build();
        
        auditLogRepository.save(auditLog);
        log.debug("Logged audit action: {} by user {}", action, userId);
    }
    
    /**
     * Get audit logs with filters.
     * 
     * CRITICAL: Uses Criteria API to build dynamic query with null-safe filters.
     * PostgreSQL cannot determine parameter types in "? IS NULL OR column = ?" patterns,
     * so we use Criteria API to conditionally add predicates only when parameters are not null.
     * 
     * @param tenantId Tenant ID filter (optional)
     * @param action Action filter (optional)
     * @param fromDate Start date filter (optional)
     * @param toDate End date filter (optional)
     * @param pageable Pagination parameters
     * @return Page of audit logs
     */
    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogs(UUID tenantId, String action, LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        
        // Build predicates helper method
        // CRITICAL: @SQLRestriction on BaseEntity doesn't work with Criteria API,
        // so we must manually add deleted = false filter
        java.util.function.Function<Root<AuditLog>, List<Predicate>> buildPredicates = (root) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // CRITICAL: Manually filter out soft-deleted records
            // @SQLRestriction on BaseEntity doesn't apply to Criteria API queries
            predicates.add(cb.or(
                cb.isNull(root.get("deleted")),
                cb.equal(root.get("deleted"), false)
            ));
            
            // Add filters only when parameters are not null
            if (tenantId != null) {
                predicates.add(cb.equal(root.get("tenantId"), tenantId));
            }
            
            if (action != null && !action.isBlank()) {
                predicates.add(cb.equal(root.get("action"), action));
            }
            
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate));
            }
            
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), toDate));
            }
            
            return predicates;
        };
        
        // Execute count query
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<AuditLog> countRoot = countQuery.from(AuditLog.class);
        countQuery.select(cb.count(countRoot));
        List<Predicate> countPredicates = buildPredicates.apply(countRoot);
        if (!countPredicates.isEmpty()) {
            countQuery.where(countPredicates.toArray(new Predicate[0]));
        }
        Long total = entityManager.createQuery(countQuery).getSingleResult();
        
        // Execute data query with pagination
        CriteriaQuery<AuditLog> query = cb.createQuery(AuditLog.class);
        Root<AuditLog> root = query.from(AuditLog.class);
        List<Predicate> dataPredicates = buildPredicates.apply(root);
        if (!dataPredicates.isEmpty()) {
            query.where(dataPredicates.toArray(new Predicate[0]));
        }
        query.orderBy(cb.desc(root.get("createdAt")));
        
        TypedQuery<AuditLog> typedQuery = entityManager.createQuery(query);
        typedQuery.setFirstResult((int) pageable.getOffset());
        typedQuery.setMaxResults(pageable.getPageSize());
        List<AuditLog> results = typedQuery.getResultList();
        
        return new PageImpl<>(results, pageable, total);
    }
    
    /**
     * Get audit logs for a specific user.
     * 
     * @param userId User ID
     * @return List of audit logs
     */
    @Transactional(readOnly = true)
    public java.util.List<AuditLog> getUserAuditLogs(UUID userId) {
        return auditLogRepository.findByUserId(userId);
    }
    
    /**
     * Get audit logs for a specific tenant.
     * 
     * @param tenantId Tenant ID
     * @return List of audit logs
     */
    @Transactional(readOnly = true)
    public java.util.List<AuditLog> getTenantAuditLogs(UUID tenantId) {
        return auditLogRepository.findByTenantId(tenantId);
    }
    
    /**
     * Get audit logs for a specific resource.
     * 
     * @param resourceType Resource type
     * @param resourceId Resource ID
     * @return List of audit logs
     */
    @Transactional(readOnly = true)
    public java.util.List<AuditLog> getResourceAuditLogs(String resourceType, UUID resourceId) {
        return auditLogRepository.findByResource(resourceType, resourceId);
    }
    
    /**
     * Get current user ID from SecurityContext.
     * Extracts email from authentication and looks up user ID from database.
     * 
     * @return User ID or null if not authenticated
     */
    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        
        // Extract email from principal (username is email)
        String email = authentication.getName();
        if (email == null || email.isBlank()) {
            return null;
        }
        
        // Look up user by email to get ID
        return userRepository.findByEmail(email)
                .map(user -> user.getId())
                .orElse(null);
    }
    
    /**
     * Extract IP address from current HTTP request.
     * 
     * @return IP address or null if not available
     */
    public String getCurrentIpAddress() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String ip = request.getHeader("X-Forwarded-For");
                if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                    ip = request.getHeader("X-Real-IP");
                }
                if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                    ip = request.getRemoteAddr();
                }
                return ip;
            }
        } catch (Exception e) {
            log.warn("Failed to extract IP address: {}", e.getMessage());
        }
        return null;
    }
    
    /**
     * Extract user agent from current HTTP request.
     * 
     * @return User agent or null if not available
     */
    public String getCurrentUserAgent() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                return request.getHeader("User-Agent");
            }
        } catch (Exception e) {
            log.warn("Failed to extract user agent: {}", e.getMessage());
        }
        return null;
    }
}
