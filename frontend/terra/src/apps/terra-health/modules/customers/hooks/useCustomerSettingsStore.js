import { create } from 'zustand';
import * as parametersAPI from '../api/customerParametersAPI';

// Helper function to convert backend DTO to frontend format
const convertDtoToFrontend = (dto, type) => {
    const base = {
        id: dto.id,
        color: dto.color,
        icon: dto.icon,
        isSystem: dto.isSystem
    };

    if (type === 'service') {
        return {
            ...base,
            name_tr: dto.nameTr,
            name_en: dto.nameEn,
            value: dto.value,
            category: dto.categoryId,
            categoryLabelTr: dto.categoryLabelTr,
            categoryLabelEn: dto.categoryLabelEn
        };
    } else if (type === 'category') {
        return {
            ...base,
            label_tr: dto.labelTr,
            label_en: dto.labelEn
        };
    } else if (type === 'consultant') {
        return {
            id: dto.id,
            name: `${dto.firstName} ${dto.lastName}`.trim() || dto.email,
            email: dto.email
        };
    } else {
        return {
            ...base,
            label_tr: dto.labelTr,
            label_en: dto.labelEn,
            value: dto.value
        };
    }
};

// Helper function to convert frontend format to backend DTO
const convertFrontendToDto = (item, type) => {
    if (type === 'service') {
        return {
            nameTr: item.name_tr,
            nameEn: item.name_en,
            value: item.value,
            categoryId: item.category,
            color: item.color,
            icon: item.icon
        };
    } else if (type === 'category' || type === 'file_category') {
        return {
            labelTr: item.label_tr,
            labelEn: item.label_en,
            color: item.color,
            icon: item.icon
        };
    } else {
        return {
            labelTr: item.label_tr,
            labelEn: item.label_en,
            value: item.value,
            color: item.color,
            icon: item.icon
        };
    }
};

export const useCustomerSettingsStore = create((set, get) => ({
    // Data
    categories: [],
    services: [],
    statuses: [],
    sources: [],
    tags: [],
    fileCategories: [],
    consultants: [],

    // Loading states
    loading: {
        categories: false,
        services: false,
        statuses: false,
        sources: false,
        tags: false,
        fileCategories: false,
        consultants: false
    },

    // Error states
    errors: {
        categories: null,
        services: null,
        statuses: null,
        sources: null,
        tags: null,
        fileCategories: null
    },

    // ==================== FETCH METHODS ====================

    fetchCategories: async () => {
        set(state => ({ loading: { ...state.loading, categories: true }, errors: { ...state.errors, categories: null } }));
        try {
            const data = await parametersAPI.getAllCategories();
            set({ categories: data.map(dto => convertDtoToFrontend(dto, 'category')) });
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            set(state => ({ errors: { ...state.errors, categories: error.message } }));
        } finally {
            set(state => ({ loading: { ...state.loading, categories: false } }));
        }
    },

    fetchServices: async () => {
        set(state => ({ loading: { ...state.loading, services: true }, errors: { ...state.errors, services: null } }));
        try {
            const data = await parametersAPI.getAllServices();
            set({ services: data.map(dto => convertDtoToFrontend(dto, 'service')) });
        } catch (error) {
            console.error('Failed to fetch services:', error);
            set(state => ({ errors: { ...state.errors, services: error.message } }));
        } finally {
            set(state => ({ loading: { ...state.loading, services: false } }));
        }
    },

    fetchStatuses: async () => {
        set(state => ({ loading: { ...state.loading, statuses: true }, errors: { ...state.errors, statuses: null } }));
        try {
            const data = await parametersAPI.getAllStatuses();
            set({ statuses: data.map(dto => convertDtoToFrontend(dto, 'status')) });
        } catch (error) {
            console.error('Failed to fetch statuses:', error);
            set(state => ({ errors: { ...state.errors, statuses: error.message } }));
        } finally {
            set(state => ({ loading: { ...state.loading, statuses: false } }));
        }
    },

    fetchSources: async () => {
        set(state => ({ loading: { ...state.loading, sources: true }, errors: { ...state.errors, sources: null } }));
        try {
            const data = await parametersAPI.getAllSources();
            set({ sources: data.map(dto => convertDtoToFrontend(dto, 'source')) });
        } catch (error) {
            console.error('Failed to fetch sources:', error);
            set(state => ({ errors: { ...state.errors, sources: error.message } }));
        } finally {
            set(state => ({ loading: { ...state.loading, sources: false } }));
        }
    },

    fetchTags: async () => {
        set(state => ({ loading: { ...state.loading, tags: true }, errors: { ...state.errors, tags: null } }));
        try {
            const data = await parametersAPI.getAllTags();
            set({ tags: data.map(dto => convertDtoToFrontend(dto, 'tag')) });
        } catch (error) {
            console.error('Failed to fetch tags:', error);
            set(state => ({ errors: { ...state.errors, tags: error.message } }));
        } finally {
            set(state => ({ loading: { ...state.loading, tags: false } }));
        }
    },

    fetchFileCategories: async () => {
        set(state => ({ loading: { ...state.loading, fileCategories: true }, errors: { ...state.errors, fileCategories: null } }));
        try {
            const data = await parametersAPI.getAllFileCategories();
            set({ fileCategories: data.map(dto => convertDtoToFrontend(dto, 'file_category')) });
        } catch (error) {
            console.error('Failed to fetch file categories:', error);
            set(state => ({ errors: { ...state.errors, fileCategories: error.message } }));
        } finally {
            set(state => ({ loading: { ...state.loading, fileCategories: false } }));
        }
    },

    fetchConsultants: async () => {
        set(state => ({ loading: { ...state.loading, consultants: true } }));
        try {
            const response = await parametersAPI.getTenantUsers();
            // Backend returns ApiResponse<List<UserDto>> or List<UserDto> if unwrapped
            const users = Array.isArray(response) ? response : (response?.data || []);
            set({ consultants: users.map(dto => convertDtoToFrontend(dto, 'consultant')) });
        } catch (error) {
            console.error('Failed to fetch consultants:', error);
        } finally {
            set(state => ({ loading: { ...state.loading, consultants: false } }));
        }
    },

    fetchAll: async () => {
        const { fetchCategories, fetchServices, fetchStatuses, fetchSources, fetchTags, fetchFileCategories, fetchConsultants } = get();
        await Promise.all([
            fetchCategories(),
            fetchServices(),
            fetchStatuses(),
            fetchSources(),
            fetchTags(),
            fetchFileCategories(),
            fetchConsultants()
        ]);
    },

    // ==================== CATEGORIES ====================

    addCategory: async (category) => {
        try {
            const dto = convertFrontendToDto(category, 'category');
            const created = await parametersAPI.createCategory(dto);
            set(state => ({ categories: [...state.categories, convertDtoToFrontend(created, 'category')] }));
            return created;
        } catch (error) {
            console.error('Failed to create category:', error);
            throw error;
        }
    },

    updateCategory: async (id, updated) => {
        try {
            const dto = convertFrontendToDto(updated, 'category');
            const result = await parametersAPI.updateCategory(id, dto);
            set(state => ({
                categories: state.categories.map(c => c.id === id ? convertDtoToFrontend(result, 'category') : c)
            }));
            return result;
        } catch (error) {
            console.error('Failed to update category:', error);
            throw error;
        }
    },

    deleteCategory: async (id) => {
        try {
            await parametersAPI.deleteCategory(id);
            set(state => ({ categories: state.categories.filter(c => c.id !== id) }));
        } catch (error) {
            console.error('Failed to delete category:', error);
            throw error;
        }
    },

    // ==================== SERVICES ====================

    addService: async (service) => {
        try {
            const dto = convertFrontendToDto(service, 'service');
            const created = await parametersAPI.createService(dto);
            set(state => ({ services: [...state.services, convertDtoToFrontend(created, 'service')] }));
            return created;
        } catch (error) {
            console.error('Failed to create service:', error);
            throw error;
        }
    },

    updateService: async (id, updated) => {
        try {
            const dto = convertFrontendToDto(updated, 'service');
            const result = await parametersAPI.updateService(id, dto);
            set(state => ({
                services: state.services.map(s => s.id === id ? convertDtoToFrontend(result, 'service') : s)
            }));
            return result;
        } catch (error) {
            console.error('Failed to update service:', error);
            throw error;
        }
    },

    deleteService: async (id) => {
        try {
            await parametersAPI.deleteService(id);
            set(state => ({ services: state.services.filter(s => s.id !== id) }));
        } catch (error) {
            console.error('Failed to delete service:', error);
            throw error;
        }
    },

    // ==================== STATUSES ====================

    addStatus: async (status) => {
        try {
            const dto = convertFrontendToDto(status, 'status');
            const created = await parametersAPI.createStatus(dto);
            set(state => ({ statuses: [...state.statuses, convertDtoToFrontend(created, 'status')] }));
            return created;
        } catch (error) {
            console.error('Failed to create status:', error);
            throw error;
        }
    },

    updateStatus: async (id, updated) => {
        try {
            const dto = convertFrontendToDto(updated, 'status');
            const result = await parametersAPI.updateStatus(id, dto);
            set(state => ({
                statuses: state.statuses.map(s => s.id === id ? convertDtoToFrontend(result, 'status') : s)
            }));
            return result;
        } catch (error) {
            console.error('Failed to update status:', error);
            throw error;
        }
    },

    deleteStatus: async (id) => {
        try {
            await parametersAPI.deleteStatus(id);
            set(state => ({ statuses: state.statuses.filter(s => s.id !== id) }));
        } catch (error) {
            console.error('Failed to delete status:', error);
            throw error;
        }
    },

    // ==================== SOURCES ====================

    addSource: async (source) => {
        try {
            const dto = convertFrontendToDto(source, 'source');
            const created = await parametersAPI.createSource(dto);
            set(state => ({ sources: [...state.sources, convertDtoToFrontend(created, 'source')] }));
            return created;
        } catch (error) {
            console.error('Failed to create source:', error);
            throw error;
        }
    },

    updateSource: async (id, updated) => {
        try {
            const dto = convertFrontendToDto(updated, 'source');
            const result = await parametersAPI.updateSource(id, dto);
            set(state => ({
                sources: state.sources.map(s => s.id === id ? convertDtoToFrontend(result, 'source') : s)
            }));
            return result;
        } catch (error) {
            console.error('Failed to update source:', error);
            throw error;
        }
    },

    deleteSource: async (id) => {
        try {
            await parametersAPI.deleteSource(id);
            set(state => ({ sources: state.sources.filter(s => s.id !== id) }));
        } catch (error) {
            console.error('Failed to delete source:', error);
            throw error;
        }
    },

    // ==================== TAGS ====================

    addTag: async (tag) => {
        try {
            const dto = convertFrontendToDto(tag, 'tag');
            const created = await parametersAPI.createTag(dto);
            set(state => ({ tags: [...state.tags, convertDtoToFrontend(created, 'tag')] }));
            return created;
        } catch (error) {
            console.error('Failed to create tag:', error);
            throw error;
        }
    },

    updateTag: async (id, updated) => {
        try {
            const dto = convertFrontendToDto(updated, 'tag');
            const result = await parametersAPI.updateTag(id, dto);
            set(state => ({
                tags: state.tags.map(t => t.id === id ? convertDtoToFrontend(result, 'tag') : t)
            }));
            return result;
        } catch (error) {
            console.error('Failed to update tag:', error);
            throw error;
        }
    },

    deleteTag: async (id) => {
        try {
            await parametersAPI.deleteTag(id);
            set(state => ({ tags: state.tags.filter(t => t.id !== id) }));
        } catch (error) {
            console.error('Failed to delete tag:', error);
            throw error;
        }
    },

    // ==================== FILE CATEGORIES ====================

    addFileCategory: async (fileCategory) => {
        try {
            const dto = convertFrontendToDto(fileCategory, 'file_category');
            const created = await parametersAPI.createFileCategory(dto);
            set(state => ({ fileCategories: [...state.fileCategories, convertDtoToFrontend(created, 'file_category')] }));
            return created;
        } catch (error) {
            console.error('Failed to create file category:', error);
            throw error;
        }
    },

    updateFileCategory: async (id, updated) => {
        try {
            const dto = convertFrontendToDto(updated, 'file_category');
            const result = await parametersAPI.updateFileCategory(id, dto);
            set(state => ({
                fileCategories: state.fileCategories.map(c => c.id === id ? convertDtoToFrontend(result, 'file_category') : c)
            }));
            return result;
        } catch (error) {
            console.error('Failed to update file category:', error);
            throw error;
        }
    },

    deleteFileCategory: async (id) => {
        try {
            await parametersAPI.deleteFileCategory(id);
            set(state => ({ fileCategories: state.fileCategories.filter(c => c.id !== id) }));
        } catch (error) {
            console.error('Failed to delete file category:', error);
            throw error;
        }
    }
}));
