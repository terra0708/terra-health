import apiClient from '../../../core/api';

const BASE_URL = '/v1/health/reminder-settings';

export const reminderSettingsAPI = {
    // Categories
    getCategories: () => apiClient.get(`${BASE_URL}/categories`),
    createCategory: (data) => apiClient.post(`${BASE_URL}/categories`, data),
    updateCategory: (id, data) => apiClient.put(`${BASE_URL}/categories/${id}`, data),
    deleteCategory: (id) => apiClient.delete(`${BASE_URL}/categories/${id}`),

    // Subcategories
    getSubcategories: () => apiClient.get(`${BASE_URL}/subcategories`),
    getSubcategoriesByCategoryId: (categoryId) =>
        apiClient.get(`${BASE_URL}/categories/${categoryId}/subcategories`),
    createSubcategory: (data) => apiClient.post(`${BASE_URL}/subcategories`, data),
    updateSubcategory: (id, data) => apiClient.put(`${BASE_URL}/subcategories/${id}`, data),
    deleteSubcategory: (id) => apiClient.delete(`${BASE_URL}/subcategories/${id}`),

    // Statuses
    getStatuses: () => apiClient.get(`${BASE_URL}/statuses`),
    createStatus: (data) => apiClient.post(`${BASE_URL}/statuses`, data),
    updateStatus: (id, data) => apiClient.put(`${BASE_URL}/statuses/${id}`, data),
    deleteStatus: (id) => apiClient.delete(`${BASE_URL}/statuses/${id}`),
};
