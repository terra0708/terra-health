package com.terrarosa.terra_crm.modules.ads.service;

import com.terrarosa.terra_crm.modules.ads.dto.LeadCreateRequest;
import com.terrarosa.terra_crm.modules.ads.dto.LeadDto;
import com.terrarosa.terra_crm.modules.ads.dto.LeadUpdateRequest;
import com.terrarosa.terra_crm.modules.ads.entity.Lead;
import com.terrarosa.terra_crm.modules.ads.repository.LeadRepository;
import com.terrarosa.terra_crm.modules.health.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeadService {

    private final LeadRepository leadRepository;
    private final ServiceRepository serviceRepository;

    @Transactional(readOnly = true)
    public List<LeadDto> getAllLeads() {
        return leadRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LeadDto getLeadById(UUID id) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with id: " + id));
        return toDto(lead);
    }

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

        if (request.getServiceId() != null) {
            com.terrarosa.terra_crm.modules.health.entity.Service service = serviceRepository.findById(request.getServiceId())
                    .orElseThrow(() -> new RuntimeException("Service not found with id: " + request.getServiceId()));
            lead.setService(service);
        }

        Lead saved = leadRepository.save(lead);
        return toDto(saved);
    }

    @Transactional
    public LeadDto updateLead(UUID id, LeadUpdateRequest request) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with id: " + id));

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
        if (request.getServiceId() != null) {
            com.terrarosa.terra_crm.modules.health.entity.Service service = serviceRepository.findById(request.getServiceId())
                    .orElseThrow(() -> new RuntimeException("Service not found with id: " + request.getServiceId()));
            lead.setService(service);
        }

        Lead updated = leadRepository.save(lead);
        return toDto(updated);
    }

    @Transactional
    public void deleteLead(UUID id) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with id: " + id));
        leadRepository.softDelete(lead);
    }

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
