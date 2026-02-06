package com.terrarosa.terra_crm.modules.health.service;

import com.terrarosa.terra_crm.core.tenancy.TenantContext;
import com.terrarosa.terra_crm.modules.auth.entity.User;
import com.terrarosa.terra_crm.modules.auth.service.TenantSecurityService;
import com.terrarosa.terra_crm.modules.auth.repository.UserRepository;
import com.terrarosa.terra_crm.modules.health.dto.*;
import com.terrarosa.terra_crm.modules.health.entity.Customer;
import com.terrarosa.terra_crm.modules.health.entity.CustomerFile;
import com.terrarosa.terra_crm.modules.health.entity.FileCategory;
import com.terrarosa.terra_crm.modules.health.repository.CustomerFileRepository;
import com.terrarosa.terra_crm.modules.health.repository.CustomerRepository;
import com.terrarosa.terra_crm.modules.health.repository.FileCategoryRepository;
import com.terrarosa.terra_crm.modules.health.storage.StorageAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * CustomerFileService
 * 
 * Handles all file operations for customers including upload, download,
 * soft delete (trash), and restoration.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerFileService {

    private final CustomerFileRepository fileRepository;
    private final FileCategoryRepository categoryRepository;
    private final CustomerRepository customerRepository;
    private final StorageAdapter storageAdapter;
    private final TenantSecurityService tenantSecurityService;
    private final UserRepository userRepository;

    /**
     * Upload a file for a customer
     */
    @Transactional
    public CustomerFileDto uploadFile(UUID customerId, UUID categoryId, String displayName, MultipartFile file)
            throws IOException {
        // Validate customer exists
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));

        // Validate category exists
        FileCategory category = categoryRepository.findByIdAndDeletedFalse(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("File category not found"));

        // Get current user
        UUID currentUserId = tenantSecurityService.getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalStateException("Current user not found"));
        UUID tenantId = UUID.fromString(TenantContext.getCurrentTenantId());

        // Generate unique filename
        String uniqueFilename = generateUniqueFilename(file.getOriginalFilename());

        // Store file
        String storagePath = storageAdapter.store(tenantId, customerId, file, uniqueFilename);

        // Create file metadata
        CustomerFile customerFile = CustomerFile.builder()
                .customer(customer)
                .category(category)
                .originalFilename(file.getOriginalFilename())
                .displayName(displayName != null ? displayName : file.getOriginalFilename())
                .storagePath(storagePath)
                .mimeType(file.getContentType())
                .fileSize(file.getSize())
                .uploadedBy(currentUser)
                .isDeleted(false)
                .build();

        customerFile = fileRepository.save(customerFile);
        log.info("Uploaded file {} for customer {}", customerFile.getId(), customerId);

        return toDto(customerFile);
    }

    /**
     * Get all files for a customer
     */
    @Transactional(readOnly = true)
    public List<CustomerFileDto> getCustomerFiles(UUID customerId, boolean includeDeleted) {
        List<CustomerFile> files = includeDeleted
                ? fileRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                : fileRepository.findByCustomerIdAndIsDeletedFalseOrderByCreatedAtDesc(customerId);

        return files.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get file by ID
     */
    @Transactional(readOnly = true)
    public CustomerFile getFileById(UUID fileId, UUID customerId) {
        return fileRepository.findByIdAndCustomerIdAndIsDeletedFalse(fileId, customerId)
                .orElseThrow(() -> new IllegalArgumentException("File not found"));
    }

    /**
     * Update file metadata (name or category)
     */
    @Transactional
    public CustomerFileDto updateFile(UUID customerId, UUID fileId, FileUpdateRequest request) {
        CustomerFile file = getFileById(fileId, customerId);
        UUID currentUserId = tenantSecurityService.getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalStateException("Current user not found"));

        if (request.getDisplayName() != null) {
            file.setDisplayName(request.getDisplayName());
        }

        if (request.getCategoryId() != null) {
            FileCategory newCategory = categoryRepository.findByIdAndDeletedFalse(request.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Category not found"));
            file.setCategory(newCategory);
        }

        file.setUpdatedBy(currentUser);
        file = fileRepository.save(file);

        log.info("Updated file {} for customer {}", fileId, customerId);
        return toDto(file);
    }

    /**
     * Soft delete a file (move to trash)
     */
    @Transactional
    public void deleteFile(UUID customerId, UUID fileId) {
        CustomerFile file = getFileById(fileId, customerId);
        UUID currentUserId = tenantSecurityService.getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalStateException("Current user not found"));

        file.softDelete(currentUser);
        fileRepository.save(file);

        log.info("Soft deleted file {} for customer {}", fileId, customerId);
    }

    /**
     * Restore a file from trash
     */
    @Transactional
    public CustomerFileDto restoreFile(UUID customerId, UUID fileId) {
        CustomerFile file = fileRepository.findById(fileId)
                .orElseThrow(() -> new IllegalArgumentException("File not found"));

        if (!file.getCustomer().getId().equals(customerId)) {
            throw new IllegalArgumentException("File does not belong to this customer");
        }

        file.restore();
        file = fileRepository.save(file);

        log.info("Restored file {} for customer {}", fileId, customerId);
        return toDto(file);
    }

    /**
     * Permanently delete a file
     */
    @Transactional
    public void permanentlyDeleteFile(UUID fileId) {
        CustomerFile file = fileRepository.findById(fileId)
                .orElseThrow(() -> new IllegalArgumentException("File not found"));

        // Delete physical file
        try {
            storageAdapter.delete(file.getStoragePath());
        } catch (IOException e) {
            log.error("Failed to delete physical file: {}", file.getStoragePath(), e);
        }

        // Delete database record
        fileRepository.delete(file);
        log.info("Permanently deleted file {}", fileId);
    }

    /**
     * Download a file
     */
    @Transactional(readOnly = true)
    public byte[] downloadFile(UUID customerId, UUID fileId) throws IOException {
        CustomerFile file = getFileById(fileId, customerId);
        return storageAdapter.retrieve(file.getStoragePath());
    }

    /**
     * Get all deleted files (trash)
     */
    @Transactional(readOnly = true)
    public List<CustomerFileDto> getTrashFiles() {
        List<CustomerFile> files = fileRepository.findByIsDeletedTrueOrderByDeletedAtDesc();
        return files.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Auto-delete old trash files (scheduled job)
     */
    @Transactional
    public void autoDeleteOldTrashFiles() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
        List<CustomerFile> oldFiles = fileRepository.findByIsDeletedTrueAndDeletedAtBefore(cutoffDate);

        for (CustomerFile file : oldFiles) {
            try {
                storageAdapter.delete(file.getStoragePath());
                fileRepository.delete(file);
                log.info("Auto-deleted old file: {}", file.getId());
            } catch (Exception e) {
                log.error("Failed to auto-delete file: {}", file.getId(), e);
            }
        }

        log.info("Auto-deleted {} old files from trash", oldFiles.size());
    }

    /**
     * Generate unique filename with timestamp
     */
    private String generateUniqueFilename(String originalFilename) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String randomId = UUID.randomUUID().toString().substring(0, 8);
        String sanitized = sanitizeFilename(originalFilename);
        return timestamp + "_" + randomId + "_" + sanitized;
    }

    /**
     * Sanitize filename (remove special characters)
     */
    private String sanitizeFilename(String filename) {
        if (filename == null)
            return "file";
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    /**
     * Convert entity to DTO
     */
    private CustomerFileDto toDto(CustomerFile file) {
        LocalDateTime autoDeleteAt = file.getDeletedAt() != null
                ? file.getDeletedAt().plusDays(30)
                : null;

        return CustomerFileDto.builder()
                .id(file.getId())
                .customerId(file.getCustomer().getId())
                .customerName(file.getCustomer().getName())
                .categoryId(file.getCategory().getId())
                .displayName(file.getDisplayName())
                .originalFilename(file.getOriginalFilename())
                .mimeType(file.getMimeType())
                .fileSize(file.getFileSize())
                .uploadedBy(file.getUploadedBy().getId())
                .createdAt(file.getCreatedAt())
                .updatedAt(file.getUpdatedAt())
                .isDeleted(file.getIsDeleted())
                .deletedAt(file.getDeletedAt())
                .autoDeleteAt(autoDeleteAt)
                .build();
    }
}
