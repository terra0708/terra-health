package com.terrarosa.terra_crm.modules.health.service;

import com.terrarosa.terra_crm.core.exception.ResourceNotFoundException;
import com.terrarosa.terra_crm.modules.health.dto.ReminderDto;
import com.terrarosa.terra_crm.modules.health.dto.ReminderRequest;
import com.terrarosa.terra_crm.modules.health.entity.*;
import com.terrarosa.terra_crm.modules.health.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final ReminderCategoryRepository categoryRepository;
    private final ReminderSubcategoryRepository subcategoryRepository;
    private final ReminderStatusRepository statusRepository;
    private final CustomerRepository customerRepository;

    @Transactional(readOnly = true)
    public List<ReminderDto> getAllReminders() {
        return reminderRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReminderDto getReminderById(UUID id) {
        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reminder not found"));
        return convertToDto(reminder);
    }

    @Transactional(readOnly = true)
    public List<ReminderDto> getRemindersByCustomerId(UUID customerId) {
        return reminderRepository.findByRelationTypeAndRelationId("customer", customerId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReminderDto> getRemindersByDateRange(LocalDate startDate, LocalDate endDate) {
        return reminderRepository.findByReminderDateBetween(startDate, endDate).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReminderDto createReminder(ReminderRequest request) {
        validateReminderRequest(request);

        // Get status to determine initial completion state
        ReminderStatus status = statusRepository.findById(request.getStatusId())
                .orElseThrow(() -> new ResourceNotFoundException("Status not found"));

        Reminder reminder = Reminder.builder()
                .title(request.getTitle())
                .note(request.getNote())
                .reminderDate(request.getReminderDate())
                .reminderTime(request.getReminderTime())
                .categoryId(request.getCategoryId())
                .subcategoryId(request.getSubcategoryId())
                .statusId(request.getStatusId())
                .relationType(request.getRelationType())
                .relationId(request.getRelationId())
                .isCompleted(status.getIsCompleted() != null ? status.getIsCompleted() : false)
                .build();

        Reminder saved = reminderRepository.save(reminder);
        log.info("Created reminder: {} for relation: {}/{}", saved.getId(), saved.getRelationType(),
                saved.getRelationId());
        return convertToDto(saved);
    }

    @Transactional
    public ReminderDto updateReminder(UUID id, ReminderRequest request) {
        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reminder not found"));

        validateReminderRequest(request);

        // Get status to update completion state
        ReminderStatus status = statusRepository.findById(request.getStatusId())
                .orElseThrow(() -> new ResourceNotFoundException("Status not found"));

        reminder.setTitle(request.getTitle());
        reminder.setNote(request.getNote());
        reminder.setReminderDate(request.getReminderDate());
        reminder.setReminderTime(request.getReminderTime());
        reminder.setCategoryId(request.getCategoryId());
        reminder.setSubcategoryId(request.getSubcategoryId());
        reminder.setStatusId(request.getStatusId());
        reminder.setRelationType(request.getRelationType());
        reminder.setRelationId(request.getRelationId());
        reminder.setIsCompleted(status.getIsCompleted() != null ? status.getIsCompleted() : false);

        // Update completion timestamp
        if (Boolean.TRUE.equals(reminder.getIsCompleted()) && reminder.getCompletedAt() == null) {
            reminder.setCompletedAt(LocalDateTime.now());
        } else if (Boolean.FALSE.equals(reminder.getIsCompleted())) {
            reminder.setCompletedAt(null);
        }

        Reminder updated = reminderRepository.save(reminder);
        log.info("Updated reminder: {}", updated.getId());
        return convertToDto(updated);
    }

    @Transactional
    public void deleteReminder(UUID id) {
        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reminder not found"));

        reminder.setDeleted(true);
        reminderRepository.save(reminder);
        log.info("Deleted reminder: {}", id);
    }

    @Transactional
    public ReminderDto toggleComplete(UUID id) {
        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reminder not found"));

        boolean newCompletedState = !Boolean.TRUE.equals(reminder.getIsCompleted());
        reminder.setIsCompleted(newCompletedState);

        // Update completion timestamp
        if (newCompletedState) {
            reminder.setCompletedAt(LocalDateTime.now());

            // Try to find "completed" status
            ReminderStatus completedStatus = statusRepository.findByValue("completed")
                    .orElseGet(() -> statusRepository.findById(reminder.getStatusId()).orElse(null));
            if (completedStatus != null) {
                reminder.setStatusId(completedStatus.getId());
            }
        } else {
            reminder.setCompletedAt(null);

            // Try to find "pending" status
            ReminderStatus pendingStatus = statusRepository.findByValue("pending")
                    .orElseGet(() -> statusRepository.findById(reminder.getStatusId()).orElse(null));
            if (pendingStatus != null) {
                reminder.setStatusId(pendingStatus.getId());
            }
        }

        Reminder updated = reminderRepository.save(reminder);
        log.info("Toggled reminder completion: {} -> {}", id, newCompletedState);
        return convertToDto(updated);
    }

    // ==================== HELPER METHODS ====================

    private ReminderDto convertToDto(Reminder reminder) {
        ReminderCategory category = categoryRepository.findById(reminder.getCategoryId()).orElse(null);
        ReminderSubcategory subcategory = reminder.getSubcategoryId() != null
                ? subcategoryRepository.findById(reminder.getSubcategoryId()).orElse(null)
                : null;
        ReminderStatus status = statusRepository.findById(reminder.getStatusId()).orElse(null);

        String relationName = null;
        if ("customer".equals(reminder.getRelationType()) && reminder.getRelationId() != null) {
            relationName = customerRepository.findById(reminder.getRelationId())
                    .map(Customer::getName)
                    .orElse(null);
        }

        return ReminderDto.builder()
                .id(reminder.getId())
                .title(reminder.getTitle())
                .note(reminder.getNote())
                .reminderDate(reminder.getReminderDate())
                .reminderTime(reminder.getReminderTime())
                .categoryId(reminder.getCategoryId())
                .categoryLabelTr(category != null ? category.getLabelTr() : null)
                .categoryLabelEn(category != null ? category.getLabelEn() : null)
                .categoryColor(category != null ? category.getColor() : null)
                .subcategoryId(reminder.getSubcategoryId())
                .subcategoryLabelTr(subcategory != null ? subcategory.getLabelTr() : null)
                .subcategoryLabelEn(subcategory != null ? subcategory.getLabelEn() : null)
                .statusId(reminder.getStatusId())
                .statusLabelTr(status != null ? status.getLabelTr() : null)
                .statusLabelEn(status != null ? status.getLabelEn() : null)
                .statusColor(status != null ? status.getColor() : null)
                .statusIsCompleted(status != null ? status.getIsCompleted() : false)
                .relationType(reminder.getRelationType())
                .relationId(reminder.getRelationId())
                .relationName(relationName)
                .isCompleted(reminder.getIsCompleted())
                .completedAt(reminder.getCompletedAt())
                .createdAt(reminder.getCreatedAt())
                .updatedAt(reminder.getUpdatedAt())
                .createdBy(reminder.getCreatedBy())
                .updatedBy(reminder.getUpdatedBy())
                .build();
    }

    private void validateReminderRequest(ReminderRequest request) {
        // Validate category exists
        categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        // Validate subcategory exists if provided
        if (request.getSubcategoryId() != null) {
            subcategoryRepository.findById(request.getSubcategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Subcategory not found"));
        }

        // Validate status exists
        statusRepository.findById(request.getStatusId())
                .orElseThrow(() -> new ResourceNotFoundException("Status not found"));

        // Validate customer exists if relationType is customer
        if ("customer".equals(request.getRelationType()) && request.getRelationId() != null) {
            customerRepository.findById(request.getRelationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        }
    }
}
