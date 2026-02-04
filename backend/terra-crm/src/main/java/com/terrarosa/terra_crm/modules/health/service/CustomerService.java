package com.terrarosa.terra_crm.modules.health.service;

import com.terrarosa.terra_crm.modules.health.dto.CustomerCreateRequest;
import com.terrarosa.terra_crm.modules.health.dto.CustomerDto;
import com.terrarosa.terra_crm.modules.health.entity.Customer;
import com.terrarosa.terra_crm.modules.health.repository.CustomerRepository;
import com.terrarosa.terra_crm.modules.ads.repository.LeadRepository;
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
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final LeadRepository leadRepository;

    @Transactional(readOnly = true)
    public List<CustomerDto> getAllCustomers() {
        return customerRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CustomerDto getCustomerById(UUID id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));
        return convertToDto(customer);
    }

    @Transactional
    public CustomerDto createCustomer(CustomerCreateRequest request) {
        Customer customer = Customer.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .country(request.getCountry())
                .city(request.getCity())
                .job(request.getJob())
                .medicalHistory(request.getMedicalHistory())
                .operationType(request.getOperationType())
                .passportNumber(request.getPassportNumber())
                .status(request.getStatus() != null ? request.getStatus() : "new")
                .consultantId(request.getConsultantId())
                .categories(request.getCategories())
                .source(request.getSource())
                .registrationDate(request.getRegistrationDate() != null ? request.getRegistrationDate()
                        : java.time.LocalDateTime.now())
                .services(request.getServices())
                .tags(request.getTags())
                .notes(request.getNotes())
                .files(request.getFiles())
                .payments(request.getPayments())
                .build();

        if (request.getLeadId() != null) {
            leadRepository.findById(request.getLeadId()).ifPresent(customer::setLead);
        }

        Customer savedCustomer = customerRepository.save(customer);
        return convertToDto(savedCustomer);
    }

    @Transactional
    public CustomerDto updateCustomer(UUID id, CustomerCreateRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));

        customer.setName(request.getName());
        customer.setPhone(request.getPhone());
        customer.setEmail(request.getEmail());
        customer.setCountry(request.getCountry());
        customer.setCity(request.getCity());
        customer.setJob(request.getJob());
        customer.setMedicalHistory(request.getMedicalHistory());
        customer.setOperationType(request.getOperationType());
        customer.setPassportNumber(request.getPassportNumber());
        customer.setStatus(request.getStatus());
        customer.setConsultantId(request.getConsultantId());
        customer.setCategories(request.getCategories());
        customer.setSource(request.getSource());
        customer.setRegistrationDate(request.getRegistrationDate());
        customer.setServices(request.getServices());
        customer.setTags(request.getTags());
        customer.setNotes(request.getNotes());
        customer.setFiles(request.getFiles());
        customer.setPayments(request.getPayments());

        if (request.getLeadId() != null) {
            leadRepository.findById(request.getLeadId()).ifPresent(customer::setLead);
        }

        Customer updatedCustomer = customerRepository.save(customer);
        return convertToDto(updatedCustomer);
    }

    @Transactional
    public void deleteCustomer(UUID id) {
        customerRepository.deleteById(id);
    }

    private CustomerDto convertToDto(Customer customer) {
        return CustomerDto.builder()
                .id(customer.getId())
                .leadId(customer.getLead() != null ? customer.getLead().getId() : null)
                .name(customer.getName())
                .phone(customer.getPhone())
                .email(customer.getEmail())
                .country(customer.getCountry())
                .city(customer.getCity())
                .job(customer.getJob())
                .medicalHistory(customer.getMedicalHistory())
                .operationType(customer.getOperationType())
                .passportNumber(customer.getPassportNumber())
                .status(customer.getStatus())
                .consultantId(customer.getConsultantId())
                .categories(customer.getCategories())
                .source(customer.getSource())
                .registrationDate(customer.getRegistrationDate())
                .services(customer.getServices())
                .tags(customer.getTags())
                .notes(customer.getNotes())
                .files(customer.getFiles())
                .payments(customer.getPayments())
                .createdAt(customer.getCreatedAt())
                .updatedAt(customer.getUpdatedAt())
                .registrationDate(customer.getCreatedAt()) // Use createdAt as registrationDate
                .build();
    }
}
