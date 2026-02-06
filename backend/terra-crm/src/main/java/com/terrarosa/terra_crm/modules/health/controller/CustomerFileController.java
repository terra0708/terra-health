package com.terrarosa.terra_crm.modules.health.controller;

import com.terrarosa.terra_crm.modules.health.dto.*;
import com.terrarosa.terra_crm.modules.health.entity.CustomerFile;
import com.terrarosa.terra_crm.modules.health.service.CustomerFileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * CustomerFileController
 * 
 * REST API for customer file management
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/health/customers/{customerId}/files")
@RequiredArgsConstructor
public class CustomerFileController {

    private final CustomerFileService fileService;

    /**
     * Upload a file
     * POST /v1/health/customers/{customerId}/files
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CustomerFileDto> uploadFile(
            @PathVariable UUID customerId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("categoryId") UUID categoryId,
            @RequestParam(value = "displayName", required = false) String displayName) {
        try {
            CustomerFileDto result = fileService.uploadFile(customerId, categoryId, displayName, file);
            return ResponseEntity.ok(result);
        } catch (IOException e) {
            log.error("Failed to upload file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all files for a customer
     * GET /v1/health/customers/{customerId}/files?includeDeleted=false
     */
    @GetMapping
    public ResponseEntity<List<CustomerFileDto>> getCustomerFiles(
            @PathVariable UUID customerId,
            @RequestParam(value = "includeDeleted", defaultValue = "false") boolean includeDeleted) {
        List<CustomerFileDto> files = fileService.getCustomerFiles(customerId, includeDeleted);
        return ResponseEntity.ok(files);
    }

    /**
     * Update file metadata
     * PUT /v1/health/customers/{customerId}/files/{fileId}
     */
    @PutMapping("/{fileId}")
    public ResponseEntity<CustomerFileDto> updateFile(
            @PathVariable UUID customerId,
            @PathVariable UUID fileId,
            @RequestBody FileUpdateRequest request) {
        CustomerFileDto updated = fileService.updateFile(customerId, fileId, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Soft delete a file (move to trash)
     * DELETE /v1/health/customers/{customerId}/files/{fileId}
     */
    @DeleteMapping("/{fileId}")
    public ResponseEntity<Void> deleteFile(
            @PathVariable UUID customerId,
            @PathVariable UUID fileId) {
        fileService.deleteFile(customerId, fileId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Restore a file from trash
     * POST /v1/health/customers/{customerId}/files/{fileId}/restore
     */
    @PostMapping("/{fileId}/restore")
    public ResponseEntity<CustomerFileDto> restoreFile(
            @PathVariable UUID customerId,
            @PathVariable UUID fileId) {
        CustomerFileDto restored = fileService.restoreFile(customerId, fileId);
        return ResponseEntity.ok(restored);
    }

    /**
     * Download a file
     * GET /v1/health/customers/{customerId}/files/{fileId}/download
     */
    @GetMapping("/{fileId}/download")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable UUID customerId,
            @PathVariable UUID fileId) {
        try {
            CustomerFile file = fileService.getFileById(fileId, customerId);
            byte[] data = fileService.downloadFile(customerId, fileId);

            ByteArrayResource resource = new ByteArrayResource(data);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(file.getMimeType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + file.getDisplayName() + "\"")
                    .body(resource);
        } catch (IOException e) {
            log.error("Failed to download file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
