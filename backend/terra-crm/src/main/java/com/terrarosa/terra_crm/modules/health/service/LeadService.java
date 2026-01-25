package com.terrarosa.terra_crm.modules.health.service;

import com.terrarosa.terra_crm.modules.health.dto.LeadCreateRequest;
import com.terrarosa.terra_crm.modules.health.dto.LeadDto;
import com.terrarosa.terra_crm.modules.health.dto.LeadUpdateRequest;
import com.terrarosa.terra_crm.modules.health.entity.Lead;
import com.terrarosa.terra_crm.modules.health.entity.Service;
import com.terrarosa.terra_crm.modules.health.repository.LeadRepository;
import com.terrarosa.terra_crm.modules.health.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
 import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class LeadService {
    
    private final LeadRepository leadRepository;
    private final ServiceRepository serviceRepository;
    
    /**
     * Get all leads for the current tenant.
     */
    @Transactional(readOnly = true)
    public List<LeadDto> getAllLeads() {
        return leadRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get a lead by ID.
     */
    @Transactional(readOnly = true)
    public LeadDto getLeadById(UUID id) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with id: " + id));
        return toDto(lead);
    }
    
    /**
     * Create a new lead.
     */
    @Transactional
    public LeadDto createLead(LeadCreateRequest request) {
        Lead lead = Lead.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .country(request.getCountry())
                .source(request.getSource())
                .dynamicData(request.getDynamicData())
                .assignedTo(request.getAssignedTo())
                .status(request.getStatus())
                .build();
        
        // Set service if provided
        if (request.getServiceId() != null) {
            Service service = serviceRepository.findById(request.getServiceId())
                    .orElseThrow(() -> new RuntimeException("Service not found with id: " + request.getServiceId()));
            lead.setService(service);
        }
        
        Lead saved = leadRepository.save(lead);
        return toDto(saved);
    }
    
    /**
     * Update an existing lead.
     */
    @Transactional
    public LeadDto updateLead(UUID id, LeadUpdateRequest request) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with id: " + id));
        
        // Update fields if provided
        if (request.getName() != null) {
            lead.setName(request.getName());
        }
        if (request.getPhone() != null) {
            lead.setPhone(request.getPhone());
        }
        if (request.getEmail() != null) {
            lead.setEmail(request.getEmail());
        }
        if (request.getCountry() != null) {
            lead.setCountry(request.getCountry());
        }
        if (request.getSource() != null) {
            lead.setSource(request.getSource());
        }
        if (request.getDynamicData() != null) {
            lead.setDynamicData(request.getDynamicData());
        }
        if (request.getAssignedTo() != null) {
            lead.setAssignedTo(request.getAssignedTo());
        }
        if (request.getStatus() != null) {
            lead.setStatus(request.getStatus());
        }
        
        // Update service if provided
        if (request.getServiceId() != null) {
            Service service = serviceRepository.findById(request.getServiceId())
                    .orElseThrow(() -> new RuntimeException("Service not found with id: " + request.getServiceId()));
            lead.setService(service);
        }
        
        Lead updated = leadRepository.save(lead);
        return toDto(updated);
    }
    
    /**
     * Delete a lead (soft delete).
     */
    @Transactional
    public void deleteLead(UUID id) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with id: " + id));
        leadRepository.softDelete(lead);
    }
    
    /**
     * Convert Lead entity to DTO.
     */
    private LeadDto toDto(Lead lead) {
        return LeadDto.builder()
                .id(lead.getId())
                .name(lead.getName())
                .phone(lead.getPhone())
                .email(lead.getEmail())
                .country(lead.getCountry())
                .source(lead.getSource())
                .dynamicData(lead.getDynamicData())
                .serviceId(lead.getService() != null ? lead.getService().getId() : null)
                .serviceName(lead.getService() != null ? lead.getService().getName() : null)
                .assignedTo(lead.getAssignedTo())
                .status(lead.getStatus())
                .createdAt(lead.getCreatedAt())
                .updatedAt(lead.getUpdatedAt())
                .build();
    }
}
