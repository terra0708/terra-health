package com.terrarosa.terra_crm.modules.health.controller;

import com.terrarosa.terra_crm.core.common.dto.ApiResponse;
import com.terrarosa.terra_crm.modules.health.dto.LeadCreateRequest;
import com.terrarosa.terra_crm.modules.health.dto.LeadDto;
import com.terrarosa.terra_crm.modules.health.dto.LeadUpdateRequest;
import com.terrarosa.terra_crm.modules.health.service.LeadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller for health module endpoints.
 * All endpoints are tenant-aware through TenantInterceptor.
 * Endpoints are protected with permission-based authorization.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/health")
@RequiredArgsConstructor
public class HealthController {
    
    private final LeadService leadService;
    
    /**
     * Get all leads for the current tenant.
     * Requires CUSTOMERS_VIEW permission (leads are part of customers module).
     */
    @GetMapping("/leads")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'CUSTOMERS_VIEW')")
    public ResponseEntity<ApiResponse<List<LeadDto>>> getAllLeads() {
        List<LeadDto> leads = leadService.getAllLeads();
        return ResponseEntity.ok(ApiResponse.success(leads));
    }
    
    /**
     * Get a lead by ID.
     * Requires CUSTOMERS_VIEW permission.
     */
    @GetMapping("/leads/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'CUSTOMERS_VIEW')")
    public ResponseEntity<ApiResponse<LeadDto>> getLeadById(@PathVariable UUID id) {
        LeadDto lead = leadService.getLeadById(id);
        return ResponseEntity.ok(ApiResponse.success(lead));
    }
    
    /**
     * Create a new lead.
     * Requires CUSTOMERS_CREATE permission.
     */
    @PostMapping("/leads")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'CUSTOMERS_CREATE')")
    public ResponseEntity<ApiResponse<LeadDto>> createLead(@Valid @RequestBody LeadCreateRequest request) {
        LeadDto lead = leadService.createLead(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(lead, "Lead created successfully"));
    }
    
    /**
     * Update an existing lead.
     * Requires CUSTOMERS_UPDATE permission.
     */
    @PutMapping("/leads/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'CUSTOMERS_UPDATE')")
    public ResponseEntity<ApiResponse<LeadDto>> updateLead(
            @PathVariable UUID id,
            @Valid @RequestBody LeadUpdateRequest request) {
        LeadDto lead = leadService.updateLead(id, request);
        return ResponseEntity.ok(ApiResponse.success(lead, "Lead updated successfully"));
    }
    
    /**
     * Delete a lead.
     * Requires CUSTOMERS_DELETE permission.
     */
    @DeleteMapping("/leads/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'CUSTOMERS_DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteLead(@PathVariable UUID id) {
        leadService.deleteLead(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Lead deleted successfully"));
    }
}
