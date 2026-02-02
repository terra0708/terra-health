package com.terrarosa.terra_crm.modules.ads.controller;

import com.terrarosa.terra_crm.core.common.dto.ApiResponse;
import com.terrarosa.terra_crm.modules.ads.dto.LeadCreateRequest;
import com.terrarosa.terra_crm.modules.ads.dto.LeadDto;
import com.terrarosa.terra_crm.modules.ads.dto.LeadUpdateRequest;
import com.terrarosa.terra_crm.modules.ads.service.LeadService;
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
 * Lead CRUD endpoints for ads / marketing pipeline.
 * Path: /api/v1/ads/leads
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/ads")
@RequiredArgsConstructor
public class LeadController {

    private final LeadService leadService;

    @GetMapping("/leads")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'HEALTH_PATIENTS_VIEW')")
    public ResponseEntity<ApiResponse<List<LeadDto>>> getAllLeads() {
        List<LeadDto> leads = leadService.getAllLeads();
        return ResponseEntity.ok(ApiResponse.success(leads));
    }

    @GetMapping("/leads/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'HEALTH_PATIENTS_VIEW')")
    public ResponseEntity<ApiResponse<LeadDto>> getLeadById(@PathVariable UUID id) {
        LeadDto lead = leadService.getLeadById(id);
        return ResponseEntity.ok(ApiResponse.success(lead));
    }

    @PostMapping("/leads")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'HEALTH_PATIENTS_EDIT')")
    public ResponseEntity<ApiResponse<LeadDto>> createLead(@Valid @RequestBody LeadCreateRequest request) {
        LeadDto lead = leadService.createLead(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(lead, "Lead created successfully"));
    }

    @PutMapping("/leads/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'HEALTH_PATIENTS_EDIT')")
    public ResponseEntity<ApiResponse<LeadDto>> updateLead(
            @PathVariable UUID id,
            @Valid @RequestBody LeadUpdateRequest request) {
        LeadDto lead = leadService.updateLead(id, request);
        return ResponseEntity.ok(ApiResponse.success(lead, "Lead updated successfully"));
    }

    @DeleteMapping("/leads/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'HEALTH_PATIENTS_EDIT')")
    public ResponseEntity<ApiResponse<Void>> deleteLead(@PathVariable UUID id) {
        leadService.deleteLead(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Lead deleted successfully"));
    }
}
