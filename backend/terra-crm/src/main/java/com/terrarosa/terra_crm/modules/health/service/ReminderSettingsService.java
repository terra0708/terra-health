package com.terrarosa.terra_crm.modules.health.service;

import com.terrarosa.terra_crm.core.exception.ResourceNotFoundException;
import com.terrarosa.terra_crm.modules.health.dto.*;
import com.terrarosa.terra_crm.modules.health.entity.*;
import com.terrarosa.terra_crm.modules.health.repository.*;
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
public class ReminderSettingsService {

    private final ReminderCategoryRepository categoryRepository;
    private final ReminderSubcategoryRepository subcategoryRepository;
    private final ReminderStatusRepository statusRepository;

    /**
     * Ensures system default parameters exist for the current tenant.
     * Called during tenant provisioning and lazy seeding.
     */
    @Transactional
    public void ensureSystemDefaults() {
        log.info("Ensuring reminder system defaults exist...");

        // Customer Category
        ReminderCategory customerCategory = categoryRepository
                .findByLabelEn("Customer")
                .orElseGet(() -> categoryRepository.save(ReminderCategory.builder()
                        .labelTr("Müşteri")
                        .labelEn("Customer")
                        .icon("Users")
                        .color("#3b82f6")
                        .isDefault(true)
                        .isSystem(true)
                        .build()));

        // Cleanup: Remove "Personal" category and its subcategories if they exist
        categoryRepository.findByLabelEn("Personal").ifPresent(personal -> {
            log.info("Removing legacy 'Personal' category and subcategories...");
            List<ReminderSubcategory> personalSubs = subcategoryRepository.findByCategoryId(personal.getId());
            subcategoryRepository.deleteAll(personalSubs);
            categoryRepository.delete(personal);
        });

        // Customer Subcategories
        createSubcategoryIfMissing(customerCategory.getId(), "Yeni Müşteri", "New Customer", "new_customer", "#3b82f6");

        // Status Category
        categoryRepository.findByLabelEn("Status")
                .orElseGet(() -> categoryRepository.save(ReminderCategory.builder()
                        .labelTr("Durum")
                        .labelEn("Status")
                        .icon("Activity")
                        .color("#f59e0b")
                        .isDefault(true)
                        .isSystem(true)
                        .build()));

        // Statuses
        createStatusIfMissing("Bekliyor", "Pending", "pending", "#f59e0b", false);
        createStatusIfMissing("Hazır", "Ready", "ready", "#3b82f6", false);
        createStatusIfMissing("Tamamlandı", "Completed", "completed", "#10b981", true);
        createStatusIfMissing("Ertelendi", "Postponed", "postponed", "#8b5cf6", false);
        createStatusIfMissing("İptal", "Cancelled", "cancelled", "#ef4444", true);

        log.info("Reminder system defaults ensured successfully");
    }

    private void createSubcategoryIfMissing(UUID categoryId, String tr, String en, String value, String color) {
        if (subcategoryRepository.findByValueAndCategoryId(value, categoryId).isEmpty()) {
            subcategoryRepository.save(ReminderSubcategory.builder()
                    .categoryId(categoryId)
                    .labelTr(tr)
                    .labelEn(en)
                    .value(value)
                    .color(color)
                    .isDefault(true)
                    .isSystem(true)
                    .build());
        }
    }

    private void createStatusIfMissing(String tr, String en, String value, String color, boolean completed) {
        if (statusRepository.findByValue(value).isEmpty()) {
            statusRepository.save(ReminderStatus.builder()
                    .labelTr(tr)
                    .labelEn(en)
                    .value(value)
                    .color(color)
                    .isCompleted(completed)
                    .isDefault(true)
                    .isSystem(true)
                    .build());
        }
    }

    // ==================== CATEGORIES ====================

    @Transactional
    public List<ReminderCategoryDto> getAllCategories() {
        // Always ensure defaults are present (idempotent check)
        ensureSystemDefaults();

        return categoryRepository.findAll().stream()
                .map(this::convertCategoryToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReminderCategoryDto getCategoryById(UUID id) {
        ReminderCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reminder category not found"));
        return convertCategoryToDto(category);
    }

    @Transactional
    public ReminderCategoryDto createCategory(ReminderCategoryRequest request) {
        ReminderCategory category = ReminderCategory.builder()
                .labelTr(request.getLabelTr())
                .labelEn(request.getLabelEn())
                .icon(request.getIcon())
                .color(request.getColor() != null ? request.getColor() : "#6366f1")
                .isDefault(false)
                .isSystem(false)
                .build();

        ReminderCategory saved = categoryRepository.save(category);
        return convertCategoryToDto(saved);
    }

    @Transactional
    public ReminderCategoryDto updateCategory(UUID id, ReminderCategoryRequest request) {
        ReminderCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reminder category not found"));

        // Protect system/default categories from full updates
        if (Boolean.TRUE.equals(category.getIsSystem()) || Boolean.TRUE.equals(category.getIsDefault())) {
            // Only allow label and color updates for protected categories
            category.setLabelTr(request.getLabelTr());
            category.setLabelEn(request.getLabelEn());
            if (request.getColor() != null) {
                category.setColor(request.getColor());
            }
            if (request.getIcon() != null) {
                category.setIcon(request.getIcon());
            }
        } else {
            category.setLabelTr(request.getLabelTr());
            category.setLabelEn(request.getLabelEn());
            category.setIcon(request.getIcon());
            category.setColor(request.getColor());
        }

        ReminderCategory updated = categoryRepository.save(category);
        return convertCategoryToDto(updated);
    }

    @Transactional
    public void deleteCategory(UUID id) {
        ReminderCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reminder category not found"));

        // Protect system/default categories from deletion
        if (Boolean.TRUE.equals(category.getIsSystem()) || Boolean.TRUE.equals(category.getIsDefault())) {
            throw new IllegalStateException("Cannot delete system or default category");
        }

        category.setDeleted(true);
        categoryRepository.save(category);
    }

    // ==================== SUBCATEGORIES ====================

    @Transactional
    public List<ReminderSubcategoryDto> getAllSubcategories() {
        ensureSystemDefaults();
        return subcategoryRepository.findAll().stream()
                .map(this::convertSubcategoryToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReminderSubcategoryDto> getSubcategoriesByCategoryId(UUID categoryId) {
        return subcategoryRepository.findByCategoryId(categoryId).stream()
                .map(this::convertSubcategoryToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReminderSubcategoryDto createSubcategory(ReminderSubcategoryRequest request) {
        // Validate category exists
        categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        String value = request.getValue() != null ? request.getValue() : generateSlug(request.getLabelTr());

        ReminderSubcategory subcategory = ReminderSubcategory.builder()
                .categoryId(request.getCategoryId())
                .labelTr(request.getLabelTr())
                .labelEn(request.getLabelEn())
                .value(value)
                .color(request.getColor())
                .isDefault(false)
                .isSystem(false)
                .build();

        ReminderSubcategory saved = subcategoryRepository.save(subcategory);
        return convertSubcategoryToDto(saved);
    }

    @Transactional
    public ReminderSubcategoryDto updateSubcategory(UUID id, ReminderSubcategoryRequest request) {
        ReminderSubcategory subcategory = subcategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reminder subcategory not found"));

        // Protect system/default subcategories from full updates
        if (Boolean.TRUE.equals(subcategory.getIsSystem()) || Boolean.TRUE.equals(subcategory.getIsDefault())) {
            // Only allow label and color updates
            subcategory.setLabelTr(request.getLabelTr());
            subcategory.setLabelEn(request.getLabelEn());
            if (request.getColor() != null) {
                subcategory.setColor(request.getColor());
            }
        } else {
            subcategory.setCategoryId(request.getCategoryId());
            subcategory.setLabelTr(request.getLabelTr());
            subcategory.setLabelEn(request.getLabelEn());
            if (request.getValue() != null) {
                subcategory.setValue(request.getValue());
            }
            subcategory.setColor(request.getColor());
        }

        ReminderSubcategory updated = subcategoryRepository.save(subcategory);
        return convertSubcategoryToDto(updated);
    }

    @Transactional
    public void deleteSubcategory(UUID id) {
        ReminderSubcategory subcategory = subcategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reminder subcategory not found"));

        // Protect system/default subcategories from deletion
        if (Boolean.TRUE.equals(subcategory.getIsSystem()) || Boolean.TRUE.equals(subcategory.getIsDefault())) {
            throw new IllegalStateException("Cannot delete system or default subcategory");
        }

        subcategory.setDeleted(true);
        subcategoryRepository.save(subcategory);
    }

    // ==================== STATUSES ====================

    @Transactional
    public List<ReminderStatusDto> getAllStatuses() {
        ensureSystemDefaults();
        return statusRepository.findAll().stream()
                .map(this::convertStatusToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReminderStatusDto createStatus(ReminderStatusRequest request) {
        String value = request.getValue() != null ? request.getValue() : generateSlug(request.getLabelTr());

        ReminderStatus status = ReminderStatus.builder()
                .labelTr(request.getLabelTr())
                .labelEn(request.getLabelEn())
                .value(value)
                .color(request.getColor() != null ? request.getColor() : "#f59e0b")
                .isCompleted(request.getIsCompleted() != null ? request.getIsCompleted() : false)
                .isDefault(false)
                .isSystem(false)
                .build();

        ReminderStatus saved = statusRepository.save(status);
        return convertStatusToDto(saved);
    }

    @Transactional
    public ReminderStatusDto updateStatus(UUID id, ReminderStatusRequest request) {
        ReminderStatus status = statusRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reminder status not found"));

        // Protect system/default statuses from full updates
        if (Boolean.TRUE.equals(status.getIsSystem()) || Boolean.TRUE.equals(status.getIsDefault())) {
            // Only allow label and color updates
            status.setLabelTr(request.getLabelTr());
            status.setLabelEn(request.getLabelEn());
            if (request.getColor() != null) {
                status.setColor(request.getColor());
            }
        } else {
            status.setLabelTr(request.getLabelTr());
            status.setLabelEn(request.getLabelEn());
            if (request.getValue() != null) {
                status.setValue(request.getValue());
            }
            status.setColor(request.getColor());
            if (request.getIsCompleted() != null) {
                status.setIsCompleted(request.getIsCompleted());
            }
        }

        ReminderStatus updated = statusRepository.save(status);
        return convertStatusToDto(updated);
    }

    @Transactional
    public void deleteStatus(UUID id) {
        ReminderStatus status = statusRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reminder status not found"));

        // Protect system/default statuses from deletion
        if (Boolean.TRUE.equals(status.getIsSystem()) || Boolean.TRUE.equals(status.getIsDefault())) {
            throw new IllegalStateException("Cannot delete system or default status");
        }

        status.setDeleted(true);
        statusRepository.save(status);
    }

    // ==================== HELPER METHODS ====================

    private ReminderCategoryDto convertCategoryToDto(ReminderCategory category) {
        return ReminderCategoryDto.builder()
                .id(category.getId())
                .labelTr(category.getLabelTr())
                .labelEn(category.getLabelEn())
                .icon(category.getIcon())
                .color(category.getColor())
                .isDefault(category.getIsDefault())
                .isSystem(category.getIsSystem())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }

    private ReminderSubcategoryDto convertSubcategoryToDto(ReminderSubcategory subcategory) {
        return ReminderSubcategoryDto.builder()
                .id(subcategory.getId())
                .categoryId(subcategory.getCategoryId())
                .labelTr(subcategory.getLabelTr())
                .labelEn(subcategory.getLabelEn())
                .value(subcategory.getValue())
                .color(subcategory.getColor())
                .isDefault(subcategory.getIsDefault())
                .isSystem(subcategory.getIsSystem())
                .createdAt(subcategory.getCreatedAt())
                .updatedAt(subcategory.getUpdatedAt())
                .build();
    }

    private ReminderStatusDto convertStatusToDto(ReminderStatus status) {
        return ReminderStatusDto.builder()
                .id(status.getId())
                .labelTr(status.getLabelTr())
                .labelEn(status.getLabelEn())
                .value(status.getValue())
                .color(status.getColor())
                .isCompleted(status.getIsCompleted())
                .isDefault(status.getIsDefault())
                .isSystem(status.getIsSystem())
                .createdAt(status.getCreatedAt())
                .updatedAt(status.getUpdatedAt())
                .build();
    }

    private String generateSlug(String text) {
        if (text == null)
            return "";
        return text.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "_")
                .replaceAll("-+", "_");
    }
}
