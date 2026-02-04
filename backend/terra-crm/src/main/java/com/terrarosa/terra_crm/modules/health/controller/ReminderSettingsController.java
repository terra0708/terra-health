package com.terrarosa.terra_crm.modules.health.controller;

import com.terrarosa.terra_crm.core.common.dto.ApiResponse;
import com.terrarosa.terra_crm.modules.health.dto.*;
import com.terrarosa.terra_crm.modules.health.service.ReminderSettingsService;
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
@RequestMapping("/api/v1/health/reminder-settings")
@RequiredArgsConstructor
public class ReminderSettingsController {

    private final ReminderSettingsService settingsService;

    // ==================== CATEGORIES ====================

    @GetMapping("/categories")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_VIEW') or @permissionEvaluator.hasPermission(authentication, 'REMINDERS_VIEW')")
    public ResponseEntity<ApiResponse<List<ReminderCategoryDto>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.success(settingsService.getAllCategories()));
    }

    @PostMapping("/categories")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CREATE')")
    public ResponseEntity<ApiResponse<ReminderCategoryDto>> createCategory(
            @Valid @RequestBody ReminderCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(settingsService.createCategory(request)));
    }

    @PutMapping("/categories/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_UPDATE')")
    public ResponseEntity<ApiResponse<ReminderCategoryDto>> updateCategory(
            @PathVariable UUID id,
            @Valid @RequestBody ReminderCategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(settingsService.updateCategory(id, request)));
    }

    @DeleteMapping("/categories/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable UUID id) {
        settingsService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ==================== SUBCATEGORIES ====================

    @GetMapping("/subcategories")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_VIEW') or @permissionEvaluator.hasPermission(authentication, 'REMINDERS_VIEW')")
    public ResponseEntity<ApiResponse<List<ReminderSubcategoryDto>>> getAllSubcategories() {
        return ResponseEntity.ok(ApiResponse.success(settingsService.getAllSubcategories()));
    }

    @GetMapping("/categories/{categoryId}/subcategories")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_VIEW') or @permissionEvaluator.hasPermission(authentication, 'REMINDERS_VIEW')")
    public ResponseEntity<ApiResponse<List<ReminderSubcategoryDto>>> getSubcategoriesByCategoryId(
            @PathVariable UUID categoryId) {
        return ResponseEntity.ok(ApiResponse.success(settingsService.getSubcategoriesByCategoryId(categoryId)));
    }

    @PostMapping("/subcategories")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CREATE')")
    public ResponseEntity<ApiResponse<ReminderSubcategoryDto>> createSubcategory(
            @Valid @RequestBody ReminderSubcategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(settingsService.createSubcategory(request)));
    }

    @PutMapping("/subcategories/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_UPDATE')")
    public ResponseEntity<ApiResponse<ReminderSubcategoryDto>> updateSubcategory(
            @PathVariable UUID id,
            @Valid @RequestBody ReminderSubcategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(settingsService.updateSubcategory(id, request)));
    }

    @DeleteMapping("/subcategories/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteSubcategory(@PathVariable UUID id) {
        settingsService.deleteSubcategory(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ==================== STATUSES ====================

    @GetMapping("/statuses")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_VIEW') or @permissionEvaluator.hasPermission(authentication, 'REMINDERS_VIEW')")
    public ResponseEntity<ApiResponse<List<ReminderStatusDto>>> getAllStatuses() {
        return ResponseEntity.ok(ApiResponse.success(settingsService.getAllStatuses()));
    }

    @PostMapping("/statuses")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CREATE')")
    public ResponseEntity<ApiResponse<ReminderStatusDto>> createStatus(
            @Valid @RequestBody ReminderStatusRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(settingsService.createStatus(request)));
    }

    @PutMapping("/statuses/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_UPDATE')")
    public ResponseEntity<ApiResponse<ReminderStatusDto>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ReminderStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success(settingsService.updateStatus(id, request)));
    }

    @DeleteMapping("/statuses/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteStatus(@PathVariable UUID id) {
        settingsService.deleteStatus(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
