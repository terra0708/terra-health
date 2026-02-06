import apiClient from '@shared/core/api';

/**
 * File API - Customer File Management
 * 
 * Backend endpoints (to be implemented):
 * - POST   /v1/health/customers/{customerId}/files
 * - GET    /v1/health/customers/{customerId}/files
 * - GET    /v1/health/customers/{customerId}/files/{fileId}
 * - PUT    /v1/health/customers/{customerId}/files/{fileId}
 * - DELETE /v1/health/customers/{customerId}/files/{fileId}
 * - POST   /v1/health/customers/{customerId}/files/{fileId}/restore
 * - GET    /v1/health/customers/{customerId}/files/{fileId}/download
 * - GET    /v1/health/files/trash (All deleted files for tenant)
 * - DELETE /v1/health/files/{fileId}/permanent (Permanent delete from trash)
 */

/**
 * Upload a file for a customer
 * @param {string} customerId - Customer UUID
 * @param {File} file - File object from input
 * @param {string} categoryId - File category UUID
 * @param {string} displayName - User-edited display name
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} File metadata
 */
export const uploadFile = async (customerId, file, categoryId, displayName, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('categoryId', categoryId);
    formData.append('displayName', displayName || file.name);

    const response = await apiClient.post(
        `/v1/health/customers/${customerId}/files`,
        formData,
        {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            }
        }
    );

    return response;
};

/**
 * Get all files for a customer
 * @param {string} customerId - Customer UUID
 * @param {boolean} includeDeleted - Include soft-deleted files
 * @returns {Promise<Array>} List of file metadata
 */
export const getCustomerFiles = async (customerId, includeDeleted = false) => {
    const params = includeDeleted ? { includeDeleted: true } : {};
    const response = await apiClient.get(`/v1/health/customers/${customerId}/files`, { params });
    return Array.isArray(response) ? response : (response?.data || []);
};

/**
 * Update file metadata (display name, category)
 * @param {string} customerId - Customer UUID
 * @param {string} fileId - File UUID
 * @param {Object} updates - { displayName?, categoryId? }
 * @returns {Promise<Object>} Updated file metadata
 */
export const updateFile = async (customerId, fileId, updates) => {
    const response = await apiClient.put(`/v1/health/customers/${customerId}/files/${fileId}`, updates);
    return response;
};

/**
 * Soft delete a file (move to trash)
 * @param {string} customerId - Customer UUID
 * @param {string} fileId - File UUID
 * @returns {Promise<void>}
 */
export const deleteFile = async (customerId, fileId) => {
    await apiClient.delete(`/v1/health/customers/${customerId}/files/${fileId}`);
};

/**
 * Restore a file from trash
 * @param {string} customerId - Customer UUID
 * @param {string} fileId - File UUID
 * @returns {Promise<Object>} Restored file metadata
 */
export const restoreFile = async (customerId, fileId) => {
    const response = await apiClient.post(`/v1/health/customers/${customerId}/files/${fileId}/restore`);
    return response;
};

/**
 * Download a file
 * @param {string} customerId - Customer UUID
 * @param {string} fileId - File UUID
 * @returns {Promise<Blob>} File blob
 */
export const downloadFile = async (customerId, fileId) => {
    const response = await apiClient.get(
        `/v1/health/customers/${customerId}/files/${fileId}/download`,
        { responseType: 'blob' }
    );
    return response;
};

/**
 * Get all deleted files (trash) for current tenant
 * @returns {Promise<Array>} List of deleted file metadata
 */
export const getTrashFiles = async () => {
    const response = await apiClient.get('/v1/health/files/trash');
    return Array.isArray(response) ? response : (response?.data || []);
};

/**
 * Permanently delete a file from trash
 * @param {string} fileId - File UUID
 * @returns {Promise<void>}
 */
export const permanentDeleteFile = async (fileId) => {
    await apiClient.delete(`/v1/health/files/${fileId}/permanent`);
};

/**
 * Check for duplicate filename in customer's files
 * @param {string} customerId - Customer UUID
 * @param {string} filename - Filename to check
 * @param {string} categoryId - Category UUID
 * @returns {Promise<string>} Unique filename (with suffix if needed)
 */
export const getUniqueFilename = async (customerId, filename, categoryId) => {
    try {
        const files = await getCustomerFiles(customerId);
        const filesInCategory = files.filter(f => f.categoryId === categoryId && !f.isDeleted);

        let uniqueName = filename;
        let counter = 1;

        const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
        const extension = filename.substring(filename.lastIndexOf('.')) || '';

        while (filesInCategory.some(f => f.displayName === uniqueName)) {
            uniqueName = `${nameWithoutExt} (${counter})${extension}`;
            counter++;
        }

        return uniqueName;
    } catch (error) {
        console.error('Failed to check duplicate filename:', error);
        return filename; // Fallback to original name
    }
};
