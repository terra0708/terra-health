import { create } from 'zustand';
import * as fileAPI from '../api/fileAPI';

/**
 * File Store - Customer File Management
 * 
 * Manages file uploads, downloads, trash operations, and progress tracking.
 * All operations are tenant-isolated through backend.
 */
export const useFileStore = create((set, get) => ({
    // State
    files: [], // All files for current context
    trashFiles: [], // Deleted files
    loading: false,
    error: null,
    uploadQueue: [], // { id, customerId, file, categoryId, displayName, progress, status }

    // Fetch files for a customer
    fetchCustomerFiles: async (customerId, includeDeleted = false) => {
        set({ loading: true, error: null });
        try {
            const files = await fileAPI.getCustomerFiles(customerId, includeDeleted);
            set({ files, loading: false });
            return files;
        } catch (error) {
            console.error('Failed to fetch customer files:', error);
            set({ error: error.message || 'Failed to fetch files', loading: false });
            throw error;
        }
    },

    // Upload a file with progress tracking
    uploadFile: async (customerId, file, categoryId, displayName) => {
        const uploadId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Check for duplicate and get unique name
        const uniqueName = await fileAPI.getUniqueFilename(customerId, displayName || file.name, categoryId);

        // Add to upload queue
        set(state => ({
            uploadQueue: [...state.uploadQueue, {
                id: uploadId,
                customerId,
                file,
                categoryId,
                displayName: uniqueName,
                progress: 0,
                status: 'uploading'
            }]
        }));

        try {
            const uploadedFile = await fileAPI.uploadFile(
                customerId,
                file,
                categoryId,
                uniqueName,
                (progress) => {
                    // Update progress in queue
                    set(state => ({
                        uploadQueue: state.uploadQueue.map(item =>
                            item.id === uploadId ? { ...item, progress } : item
                        )
                    }));
                }
            );

            // Mark as completed
            set(state => ({
                uploadQueue: state.uploadQueue.map(item =>
                    item.id === uploadId ? { ...item, status: 'completed', progress: 100 } : item
                ),
                files: [uploadedFile, ...state.files]
            }));

            // Remove from queue after 2 seconds
            setTimeout(() => {
                set(state => ({
                    uploadQueue: state.uploadQueue.filter(item => item.id !== uploadId)
                }));
            }, 2000);

            return uploadedFile;
        } catch (error) {
            console.error('Failed to upload file:', error);

            // Mark as failed
            set(state => ({
                uploadQueue: state.uploadQueue.map(item =>
                    item.id === uploadId ? { ...item, status: 'failed', error: error.message } : item
                )
            }));

            throw error;
        }
    },

    // Update file metadata
    updateFile: async (customerId, fileId, updates) => {
        set({ loading: true, error: null });
        try {
            const updatedFile = await fileAPI.updateFile(customerId, fileId, updates);
            set(state => ({
                files: state.files.map(f => f.id === fileId ? updatedFile : f),
                loading: false
            }));
            return updatedFile;
        } catch (error) {
            console.error('Failed to update file:', error);
            set({ error: error.message || 'Failed to update file', loading: false });
            throw error;
        }
    },

    // Delete file (soft delete - move to trash)
    deleteFile: async (customerId, fileId) => {
        set({ loading: true, error: null });
        try {
            await fileAPI.deleteFile(customerId, fileId);
            set(state => ({
                files: state.files.filter(f => f.id !== fileId),
                loading: false
            }));
        } catch (error) {
            console.error('Failed to delete file:', error);
            set({ error: error.message || 'Failed to delete file', loading: false });
            throw error;
        }
    },

    // Download file
    downloadFile: async (customerId, fileId, filename) => {
        try {
            const blob = await fileAPI.downloadFile(customerId, fileId);

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download file:', error);
            throw error;
        }
    },

    // Fetch trash files
    fetchTrashFiles: async () => {
        set({ loading: true, error: null });
        try {
            const trashFiles = await fileAPI.getTrashFiles();
            set({ trashFiles, loading: false });
            return trashFiles;
        } catch (error) {
            console.error('Failed to fetch trash files:', error);
            set({ error: error.message || 'Failed to fetch trash', loading: false });
            throw error;
        }
    },

    // Restore file from trash
    restoreFile: async (customerId, fileId) => {
        set({ loading: true, error: null });
        try {
            const restoredFile = await fileAPI.restoreFile(customerId, fileId);
            set(state => ({
                trashFiles: state.trashFiles.filter(f => f.id !== fileId),
                files: [restoredFile, ...state.files],
                loading: false
            }));
            return restoredFile;
        } catch (error) {
            console.error('Failed to restore file:', error);
            set({ error: error.message || 'Failed to restore file', loading: false });
            throw error;
        }
    },

    // Permanently delete file from trash
    permanentDeleteFile: async (fileId) => {
        set({ loading: true, error: null });
        try {
            await fileAPI.permanentDeleteFile(fileId);
            set(state => ({
                trashFiles: state.trashFiles.filter(f => f.id !== fileId),
                loading: false
            }));
        } catch (error) {
            console.error('Failed to permanently delete file:', error);
            set({ error: error.message || 'Failed to delete file', loading: false });
            throw error;
        }
    },

    // Clear upload queue
    clearUploadQueue: () => {
        set({ uploadQueue: [] });
    },

    // Clear error
    clearError: () => set({ error: null }),
}));
