package com.terrarosa.terra_crm.modules.health.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Local Storage Adapter
 * 
 * Stores files on local filesystem for development.
 * Structure: storage/{tenant_id}/customers/{customer_id}/{filename}
 */
@Slf4j
@Component
public class LocalStorageAdapter implements StorageAdapter {

    @Value("${app.storage.base-path:./storage}")
    private String basePath;

    @Override
    public String store(UUID tenantId, UUID customerId, MultipartFile file, String uniqueFilename) throws IOException {
        // Create directory structure
        Path customerDir = Paths.get(basePath, tenantId.toString(), "customers", customerId.toString());
        Files.createDirectories(customerDir);

        // Store file
        Path filePath = customerDir.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Return relative storage path
        String storagePath = tenantId + "/customers/" + customerId + "/" + uniqueFilename;
        log.info("Stored file: {}", storagePath);
        return storagePath;
    }

    @Override
    public byte[] retrieve(String storagePath) throws IOException {
        Path filePath = Paths.get(basePath, storagePath);
        if (!Files.exists(filePath)) {
            throw new IOException("File not found: " + storagePath);
        }
        return Files.readAllBytes(filePath);
    }

    @Override
    public void delete(String storagePath) throws IOException {
        Path filePath = Paths.get(basePath, storagePath);
        if (Files.exists(filePath)) {
            Files.delete(filePath);
            log.info("Deleted file: {}", storagePath);
        }
    }

    @Override
    public boolean exists(String storagePath) {
        Path filePath = Paths.get(basePath, storagePath);
        return Files.exists(filePath);
    }
}
