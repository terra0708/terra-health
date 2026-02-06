package com.terrarosa.terra_crm.modules.health.storage;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

/**
 * Storage Adapter Interface
 * 
 * Abstraction for file storage operations.
 * Implementations: LocalStorageAdapter (dev), S3StorageAdapter (prod)
 */
public interface StorageAdapter {

    /**
     * Store a file
     * 
     * @param tenantId       Tenant UUID
     * @param customerId     Customer UUID
     * @param file           Multipart file
     * @param uniqueFilename Unique filename to store
     * @return Storage path
     * @throws IOException if storage fails
     */
    String store(UUID tenantId, UUID customerId, MultipartFile file, String uniqueFilename) throws IOException;

    /**
     * Retrieve a file
     * 
     * @param storagePath Storage path
     * @return File bytes
     * @throws IOException if retrieval fails
     */
    byte[] retrieve(String storagePath) throws IOException;

    /**
     * Delete a file
     * 
     * @param storagePath Storage path
     * @throws IOException if deletion fails
     */
    void delete(String storagePath) throws IOException;

    /**
     * Check if file exists
     * 
     * @param storagePath Storage path
     * @return true if exists
     */
    boolean exists(String storagePath);
}
