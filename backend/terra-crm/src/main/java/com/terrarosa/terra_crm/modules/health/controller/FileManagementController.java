package com.terrarosa.terra_crm.modules.health.controller;

import com.terrarosa.terra_crm.modules.health.dto.CustomerFileDto;
import com.terrarosa.terra_crm.modules.health.dto.FileCategoryFileCountDto;
import com.terrarosa.terra_crm.modules.health.repository.CustomerFileRepository;
import com.terrarosa.terra_crm.modules.health.service.CustomerFileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * FileManagementController
 * 
 * REST API for file management operations (trash, category file counts, etc.)
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/health/files")
@RequiredArgsConstructor
public class FileManagementController {

    private final CustomerFileService fileService;
    private final CustomerFileRepository fileRepository;

    /**
     * Get all deleted files (trash)
     * GET /v1/health/files/trash
     */
    @GetMapping("/trash")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'CUSTOMERS_VIEW') or @permissionEvaluator.hasRole(authentication, 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<CustomerFileDto>> getTrashFiles() {
        List<CustomerFileDto> files = fileService.getTrashFiles();
        return ResponseEntity.ok(files);
    }

    /**
     * Permanently delete a file
     * DELETE /v1/health/files/{fileId}/permanent
     */
    @DeleteMapping("/{fileId}/permanent")
    @PreAuthorize("@permissionEvaluator.hasPermission(authentication, 'CUSTOMERS_UPDATE') or @permissionEvaluator.hasRole(authentication, 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> permanentlyDeleteFile(@PathVariable UUID fileId) {
        fileService.permanentlyDeleteFile(fileId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get file count for a category
     * GET /v1/health/parameters/file-categories/{id}/file-count
     */
    @GetMapping("/categories/{categoryId}/file-count")
    public ResponseEntity<FileCategoryFileCountDto> getFileCategoryFileCount(@PathVariable UUID categoryId) {
        Long count = fileRepository.countByCategoryId(categoryId);
        FileCategoryFileCountDto dto = FileCategoryFileCountDto.builder()
                .categoryId(categoryId)
                .fileCount(count)
                .build();
        return ResponseEntity.ok(dto);
    }
}
