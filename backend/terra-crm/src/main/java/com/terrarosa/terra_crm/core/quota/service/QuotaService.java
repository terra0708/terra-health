package com.terrarosa.terra_crm.core.quota.service;

import com.terrarosa.terra_crm.core.tenancy.entity.Tenant;
import com.terrarosa.terra_crm.core.tenancy.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

/**
 * Service for quota management and enforcement.
 * Checks quota limits before resource creation/operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QuotaService {

    private final TenantRepository tenantRepository;

    /**
     * Check if a quota limit is exceeded for a tenant.
     * 
     * @param tenantId     Tenant ID
     * @param quotaKey     Quota key (e.g., "customers", "appointments",
     *                     "storage_mb")
     * @param currentCount Current count of the resource
     * @return true if quota is exceeded, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean isQuotaExceeded(UUID tenantId, String quotaKey, long currentCount) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + tenantId));

        Map<String, Object> quotaLimits = tenant.getQuotaLimits();
        if (quotaLimits == null || quotaLimits.isEmpty()) {
            // No quota limits set, allow unlimited
            return false;
        }

        Object limitObj = quotaLimits.get(quotaKey);

        // Special handling for max_users column
        if ("users".equals(quotaKey) && tenant.getMaxUsers() != null) {
            limitObj = tenant.getMaxUsers();
        }

        if (limitObj == null) {
            // No limit for this quota key, allow unlimited
            return false;
        }

        // Convert limit to long (handle both Integer and Long)
        long limit;
        if (limitObj instanceof Number) {
            limit = ((Number) limitObj).longValue();
        } else {
            try {
                limit = Long.parseLong(limitObj.toString());
            } catch (NumberFormatException e) {
                log.warn("Invalid quota limit format for tenant {} and key {}: {}", tenantId, quotaKey, limitObj);
                return false; // Invalid format, allow operation
            }
        }

        boolean exceeded = currentCount >= limit;
        if (exceeded) {
            log.warn("Quota exceeded for tenant {}: {}={} >= limit={}", tenantId, quotaKey, currentCount, limit);
        }

        return exceeded;
    }

    /**
     * Get quota limit for a tenant and quota key.
     * 
     * @param tenantId Tenant ID
     * @param quotaKey Quota key
     * @return Quota limit or null if not set
     */
    @Transactional(readOnly = true)
    public Long getQuotaLimit(UUID tenantId, String quotaKey) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + tenantId));

        Map<String, Object> quotaLimits = tenant.getQuotaLimits();
        if (quotaLimits == null || quotaLimits.isEmpty()) {
            return null;
        }

        Object limitObj = quotaLimits.get(quotaKey);

        // Special handling for max_users column
        if ("users".equals(quotaKey) && tenant.getMaxUsers() != null) {
            limitObj = tenant.getMaxUsers();
        }

        if (limitObj == null) {
            return null;
        }

        if (limitObj instanceof Number) {
            return ((Number) limitObj).longValue();
        }

        try {
            return Long.parseLong(limitObj.toString());
        } catch (NumberFormatException e) {
            log.warn("Invalid quota limit format for tenant {} and key {}: {}", tenantId, quotaKey, limitObj);
            return null;
        }
    }

    /**
     * Get remaining quota for a tenant and quota key.
     * 
     * @param tenantId     Tenant ID
     * @param quotaKey     Quota key
     * @param currentCount Current count
     * @return Remaining quota or null if unlimited
     */
    @Transactional(readOnly = true)
    public Long getRemainingQuota(UUID tenantId, String quotaKey, long currentCount) {
        Long limit = getQuotaLimit(tenantId, quotaKey);
        if (limit == null) {
            return null; // Unlimited
        }

        long remaining = limit - currentCount;
        return remaining > 0 ? remaining : 0;
    }

    /**
     * Validate quota before resource creation.
     * Throws exception if quota is exceeded.
     * 
     * @param tenantId     Tenant ID
     * @param quotaKey     Quota key
     * @param currentCount Current count
     * @throws IllegalStateException if quota is exceeded
     */
    @Transactional(readOnly = true)
    public void validateQuota(UUID tenantId, String quotaKey, long currentCount) {
        if (isQuotaExceeded(tenantId, quotaKey, currentCount)) {
            Long limit = getQuotaLimit(tenantId, quotaKey);
            throw new IllegalStateException(
                    String.format("Quota exceeded for %s: current=%d, limit=%d", quotaKey, currentCount, limit));
        }
    }
}
