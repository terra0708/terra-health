/**
 * Check if migration is needed for reminder settings
 * @param {Object} settings - Reminder settings store
 * @returns {Object} Migration check results
 */
export const checkMigrationNeeded = (settings) => {
    const customParameterTypes = settings.customParameterTypes || [];
    
    // Check if Status category exists
    const hasStatusCategory = customParameterTypes.some(pt => 
        pt.id === 'static_category_status' || 
        (pt.isCategory && (pt.label_tr === 'Durum' || pt.label_en === 'Status'))
    );
    
    // Check if Customer category exists
    const hasCustomerCategory = customParameterTypes.some(pt => 
        pt.id === 'static_category_customer' || 
        (pt.isCategory && (pt.label_tr === 'Müşteri' || pt.label_en === 'Customer'))
    );
    
    // Find Customer category
    const customerCategory = customParameterTypes.find(pt => 
        pt.id === 'static_category_customer' || 
        (pt.isCategory && (pt.label_tr === 'Müşteri' || pt.label_en === 'Customer'))
    );
    
    // Check for old customer reminder item (should be removed)
    const hasOldCustomerReminder = customerCategory?.data?.some(item => 
        item.id === 'system_customer_reminder' || item.label_tr === 'Müşteri Hatırlatıcısı'
    );
    
    // Check if "Yeni" (default) exists in Customer category
    const hasNew = customerCategory?.data?.some(item => 
        item.id === 'system_new' || 
        (item.label_tr === 'Yeni' && item.label_en === 'New' && item.label_tr !== 'Yeni Müşteri')
    );
    
    // Check if "Yeni Müşteri" exists in Customer category
    const hasNewCustomer = customerCategory?.data?.some(item => 
        item.label_tr === 'Yeni Müşteri' || item.label_en === 'New Customer'
    );
    
    // Check if System category exists (should be removed)
    const hasSystemCategory = customParameterTypes.some(pt => 
        pt.id === 'static_category_system' || 
        (pt.isCategory && (pt.label_tr === 'Sistem' || pt.label_en === 'System'))
    );
    
    return {
        hasStatusCategory,
        hasCustomerCategory,
        hasOldCustomerReminder,
        hasNew,
        hasNewCustomer,
        hasSystemCategory
    };
};

/**
 * Check if migration should run
 * @param {string} migrationKey - Migration key for localStorage
 * @param {Object} migrationChecks - Results from checkMigrationNeeded
 * @returns {boolean} Whether migration should run
 */
export const shouldRunMigration = (migrationKey, migrationChecks) => {
    const migrationCompleted = localStorage.getItem(migrationKey);
    
    return !migrationCompleted || 
           !migrationChecks.hasStatusCategory || 
           !migrationChecks.hasCustomerCategory || 
           migrationChecks.hasOldCustomerReminder || 
           !migrationChecks.hasNew || 
           !migrationChecks.hasNewCustomer || 
           migrationChecks.hasSystemCategory;
};
