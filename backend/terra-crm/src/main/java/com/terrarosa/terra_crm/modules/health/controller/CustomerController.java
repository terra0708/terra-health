package com.terrarosa.terra_crm.modules.health.controller;

import com.terrarosa.terra_crm.core.common.dto.ApiResponse;
import com.terrarosa.terra_crm.modules.health.dto.CustomerCreateRequest;
import com.terrarosa.terra_crm.modules.health.dto.CustomerDto;
import com.terrarosa.terra_crm.modules.health.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/health/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'HEALTH_CUSTOMERS_VIEW') or @permissionEvaluator.hasPermission(authentication, 'CUSTOMERS_VIEW')")
    public ResponseEntity<ApiResponse<List<CustomerDto>>> getAllCustomers() {
        log.info("Fetching all health customers");
        List<CustomerDto> customers = customerService.getAllCustomers();
        return ResponseEntity.ok(ApiResponse.success(customers));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'HEALTH_CUSTOMERS_VIEW') or @permissionEvaluator.hasPermission(authentication, 'CUSTOMERS_VIEW')")
    public ResponseEntity<ApiResponse<CustomerDto>> getCustomerById(@PathVariable UUID id) {
        log.info("Fetching health customer by id: {}", id);
        CustomerDto customer = customerService.getCustomerById(id);
        return ResponseEntity.ok(ApiResponse.success(customer));
    }

    @PostMapping
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'HEALTH_CUSTOMERS_EDIT') or @permissionEvaluator.hasPermission(authentication, 'CUSTOMERS_CREATE')")
    public ResponseEntity<ApiResponse<CustomerDto>> createCustomer(@Valid @RequestBody CustomerCreateRequest request) {
        log.info("Creating new health customer: {}", request.getName());
        CustomerDto customer = customerService.createCustomer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(customer, "Customer created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'HEALTH_CUSTOMERS_EDIT') or @permissionEvaluator.hasPermission(authentication, 'CUSTOMERS_UPDATE')")
    public ResponseEntity<ApiResponse<CustomerDto>> updateCustomer(
            @PathVariable UUID id,
            @Valid @RequestBody CustomerCreateRequest request) {
        log.info("Updating health customer id: {}", id);
        CustomerDto customer = customerService.updateCustomer(id, request);
        return ResponseEntity.ok(ApiResponse.success(customer, "Customer updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'HEALTH_CUSTOMERS_EDIT') or @permissionEvaluator.hasPermission(authentication, 'CUSTOMERS_DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteCustomer(@PathVariable UUID id) {
        log.info("Deleting health customer id: {}", id);
        customerService.deleteCustomer(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Customer deleted successfully"));
    }
}
