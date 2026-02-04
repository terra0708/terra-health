package com.terrarosa.terra_crm.modules.health.controller;

import com.terrarosa.terra_crm.core.common.dto.ApiResponse;
import com.terrarosa.terra_crm.modules.health.dto.ReminderDto;
import com.terrarosa.terra_crm.modules.health.dto.ReminderRequest;
import com.terrarosa.terra_crm.modules.health.service.ReminderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/health/reminders")
@RequiredArgsConstructor
public class ReminderController {

    private final ReminderService reminderService;

    @GetMapping
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'REMINDERS_VIEW') or @permissionEvaluator.hasPermission(authentication, 'HEALTH_CUSTOMERS_VIEW')")
    public ResponseEntity<ApiResponse<List<ReminderDto>>> getAllReminders() {
        return ResponseEntity.ok(ApiResponse.success(reminderService.getAllReminders()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'REMINDERS_VIEW')")
    public ResponseEntity<ApiResponse<ReminderDto>> getReminderById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(reminderService.getReminderById(id)));
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'REMINDERS_VIEW') or @permissionEvaluator.hasPermission(authentication, 'HEALTH_CUSTOMERS_VIEW')")
    public ResponseEntity<ApiResponse<List<ReminderDto>>> getRemindersByCustomerId(@PathVariable UUID customerId) {
        return ResponseEntity.ok(ApiResponse.success(reminderService.getRemindersByCustomerId(customerId)));
    }

    @GetMapping("/date-range")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'REMINDERS_VIEW')")
    public ResponseEntity<ApiResponse<List<ReminderDto>>> getRemindersByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(ApiResponse.success(reminderService.getRemindersByDateRange(startDate, endDate)));
    }

    @PostMapping
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'REMINDERS_CREATE') or @permissionEvaluator.hasPermission(authentication, 'HEALTH_CUSTOMERS_EDIT')")
    public ResponseEntity<ApiResponse<ReminderDto>> createReminder(@Valid @RequestBody ReminderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(reminderService.createReminder(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'REMINDERS_UPDATE') or @permissionEvaluator.hasPermission(authentication, 'HEALTH_CUSTOMERS_EDIT')")
    public ResponseEntity<ApiResponse<ReminderDto>> updateReminder(
            @PathVariable UUID id,
            @Valid @RequestBody ReminderRequest request) {
        return ResponseEntity.ok(ApiResponse.success(reminderService.updateReminder(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'REMINDERS_DELETE') or @permissionEvaluator.hasPermission(authentication, 'HEALTH_CUSTOMERS_EDIT')")
    public ResponseEntity<ApiResponse<Void>> deleteReminder(@PathVariable UUID id) {
        reminderService.deleteReminder(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{id}/toggle-complete")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'REMINDERS_UPDATE') or @permissionEvaluator.hasPermission(authentication, 'HEALTH_CUSTOMERS_EDIT')")
    public ResponseEntity<ApiResponse<ReminderDto>> toggleComplete(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(reminderService.toggleComplete(id)));
    }
}
