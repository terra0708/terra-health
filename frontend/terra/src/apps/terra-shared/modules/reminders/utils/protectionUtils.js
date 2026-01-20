/**
 * Check if a category is protected (cannot be deleted/updated)
 * @param {Object} paramType - Parameter type object
 * @returns {boolean} Whether the category is protected
 */
export const isProtectedCategory = (paramType) => {
    if (!paramType) return false;
    
    return paramType.isDefault || 
           paramType.id === 'static_category_customer' || 
           paramType.id === 'static_category_status' ||
           paramType.label_tr === 'Müşteri' ||
           paramType.label_tr === 'Durum';
};

/**
 * Check if a status item is protected (cannot be deleted/updated)
 * @param {Object} item - Status item object
 * @returns {boolean} Whether the status item is protected
 */
export const isProtectedStatusItem = (item) => {
    if (!item) return false;
    
    return item.isDefault || 
           item.id === 'pending' || 
           item.id === 'completed' || 
           item.id === 'cancelled' ||
           (item.label_tr === 'Yeni' && item.label_en === 'New' && item.label_tr !== 'Yeni Müşteri');
};

/**
 * Check if a customer item is protected (cannot be deleted/updated)
 * @param {Object} item - Customer item object
 * @returns {boolean} Whether the customer item is protected
 */
export const isProtectedCustomerItem = (item) => {
    if (!item) return false;
    
    return item.isDefault || 
           item.id === 'system_new' ||
           (item.label_tr === 'Yeni' && item.label_en === 'New' && item.label_tr !== 'Yeni Müşteri');
};

/**
 * Check if an item is protected based on its category
 * @param {Object} paramType - Parameter type (category) object
 * @param {Object} item - Item object
 * @returns {boolean} Whether the item is protected
 */
export const isProtectedItem = (paramType, item) => {
    if (!paramType || !item) return false;
    
    const isStatusCategory = paramType.id === 'static_category_status' || paramType.label_tr === 'Durum';
    const isCustomerCategory = paramType.id === 'static_category_customer' || paramType.label_tr === 'Müşteri';
    
    if (isStatusCategory) {
        return isProtectedStatusItem(item);
    }
    
    if (isCustomerCategory) {
        return isProtectedCustomerItem(item);
    }
    
    return item.isDefault || false;
};

/**
 * Check if a category can be deleted
 * @param {Object} paramType - Parameter type object
 * @returns {boolean} Whether the category can be deleted
 */
export const canDeleteCategory = (paramType) => {
    return !isProtectedCategory(paramType);
};

/**
 * Check if an item can be deleted
 * @param {Object} paramType - Parameter type (category) object
 * @param {Object} item - Item object
 * @returns {boolean} Whether the item can be deleted
 */
export const canDeleteItem = (paramType, item) => {
    if (!paramType || !item) return true;
    
    // System items cannot be deleted
    if (item.type === 'system') return false;
    
    return !isProtectedItem(paramType, item);
};
