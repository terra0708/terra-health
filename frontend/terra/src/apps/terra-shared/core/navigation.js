export const MODULE_ROUTES = [
    { key: 'dashboard', path: '/', permissions: ['DASHBOARD_VIEW', 'MODULE_DASHBOARD'] },
    { key: 'appointments', path: '/appointments', permissions: ['APPOINTMENTS_VIEW', 'MODULE_APPOINTMENTS'] },
    { key: 'customers', path: '/customers', permissions: ['CUSTOMERS_VIEW', 'MODULE_CUSTOMERS'] },
    { key: 'reminders', path: '/reminders', permissions: ['REMINDERS_VIEW', 'MODULE_REMINDERS'] },
    { key: 'marketing', path: '/marketing/dashboard', permissions: ['MARKETING_DASHBOARD', 'MODULE_MARKETING'] },
    { key: 'statistics', path: '/statistics', permissions: ['STATISTICS_VIEW', 'MODULE_STATISTICS'] },
    { key: 'notifications', path: '/notifications', permissions: ['NOTIFICATIONS_VIEW', 'MODULE_NOTIFICATIONS'] },
    { key: 'settings', path: '/settings', permissions: ['SETTINGS_SYSTEM', 'MODULE_SETTINGS'] },
    { key: 'users', path: '/settings/users', permissions: ['SETTINGS_USERS_VIEW', 'SETTINGS_USERS', 'MODULE_SETTINGS'] },
    { key: 'permissions', path: '/settings/permissions', permissions: ['SETTINGS_ROLES_VIEW', 'SETTINGS_PERMISSIONS', 'MODULE_SETTINGS'] },
];

export const findFirstAllowedPath = (hasPermission, isSuperAdmin = false) => {
    if (isSuperAdmin) return '/super-admin/schema-pool';

    const allowed = MODULE_ROUTES.find(route => hasPermission(route.permissions));
    return allowed ? allowed.path : '/forbidden';
};
