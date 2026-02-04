import api from '@core/api';

const BASE_URL = '/v1/health/parameters';

// ==================== CATEGORIES ====================

export const getAllCategories = async () => {
    return await api.get(`${BASE_URL}/categories`);
};

export const getCategoryById = async (id) => {
    return await api.get(`${BASE_URL}/categories/${id}`);
};

export const createCategory = async (data) => {
    return await api.post(`${BASE_URL}/categories`, data);
};

export const updateCategory = async (id, data) => {
    return await api.put(`${BASE_URL}/categories/${id}`, data);
};

export const deleteCategory = async (id) => {
    await api.delete(`${BASE_URL}/categories/${id}`);
};

// ==================== SERVICES ====================

export const getAllServices = async () => {
    return await api.get(`${BASE_URL}/services`);
};

export const getServiceById = async (id) => {
    return await api.get(`${BASE_URL}/services/${id}`);
};

export const createService = async (data) => {
    return await api.post(`${BASE_URL}/services`, data);
};

export const updateService = async (id, data) => {
    return await api.put(`${BASE_URL}/services/${id}`, data);
};

export const deleteService = async (id) => {
    await api.delete(`${BASE_URL}/services/${id}`);
};

// ==================== STATUSES ====================

export const getAllStatuses = async () => {
    return await api.get(`${BASE_URL}/statuses`);
};

export const getStatusById = async (id) => {
    return await api.get(`${BASE_URL}/statuses/${id}`);
};

export const createStatus = async (data) => {
    return await api.post(`${BASE_URL}/statuses`, data);
};

export const updateStatus = async (id, data) => {
    return await api.put(`${BASE_URL}/statuses/${id}`, data);
};

export const deleteStatus = async (id) => {
    await api.delete(`${BASE_URL}/statuses/${id}`);
};

// ==================== SOURCES ====================

export const getAllSources = async () => {
    return await api.get(`${BASE_URL}/sources`);
};

export const getSourceById = async (id) => {
    return await api.get(`${BASE_URL}/sources/${id}`);
};

export const createSource = async (data) => {
    return await api.post(`${BASE_URL}/sources`, data);
};

export const updateSource = async (id, data) => {
    return await api.put(`${BASE_URL}/sources/${id}`, data);
};

export const deleteSource = async (id) => {
    await api.delete(`${BASE_URL}/sources/${id}`);
};

// ==================== TAGS ====================

export const getAllTags = async () => {
    return await api.get(`${BASE_URL}/tags`);
};

export const getTagById = async (id) => {
    return await api.get(`${BASE_URL}/tags/${id}`);
};

export const createTag = async (data) => {
    return await api.post(`${BASE_URL}/tags`, data);
};

export const updateTag = async (id, data) => {
    return await api.put(`${BASE_URL}/tags/${id}`, data);
};

export const deleteTag = async (id) => {
    await api.delete(`${BASE_URL}/tags/${id}`);
};

// ==================== FILE CATEGORIES ====================

export const getAllFileCategories = async () => {
    return await api.get(`${BASE_URL}/file-categories`);
};

export const getFileCategoryById = async (id) => {
    return await api.get(`${BASE_URL}/file-categories/${id}`);
};

export const createFileCategory = async (data) => {
    return await api.post(`${BASE_URL}/file-categories`, data);
};

export const updateFileCategory = async (id, data) => {
    return await api.put(`${BASE_URL}/file-categories/${id}`, data);
};

export const deleteFileCategory = async (id) => {
    await api.delete(`${BASE_URL}/file-categories/${id}`);
};

// ==================== TENANT USERS ====================

export const getTenantUsers = async () => {
    return await api.get('/v1/tenant-admin/users');
};

