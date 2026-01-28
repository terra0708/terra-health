/**
 * Permission name → Frontend identifier mapping
 * Maps backend permission codes to frontend identifiers used in routing and UI
 */

export const PERMISSION_TO_FRONTEND_ID = {
    // MODULE permissions
    'MODULE_DASHBOARD': 'dashboard',
    'MODULE_APPOINTMENTS': 'appointments',
    'MODULE_CUSTOMERS': 'customers',
    'MODULE_REMINDERS': 'reminders',
    'MODULE_STATISTICS': 'statics',
    'MODULE_NOTIFICATIONS': 'notifications',
    'MODULE_MARKETING': 'marketing',
    'MODULE_SETTINGS': 'settings',
    
    // ACTION permissions - Dashboard
    'DASHBOARD_VIEW': 'dashboard',
    
    // ACTION permissions - Appointments
    'APPOINTMENTS_VIEW': 'appointments',
    
    // ACTION permissions - Customers
    'CUSTOMERS_VIEW': 'customers',
    
    // ACTION permissions - Reminders
    'REMINDERS_VIEW': 'reminders',
    
    // ACTION permissions - Statistics
    'STATISTICS_VIEW': 'statics',
    
    // ACTION permissions - Notifications
    'NOTIFICATIONS_VIEW': 'notifications',
    
    // ACTION permissions - Marketing (suffix-less naming)
    'MARKETING_DASHBOARD': 'marketing_dashboard',
    'MARKETING_CAMPAIGNS': 'marketing_campaigns',
    'MARKETING_ATTRIBUTION': 'marketing_attribution',
    
    // ACTION permissions - Settings (suffix-less naming)
    'SETTINGS_USERS': 'setting_user',
    'SETTINGS_PERMISSIONS': 'setting_permission',
    'SETTINGS_REMINDERS': 'setting_reminder_settings',
    'SETTINGS_SYSTEM': 'setting_system_settings',
    'SETTINGS_CUSTOMER_PANEL': 'setting_customer_panel',
};

/**
 * Get frontend identifier for a permission name
 * @param {string} permissionName - Backend permission name (e.g., 'SETTINGS_USERS')
 * @returns {string} Frontend identifier (e.g., 'setting_user')
 */
export const getFrontendIdentifier = (permissionName) => {
    return PERMISSION_TO_FRONTEND_ID[permissionName] || permissionName.toLowerCase();
};

/**
 * Check if a permission name maps to a frontend identifier
 * @param {string} permissionName - Backend permission name
 * @param {string} frontendId - Frontend identifier to check
 * @returns {boolean} True if permission maps to the frontend identifier
 */
export const matchesFrontendIdentifier = (permissionName, frontendId) => {
    return getFrontendIdentifier(permissionName) === frontendId;
};
