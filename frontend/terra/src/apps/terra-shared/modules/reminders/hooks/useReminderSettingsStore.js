import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
    createCustomerCategory, 
    createStatusCategory, 
    updateCustomerCategory, 
    updateStatusCategory,
    generateSlug 
} from '../utils/repairDataHelpers';
import { 
    isProtectedCategory, 
    isProtectedItem,
    canDeleteItem,
    canDeleteCategory
} from '../utils/protectionUtils';

const INITIAL_CATEGORIES = [
    { id: 'system', label_tr: 'Sistem', label_en: 'System', type: 'system', color: '#6366f1', isDefault: true },
];

const INITIAL_SUBCATEGORIES = [];

export const INITIAL_STATUSES = [
    { id: 'pending', label_tr: 'Bekliyor', label_en: 'Pending', type: 'system', color: '#f59e0b', isCompleted: false },
    { id: 'completed', label_tr: 'Tamamlandı', label_en: 'Completed', type: 'system', color: '#10b981', isCompleted: true },
    { id: 'cancelled', label_tr: 'İptal', label_en: 'Cancelled', type: 'system', color: '#ef4444', isCompleted: true },
    { id: 'postponed', label_tr: 'Ertelendi', label_en: 'Postponed', type: 'custom', color: '#8b5cf6', isCompleted: false },
];

// generateSlug is now imported from repairDataHelpers

export const useReminderSettingsStore = create(
    persist(
        (set, get) => ({
            // Legacy fields (backward compatibility)
            categories: INITIAL_CATEGORIES,
            subCategories: INITIAL_SUBCATEGORIES,
            statuses: INITIAL_STATUSES,

            // Dinamik parametre türleri
            customParameterTypes: [],

            repairData: () => {
                const state = get();
                
                // Eğer customParameterTypes boşsa veya statik parametreler henüz migrate edilmemişse, migrate et
                // Sol tarafta sadece kategoriler olmalı (isCategory: true)
                // "Durum" ve "Müşteri" default kategoriler olmalı
                const hasStatusCategory = state.customParameterTypes && state.customParameterTypes.some(pt => 
                    pt.id === 'static_category_status' || (pt.isCategory && pt.label_tr === 'Durum')
                );
                const hasCustomerCategory = state.customParameterTypes && state.customParameterTypes.some(pt => 
                    pt.id === 'static_category_customer' || (pt.isCategory && pt.label_tr === 'Müşteri')
                );

                if ((!state.customParameterTypes || state.customParameterTypes.length === 0) || !hasStatusCategory || !hasCustomerCategory) {
                    // Sol tarafta SADECE kategoriler olmalı (isCategory: true)
                    // Sağ tarafta seçilen kategorinin içindeki öğeler gösterilmeli
                    // "Durum" ve "Müşteri" default kategoriler, silinemez ve güncellenemez
                    
                    // Mevcut kategorileri koru, default kategorileri filtrele
                    const existingCategories = (state.customParameterTypes || []).filter(pt => 
                        pt.id !== 'static_category_system' && pt.id !== 'static_category_status' && pt.id !== 'static_category_customer'
                    );
                    const newCategories = [];
                    
                    // Müşteri kategorisi var mı kontrol et, yoksa ekle
                    if (!hasCustomerCategory) {
                        newCategories.push(createCustomerCategory());
                    } else {
                        // Müşteri kategorisi varsa, mevcut halini koru ama eski "Müşteri Hatırlatıcısı" varsa kaldır, "Yeni" ve "Yeni Müşteri" yoksa ekle
                        const existingCustomer = state.customParameterTypes.find(pt => 
                            pt.id === 'static_category_customer' || (pt.isCategory && (pt.label_tr === 'Müşteri' || pt.label_en === 'Customer'))
                        );
                        if (existingCustomer) {
                            newCategories.push(updateCustomerCategory(existingCustomer));
                        }
                    }
                    
                    // Durum kategorisi var mı kontrol et, yoksa ekle
                    if (!hasStatusCategory) {
                        newCategories.push({
                            id: 'static_category_status',
                            type: 'category',
                            label_tr: 'Durum',
                            label_en: 'Status',
                            icon: 'Activity',
                            hasCategory: false,
                            isCategory: true,
                            isDefault: true,
                            color: '#f59e0b',
                            // Durum kategorisinin içindeki öğeler: Status'ler direkt olarak data içinde
                            // "Bekliyor", "Tamamlandı", "İptal" ve "Yeni" (label_tr === 'Yeni' ama 'Yeni Müşteri' değil) güncellenemez/silinemez
                            data: (state.statuses || INITIAL_STATUSES).map(st => ({
                                ...st,
                                label_tr: st.label_tr,
                                label_en: st.label_en,
                                value: st.value || generateSlug(st.label_tr),
                                isCompleted: st.isCompleted !== undefined ? st.isCompleted : false,
                                // Korunan durumlar: Bekliyor, Tamamlandı, İptal ve Yeni (ama Yeni Müşteri değil)
                                isDefault: st.id === 'pending' || st.id === 'completed' || st.id === 'cancelled' || 
                                          (st.label_tr === 'Yeni' && st.label_en === 'New' && st.label_tr !== 'Yeni Müşteri')
                            }))
                        });
                    } else {
                        // Durum kategorisi varsa, mevcut halini koru
                        const existingStatus = state.customParameterTypes.find(pt => 
                            pt.id === 'static_category_status' || (pt.isCategory && (pt.label_tr === 'Durum' || pt.label_en === 'Status'))
                        );
                        if (existingStatus) {
                            newCategories.push(existingStatus);
                        }
                    }
                    
                    const migratedTypes = [...newCategories, ...existingCategories];

                    console.log('ReminderSettings: Migrating types', migratedTypes);
                    set({
                        customParameterTypes: migratedTypes
                    });
                    console.log('ReminderSettings: Migration completed');
                } else {
                    // Mevcut verileri koru, sadece eksik value alanlarını ekle ve eski "Müşteri Hatırlatıcısı" öğesini kaldır
                    const updatedTypes = state.customParameterTypes.map(pt => {
                        // Müşteri kategorisinde eski "Müşteri Hatırlatıcısı" varsa kaldır, "Yeni" (default) ve "Yeni Müşteri" yoksa ekle
                        if (pt.id === 'static_category_customer' || (pt.isCategory && (pt.label_tr === 'Müşteri' || pt.label_en === 'Customer'))) {
                            return updateCustomerCategory(pt);
                        }
                        
                        // Durum kategorisindeki öğeler için isDefault kontrolü ekle
                        if (pt.id === 'static_category_status' || (pt.isCategory && (pt.label_tr === 'Durum' || pt.label_en === 'Status'))) {
                            return updateStatusCategory(pt);
                        }
                        
                        // Diğer kategoriler için sadece value ekle
                        return {
                            ...pt,
                            data: (pt.data || []).map(item => ({
                                ...item,
                                value: item.value || generateSlug(item.label_tr || item.label_en)
                            }))
                        };
                    });
                    
                    set({
                        customParameterTypes: updatedTypes
                    });
                }
            },

            // Legacy CRUD methods (backward compatibility)
            addCategory: (category) => set((state) => ({
                categories: [...state.categories, { ...category, id: Date.now().toString(), type: 'custom' }]
            })),
            updateCategory: (id, updates) => set((state) => ({
                categories: state.categories.map((c) => c.id === id ? { ...c, ...updates } : c)
            })),
            deleteCategory: (id) => set((state) => ({
                categories: state.categories.filter((c) => c.id !== id || c.type === 'system'),
                subCategories: state.subCategories.filter(s => s.categoryId !== id)
            })),
            addSubCategory: (subCategory) => set((state) => ({
                subCategories: [...state.subCategories, { ...subCategory, id: Date.now().toString() }]
            })),
            updateSubCategory: (id, updates) => set((state) => ({
                subCategories: state.subCategories.map((s) => s.id === id ? { ...s, ...updates } : s)
            })),
            deleteSubCategory: (id) => set((state) => ({
                subCategories: state.subCategories.filter((s) => s.id !== id)
            })),
            addStatus: (status) => set((state) => ({
                statuses: [...state.statuses, { ...status, id: Date.now().toString(), type: 'custom' }]
            })),
            updateStatus: (id, updates) => set((state) => ({
                statuses: state.statuses.map((s) => s.id === id ? { ...s, ...updates } : s)
            })),
            deleteStatus: (id) => set((state) => ({
                statuses: state.statuses.filter((s) => s.id !== id || s.type === 'system')
            })),

            // Dinamik Parametre Türleri CRUD
            addParameterType: (paramType) => {
                const newType = {
                    ...paramType,
                    id: Date.now().toString(),
                    type: `custom_param_${Date.now()}`,
                    data: [],
                    hasCategory: paramType.isCategory !== undefined ? paramType.isCategory : paramType.hasCategory,
                    isCategory: paramType.isCategory !== undefined ? paramType.isCategory : paramType.hasCategory,
                    parentCategoryId: paramType.parentCategoryId || undefined,
                    categories: (paramType.isCategory || paramType.hasCategory) ? [] : undefined
                };
                set((state) => ({ customParameterTypes: [...state.customParameterTypes, newType] }));
                return newType;
            },
            updateParameterType: (id, updated) => set((state) => {
                // "Müşteri" ve "Durum" kategorileri güncellenemez/silinemez
                const paramType = state.customParameterTypes.find(pt => pt.id === id);
                const isProtectedCategory = paramType && (
                    paramType.isDefault || 
                    paramType.id === 'static_category_customer' || 
                    paramType.id === 'static_category_status' ||
                    paramType.label_tr === 'Müşteri' ||
                    paramType.label_tr === 'Durum'
                );
                
                if (isProtectedCategory) {
                    // Korunan kategoriler için sadece label_tr, label_en, icon ve color güncellenebilir
                    const allowedUpdates = {
                        label_tr: updated.label_tr,
                        label_en: updated.label_en,
                        icon: updated.icon,
                        color: updated.color
                    };
                    return {
                        customParameterTypes: state.customParameterTypes.map(pt => 
                            pt.id === id ? { ...pt, ...allowedUpdates } : pt
                        )
                    };
                }
                return {
                    customParameterTypes: state.customParameterTypes.map(pt => 
                        pt.id === id ? { ...pt, ...updated } : pt
                    )
                };
            }),
            deleteParameterType: (id) => set((state) => {
                // "Müşteri" ve "Durum" kategorileri silinemez
                const paramType = state.customParameterTypes.find(pt => pt.id === id);
                const isProtectedCategory = paramType && (
                    paramType.isDefault || 
                    paramType.id === 'static_category_customer' || 
                    paramType.id === 'static_category_status' ||
                    paramType.label_tr === 'Müşteri' ||
                    paramType.label_tr === 'Durum'
                );
                
                if (isProtectedCategory) {
                    console.warn('Korunan kategori silinemez:', paramType.label_tr);
                    return state;
                }
                return {
                    customParameterTypes: state.customParameterTypes.filter(pt => pt.id !== id)
                };
            }),

            // Parametre Değerleri CRUD
            addParameterValue: (paramTypeId, value) => {
                const newValue = {
                    ...value,
                    id: Date.now().toString(),
                    value: value.value || generateSlug(value.label_tr || value.label_en)
                };
                set((state) => ({
                    customParameterTypes: state.customParameterTypes.map(pt => 
                        pt.id === paramTypeId 
                            ? { ...pt, data: [...(pt.data || []), newValue] }
                            : pt
                    )
                }));
                return newValue;
            },
            updateParameterValue: (paramTypeId, valueId, updated) => set((state) => {
                const paramType = state.customParameterTypes.find(pt => pt.id === paramTypeId);
                const item = paramType?.data?.find(v => v.id === valueId);
                
                // Check if item is protected
                const isProtected = isProtectedItem(paramType, item);
                
                if (isProtected) {
                    // Protected items can only update label_tr, label_en, and color
                    const allowedUpdates = {
                        label_tr: updated.label_tr,
                        label_en: updated.label_en,
                        color: updated.color
                    };
                    return {
                        customParameterTypes: state.customParameterTypes.map(pt => 
                            pt.id === paramTypeId 
                                ? { 
                                    ...pt, 
                                    data: pt.data.map(v => v.id === valueId ? { ...v, ...allowedUpdates } : v)
                                }
                                : pt
                        )
                    };
                }
                
                return {
                    customParameterTypes: state.customParameterTypes.map(pt => 
                        pt.id === paramTypeId 
                            ? { 
                                ...pt, 
                                data: pt.data.map(v => v.id === valueId ? { ...v, ...updated } : v)
                            }
                            : pt
                    )
                };
            }),
            deleteParameterValue: (paramTypeId, valueId) => set((state) => {
                const paramType = state.customParameterTypes.find(pt => pt.id === paramTypeId);
                if (paramType) {
                    const item = paramType.data.find(v => v.id === valueId);
                    
                    // Check if item can be deleted
                    if (!canDeleteItem(paramType, item)) {
                        console.warn('Korunan öğe silinemez:', item?.label_tr);
                        return state;
                    }
                }
                return {
                    customParameterTypes: state.customParameterTypes.map(pt => 
                        pt.id === paramTypeId 
                            ? { ...pt, data: pt.data.filter(v => v.id !== valueId) }
                            : pt
                    )
                };
            }),

            // Parametre Kategorileri CRUD (hasCategory true ise)
            addParameterCategory: (paramTypeId, category) => {
                const newCategory = {
                    ...category,
                    id: Date.now().toString()
                };
                set((state) => ({
                    customParameterTypes: state.customParameterTypes.map(pt => 
                        pt.id === paramTypeId 
                            ? { ...pt, categories: [...(pt.categories || []), newCategory] }
                            : pt
                    )
                }));
                return newCategory;
            },
            updateParameterCategory: (paramTypeId, categoryId, updated) => set((state) => ({
                customParameterTypes: state.customParameterTypes.map(pt => 
                    pt.id === paramTypeId 
                        ? { 
                            ...pt, 
                            categories: pt.categories.map(c => c.id === categoryId ? { ...c, ...updated } : c)
                        }
                        : pt
                )
            })),
            deleteParameterCategory: (paramTypeId, categoryId) => set((state) => ({
                customParameterTypes: state.customParameterTypes.map(pt => 
                    pt.id === paramTypeId 
                        ? { ...pt, categories: pt.categories.filter(c => c.id !== categoryId) }
                        : pt
                )
            })),
        }),
        {
            name: 'terra-reminder-settings-v10', // Version bump: Customer category with "Yeni" (default, undeletable/uneditable) and "Yeni Müşteri" (deletable/editable)
            version: 9
        }
    )
);
