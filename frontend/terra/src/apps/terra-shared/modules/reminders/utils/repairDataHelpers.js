import { INITIAL_STATUSES } from '../hooks/useReminderSettingsStore';

/**
 * Generate slug from text
 */
export function generateSlug(text) {
    if (!text) return '';
    return text.toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '_')
        .replace(/^-+|-+$/g, '');
}

/**
 * Create default Customer category with items
 */
export const createCustomerCategory = () => ({
    id: 'static_category_customer',
    type: 'category',
    label_tr: 'Müşteri',
    label_en: 'Customer',
    icon: 'User',
    hasCategory: false,
    isCategory: true,
    isDefault: true,
    color: '#6366f1',
    data: [
        {
            id: 'system_new',
            label_tr: 'Yeni',
            label_en: 'New',
            type: 'system',
            color: '#6366f1',
            isDefault: true,
            value: 'new',
            isCompleted: false
        },
        {
            id: `new_customer_${Date.now()}`,
            label_tr: 'Yeni Müşteri',
            label_en: 'New Customer',
            type: 'custom',
            color: '#6366f1',
            isDefault: false,
            value: 'new_customer',
            isCompleted: false
        }
    ]
});

/**
 * Create default Status category with items
 * @param {Array} statuses - Array of status items (defaults to INITIAL_STATUSES if not provided)
 */
export const createStatusCategory = (statuses, INITIAL_STATUSES) => ({
    id: 'static_category_status',
    type: 'category',
    label_tr: 'Durum',
    label_en: 'Status',
    icon: 'Activity',
    hasCategory: false,
    isCategory: true,
    isDefault: true,
    color: '#f59e0b',
    data: (statuses || INITIAL_STATUSES).map(st => ({
        ...st,
        label_tr: st.label_tr,
        label_en: st.label_en,
        value: st.value || generateSlug(st.label_tr),
        isCompleted: st.isCompleted !== undefined ? st.isCompleted : false,
        isDefault: st.id === 'pending' || 
                  st.id === 'completed' || 
                  st.id === 'cancelled' || 
                  (st.label_tr === 'Yeni' && st.label_en === 'New' && st.label_tr !== 'Yeni Müşteri')
    }))
});

/**
 * Update existing Customer category - remove old items and ensure required items exist
 */
export const updateCustomerCategory = (existingCustomer) => {
    // Remove old "Müşteri Hatırlatıcısı" item
    const filteredData = (existingCustomer.data || []).filter(item => 
        item.id !== 'system_customer_reminder' && item.label_tr !== 'Müşteri Hatırlatıcısı'
    );
    
    // Check if "Yeni" (default) exists
    const hasNew = filteredData.some(item => 
        item.id === 'system_new' || 
        (item.label_tr === 'Yeni' && item.label_en === 'New' && item.label_tr !== 'Yeni Müşteri')
    );
    
    // Check if "Yeni Müşteri" exists
    const hasNewCustomer = filteredData.some(item => 
        item.label_tr === 'Yeni Müşteri' || item.label_en === 'New Customer'
    );
    
    let finalData = filteredData.map(item => ({
        ...item,
        value: item.value || generateSlug(item.label_tr || item.label_en),
        isDefault: item.id === 'system_new' || 
                  (item.label_tr === 'Yeni' && item.label_en === 'New' && item.label_tr !== 'Yeni Müşteri') 
                  ? true 
                  : (item.isDefault !== undefined ? item.isDefault : false)
    }));
    
    // Add "Yeni" if missing (at the beginning)
    if (!hasNew) {
        finalData = [
            {
                id: 'system_new',
                label_tr: 'Yeni',
                label_en: 'New',
                type: 'system',
                color: '#6366f1',
                isDefault: true,
                value: 'new',
                isCompleted: false
            },
            ...finalData
        ];
    }
    
    // Add "Yeni Müşteri" if missing (at the end)
    if (!hasNewCustomer) {
        finalData = [
            ...finalData,
            {
                id: `new_customer_${Date.now()}`,
                label_tr: 'Yeni Müşteri',
                label_en: 'New Customer',
                type: 'custom',
                color: '#6366f1',
                isDefault: false,
                value: 'new_customer',
                isCompleted: false
            }
        ];
    }
    
    return {
        ...existingCustomer,
        data: finalData
    };
};

/**
 * Update Status category - ensure isDefault flags are set correctly
 */
export const updateStatusCategory = (existingStatus) => ({
    ...existingStatus,
    data: (existingStatus.data || []).map(item => ({
        ...item,
        value: item.value || generateSlug(item.label_tr || item.label_en),
        isDefault: item.isDefault !== undefined ? item.isDefault : (
            item.id === 'pending' || 
            item.id === 'completed' || 
            item.id === 'cancelled' ||
            (item.label_tr === 'Yeni' && item.label_en === 'New' && item.label_tr !== 'Yeni Müşteri')
        )
    }))
});
