package com.terrarosa.terra_crm.modules.health.controller;

import com.terrarosa.terra_crm.core.common.dto.ApiResponse;
import com.terrarosa.terra_crm.modules.health.dto.*;
import com.terrarosa.terra_crm.modules.health.service.CustomerParametersService;
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
@RequestMapping("/api/v1/health/parameters")
@RequiredArgsConstructor
public class CustomerParametersController {

    private final CustomerParametersService parametersService;

    // ==================== CATEGORIES ====================

    @GetMapping("/categories")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_VIEW') or @permissionEvaluator.hasPermission(authentication, 'CUSTOMERS_VIEW')")
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getAllCategories() {
        log.info("Fetching all customer categories");
        List<CategoryDto> categories = parametersService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @GetMapping("/categories/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_VIEW') or @permissionEvaluator.hasPermission(authentication, 'CUSTOMERS_VIEW')")
    public ResponseEntity<ApiResponse<CategoryDto>> getCategoryById(@PathVariable UUID id) {
        log.info("Fetching category by id: {}", id);
        CategoryDto category = parametersService.getCategoryById(id);
        return ResponseEntity.ok(ApiResponse.success(category));
    }

    @PostMapping("/categories")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_CREATE')")
    public ResponseEntity<ApiResponse<CategoryDto>> createCategory(@Valid @RequestBody ParameterRequest request) {
        log.info("Creating new category: {}", request.getLabelEn());
        CategoryDto category = parametersService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(category, "Category created successfully"));
    }

    @PutMapping("/categories/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_UPDATE')")
    public ResponseEntity<ApiResponse<CategoryDto>> updateCategory(
            @PathVariable UUID id,
            @Valid @RequestBody ParameterRequest request) {
        log.info("Updating category id: {}", id);
        CategoryDto category = parametersService.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.success(category, "Category updated successfully"));
    }

    @DeleteMapping("/categories/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable UUID id) {
        log.info("Deleting category id: {}", id);
        parametersService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Category deleted successfully"));
    }

    // ==================== SERVICES ====================

    @GetMapping("/services")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_VIEW') or @permissionEvaluator.hasPermission(authentication, 'CUSTOMERS_VIEW')")
    public ResponseEntity<ApiResponse<List<ServiceDto>>> getAllServices() {
        log.info("Fetching all customer services");
        List<ServiceDto> services = parametersService.getAllServices();
        return ResponseEntity.ok(ApiResponse.success(services));
    }

    @GetMapping("/services/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_VIEW') or @permissionEvaluator.hasPermission(authentication, 'CUSTOMERS_VIEW')")
    public ResponseEntity<ApiResponse<ServiceDto>> getServiceById(@PathVariable UUID id) {
        log.info("Fetching service by id: {}", id);
        ServiceDto service = parametersService.getServiceById(id);
        return ResponseEntity.ok(ApiResponse.success(service));
    }

    @PostMapping("/services")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_CREATE')")
    public ResponseEntity<ApiResponse<ServiceDto>> createService(@Valid @RequestBody ServiceRequest request) {
        log.info("Creating new service: {}", request.getNameEn());
        ServiceDto service = parametersService.createService(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service, "Service created successfully"));
    }

    @PutMapping("/services/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_UPDATE')")
    public ResponseEntity<ApiResponse<ServiceDto>> updateService(
            @PathVariable UUID id,
            @Valid @RequestBody ServiceRequest request) {
        log.info("Updating service id: {}", id);
        ServiceDto service = parametersService.updateService(id, request);
        return ResponseEntity.ok(ApiResponse.success(service, "Service updated successfully"));
    }

    @DeleteMapping("/services/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteService(@PathVariable UUID id) {
        log.info("Deleting service id: {}", id);
        parametersService.deleteService(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Service deleted successfully"));
    }

    // ==================== STATUSES ====================

    @GetMapping("/statuses")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_VIEW') or @permissionEvaluator.hasPermission(authentication, 'CUSTOMERS_VIEW')")
    public ResponseEntity<ApiResponse<List<StatusDto>>> getAllStatuses() {
        log.info("Fetching all customer statuses");
        List<StatusDto> statuses = parametersService.getAllStatuses();
        return ResponseEntity.ok(ApiResponse.success(statuses));
    }

    @GetMapping("/statuses/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_VIEW') or @permissionEvaluator.hasPermission(authentication, 'CUSTOMERS_VIEW')")
    public ResponseEntity<ApiResponse<StatusDto>> getStatusById(@PathVariable UUID id) {
        log.info("Fetching status by id: {}", id);
        StatusDto status = parametersService.getStatusById(id);
        return ResponseEntity.ok(ApiResponse.success(status));
    }

    @PostMapping("/statuses")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_CREATE')")
    public ResponseEntity<ApiResponse<StatusDto>> createStatus(@Valid @RequestBody ParameterRequest request) {
        log.info("Creating new status: {}", request.getLabelEn());
        StatusDto status = parametersService.createStatus(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(status, "Status created successfully"));
    }

    @PutMapping("/statuses/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_UPDATE')")
    public ResponseEntity<ApiResponse<StatusDto>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ParameterRequest request) {
        log.info("Updating status id: {}", id);
        StatusDto status = parametersService.updateStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(status, "Status updated successfully"));
    }

    @DeleteMapping("/statuses/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteStatus(@PathVariable UUID id) {
        log.info("Deleting status id: {}", id);
        parametersService.deleteStatus(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Status deleted successfully"));
    }

    // ==================== SOURCES ====================

    @GetMapping("/sources")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_VIEW') or @permissionEvaluator.hasPermission(authentication, 'CUSTOMERS_VIEW')")
    public ResponseEntity<ApiResponse<List<SourceDto>>> getAllSources() {
        log.info("Fetching all customer sources");
        List<SourceDto> sources = parametersService.getAllSources();
        return ResponseEntity.ok(ApiResponse.success(sources));
    }

    @GetMapping("/sources/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_VIEW') or @permissionEvaluator.hasPermission(authentication, 'CUSTOMERS_VIEW')")
    public ResponseEntity<ApiResponse<SourceDto>> getSourceById(@PathVariable UUID id) {
        log.info("Fetching source by id: {}", id);
        SourceDto source = parametersService.getSourceById(id);
        return ResponseEntity.ok(ApiResponse.success(source));
    }

    @PostMapping("/sources")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_CREATE')")
    public ResponseEntity<ApiResponse<SourceDto>> createSource(@Valid @RequestBody ParameterRequest request) {
        log.info("Creating new source: {}", request.getLabelEn());
        SourceDto source = parametersService.createSource(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(source, "Source created successfully"));
    }

    @PutMapping("/sources/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_UPDATE')")
    public ResponseEntity<ApiResponse<SourceDto>> updateSource(
            @PathVariable UUID id,
            @Valid @RequestBody ParameterRequest request) {
        log.info("Updating source id: {}", id);
        SourceDto source = parametersService.updateSource(id, request);
        return ResponseEntity.ok(ApiResponse.success(source, "Source updated successfully"));
    }

    @DeleteMapping("/sources/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteSource(@PathVariable UUID id) {
        log.info("Deleting source id: {}", id);
        parametersService.deleteSource(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Source deleted successfully"));
    }

    // ==================== TAGS ====================

    @GetMapping("/tags")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_VIEW') or @permissionEvaluator.hasPermission(authentication, 'CUSTOMERS_VIEW')")
    public ResponseEntity<ApiResponse<List<TagDto>>> getAllTags() {
        log.info("Fetching all customer tags");
        List<TagDto> tags = parametersService.getAllTags();
        return ResponseEntity.ok(ApiResponse.success(tags));
    }

    @GetMapping("/tags/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_VIEW') or @permissionEvaluator.hasPermission(authentication, 'CUSTOMERS_VIEW')")
    public ResponseEntity<ApiResponse<TagDto>> getTagById(@PathVariable UUID id) {
        log.info("Fetching tag by id: {}", id);
        TagDto tag = parametersService.getTagById(id);
        return ResponseEntity.ok(ApiResponse.success(tag));
    }

    @PostMapping("/tags")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_CREATE')")
    public ResponseEntity<ApiResponse<TagDto>> createTag(@Valid @RequestBody ParameterRequest request) {
        log.info("Creating new tag: {}", request.getLabelEn());
        TagDto tag = parametersService.createTag(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(tag, "Tag created successfully"));
    }

    @PutMapping("/tags/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_UPDATE')")
    public ResponseEntity<ApiResponse<TagDto>> updateTag(
            @PathVariable UUID id,
            @Valid @RequestBody ParameterRequest request) {
        log.info("Updating tag id: {}", id);
        TagDto tag = parametersService.updateTag(id, request);
        return ResponseEntity.ok(ApiResponse.success(tag, "Tag updated successfully"));
    }

    @DeleteMapping("/tags/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteTag(@PathVariable UUID id) {
        log.info("Deleting tag id: {}", id);
        parametersService.deleteTag(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Tag deleted successfully"));
    }

    // ==================== FILE CATEGORIES ====================

    @GetMapping("/file-categories")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_VIEW') or @permissionEvaluator.hasPermission(authentication, 'CUSTOMERS_VIEW')")
    public ResponseEntity<ApiResponse<List<FileCategoryDto>>> getAllFileCategories() {
        log.info("Fetching all file categories");
        List<FileCategoryDto> fileCategories = parametersService.getAllFileCategories();
        return ResponseEntity.ok(ApiResponse.success(fileCategories));
    }

    @GetMapping("/file-categories/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_VIEW') or @permissionEvaluator.hasPermission(authentication, 'CUSTOMERS_VIEW')")
    public ResponseEntity<ApiResponse<FileCategoryDto>> getFileCategoryById(@PathVariable UUID id) {
        log.info("Fetching file category by id: {}", id);
        FileCategoryDto fileCategory = parametersService.getFileCategoryById(id);
        return ResponseEntity.ok(ApiResponse.success(fileCategory));
    }

    @PostMapping("/file-categories")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_CREATE')")
    public ResponseEntity<ApiResponse<FileCategoryDto>> createFileCategory(
            @Valid @RequestBody ParameterRequest request) {
        log.info("Creating new file category: {}", request.getLabelEn());
        FileCategoryDto fileCategory = parametersService.createFileCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(fileCategory, "File category created successfully"));
    }

    @PutMapping("/file-categories/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_UPDATE')")
    public ResponseEntity<ApiResponse<FileCategoryDto>> updateFileCategory(
            @PathVariable UUID id,
            @Valid @RequestBody ParameterRequest request) {
        log.info("Updating file category id: {}", id);
        FileCategoryDto fileCategory = parametersService.updateFileCategory(id, request);
        return ResponseEntity.ok(ApiResponse.success(fileCategory, "File category updated successfully"));
    }

    @DeleteMapping("/file-categories/{id}")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'SETTINGS_CUSTOMERS_P') or @permissionEvaluator.hasPermission(authentication, 'SETTINGS_DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteFileCategory(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID targetCategoryId) {
        log.info("Deleting file category id: {}, target category: {}", id, targetCategoryId);
        parametersService.deleteFileCategory(id, targetCategoryId);
        return ResponseEntity.ok(ApiResponse.success(null, "File category deleted successfully"));
    }
}
