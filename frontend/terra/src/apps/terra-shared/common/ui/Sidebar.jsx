import { useState } from 'react';
import { styled, useTheme, alpha } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, Box, Divider, Typography, useMediaQuery, Collapse } from '@mui/material';
import { ChevronLeft, ChevronRight, X, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@core';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '@shared/store/authStore';

const drawerWidth = 260;

const openedMixin = (theme) => ({
    width: drawerWidth,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
    borderRight: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
});

const closedMixin = (theme) => ({
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up('sm')]: {
        width: `calc(${theme.spacing(8)} + 1px)`,
    },
    borderRight: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
});

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
}));

const DesktopDrawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme }) => ({
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        variants: [
            {
                props: ({ open }) => open,
                style: {
                    ...openedMixin(theme),
                    '& .MuiDrawer-paper': openedMixin(theme),
                },
            },
            {
                props: ({ open }) => !open,
                style: {
                    ...closedMixin(theme),
                    '& .MuiDrawer-paper': closedMixin(theme),
                },
            },
        ],
    }),
);

// Wired Gradient Icons
const ICON_DATA = {
    dashboard: 'https://cdn.lordicon.com/jgeruqwm.json',
    appointments: 'https://cdn.lordicon.com/aksvbzmu.json',
    customers: 'https://cdn.lordicon.com/eaivqdbn.json',
    reminders: 'https://cdn.lordicon.com/pkmkagva.json',
    marketing: 'https://cdn.lordicon.com/wyaqzesp.json',
    statistics: 'https://cdn.lordicon.com/sqqsmbzs.json',
    notifications: 'https://cdn.lordicon.com/zyylfmfm.json',
    users: 'https://cdn.lordicon.com/ntfaoelc.json',
    permissions: 'https://cdn.lordicon.com/ojgowmvw.json',
    settings: 'https://cdn.lordicon.com/eduzjjfi.json',
    system_settings: 'https://cdn.lordicon.com/itwlmliw.json',
    customer_panel: 'https://cdn.lordicon.com/hfftmgac.json',
    logo: 'https://cdn.lordicon.com/qlrjanhh.json',
    tenants: 'https://cdn.lordicon.com/itwlmliw.json', // Building/Organization icon (same as system_settings)
    user_search: 'https://cdn.lordicon.com/ntfaoelc.json',
    schema_pool: 'https://cdn.lordicon.com/wyaqzesp.json',
    audit_logs: 'https://cdn.lordicon.com/ojgowmvw.json',
};

const NavItem = ({ icon, text, open, active, path, onClick }) => {
    const theme = useTheme();
    const navigate = useNavigate();

    const secondaryColor = active ? theme.palette.secondary.main : theme.palette.text.secondary;
    const activeColor = theme.palette.mode === 'light' ? '#7c3aed' : '#c084fc';

    const handleClick = () => {
        navigate(path);
        if (onClick) onClick();
    };

    return (
        <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
                onClick={handleClick}
                sx={[
                    {
                        minHeight: 52,
                        px: 2.5,
                        mx: 1.5,
                        borderRadius: 3,
                        mb: 0.8,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    },
                    open ? { justifyContent: 'initial' } : { justifyContent: 'center' },
                    active && {
                        bgcolor: (theme) =>
                            theme.palette.mode === 'light'
                                ? 'rgba(162, 89, 255, 0.04)'
                                : 'rgba(162, 89, 255, 0.12)',
                        color: activeColor,
                        '&:hover': {
                            bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(162, 89, 255, 0.08)' : 'rgba(162, 89, 255, 0.18)',
                        }
                    }
                ]}
            >
                <ListItemIcon
                    sx={[
                        {
                            minWidth: 0,
                            justifyContent: 'center',
                        },
                        open ? { mr: 2.5 } : { mr: 'auto' },
                    ]}
                >
                    <Box sx={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <lord-icon
                            src={ICON_DATA[icon]}
                            trigger={active ? 'loop' : 'hover'}
                            colors={`primary:${active ? activeColor : theme.palette.text.secondary},secondary:${secondaryColor}`}
                            stroke="bold"
                            style={{ width: '34px', height: '34px' }}
                        />
                    </Box>
                </ListItemIcon>
                <ListItemText
                    primary={text}
                    sx={[
                        open ? { opacity: 1 } : { opacity: 0 },
                        {
                            '& .MuiTypography-root': {
                                fontWeight: active ? 700 : 500,
                                fontSize: '0.9rem',
                                color: active ? activeColor : 'inherit'
                            }
                        }
                    ]}
                />
            </ListItemButton>
        </ListItem>
    );
};

const DropdownNavItem = ({ icon, text, open, subItems, currentPath, onClick }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const isAnySubItemActive = subItems.some(item => currentPath === item.path);
    const [expanded, setExpanded] = useState(isAnySubItemActive);

    const activeColor = theme.palette.mode === 'light' ? '#7c3aed' : '#c084fc';
    const secondaryColor = isAnySubItemActive ? theme.palette.secondary.main : theme.palette.text.secondary;

    const handleToggle = () => {
        setExpanded(!expanded);
    };

    const handleSubItemClick = (path) => {
        navigate(path);
        if (onClick) onClick();
    };

    return (
        <>
            <ListItem disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                    onClick={handleToggle}
                    sx={[
                        {
                            minHeight: 52,
                            px: 2.5,
                            mx: 1.5,
                            borderRadius: 3,
                            mb: 0.8,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        },
                        open ? { justifyContent: 'initial' } : { justifyContent: 'center' },
                        isAnySubItemActive && {
                            bgcolor: (theme) =>
                                theme.palette.mode === 'light'
                                    ? 'rgba(162, 89, 255, 0.04)'
                                    : 'rgba(162, 89, 255, 0.12)',
                            color: activeColor,
                            '&:hover': {
                                bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(162, 89, 255, 0.08)' : 'rgba(162, 89, 255, 0.18)',
                            }
                        }
                    ]}
                >
                    <ListItemIcon
                        sx={[
                            {
                                minWidth: 0,
                                justifyContent: 'center',
                            },
                            open ? { mr: 2.5 } : { mr: 'auto' },
                        ]}
                    >
                        <Box sx={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <lord-icon
                                src={ICON_DATA[icon]}
                                trigger={isAnySubItemActive ? 'loop' : 'hover'}
                                colors={`primary:${isAnySubItemActive ? activeColor : theme.palette.text.secondary},secondary:${secondaryColor}`}
                                stroke="bold"
                                style={{ width: '34px', height: '34px' }}
                            />
                        </Box>
                    </ListItemIcon>
                    <ListItemText
                        primary={text}
                        sx={[
                            open ? { opacity: 1 } : { opacity: 0 },
                            {
                                '& .MuiTypography-root': {
                                    fontWeight: isAnySubItemActive ? 700 : 500,
                                    fontSize: '0.9rem',
                                    color: isAnySubItemActive ? activeColor : 'inherit'
                                }
                            }
                        ]}
                    />
                    {open && (
                        <ChevronDown
                            size={18}
                            style={{
                                transition: 'transform 0.3s ease',
                                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                color: theme.palette.text.secondary
                            }}
                        />
                    )}
                </ListItemButton>
            </ListItem>

            {open && (
                <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {subItems.map((subItem) => {
                            const isActive = currentPath === subItem.path;
                            return (
                                <ListItem key={subItem.key} disablePadding sx={{ display: 'block' }}>
                                    <ListItemButton
                                        onClick={() => handleSubItemClick(subItem.path)}
                                        sx={{
                                            minHeight: 44,
                                            pl: 4,
                                            pr: 2.5,
                                            mx: 1.5,
                                            borderRadius: 3,
                                            mb: 0.5,
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            ...(isActive && {
                                                bgcolor: (theme) =>
                                                    theme.palette.mode === 'light'
                                                        ? 'rgba(162, 89, 255, 0.08)'
                                                        : 'rgba(162, 89, 255, 0.15)',
                                                color: activeColor,
                                                '&:hover': {
                                                    bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(162, 89, 255, 0.12)' : 'rgba(162, 89, 255, 0.2)',
                                                }
                                            })
                                        }}
                                    >
                                        <ListItemIcon
                                            sx={{
                                                minWidth: 0,
                                                mr: 2,
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Box sx={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <lord-icon
                                                    src={ICON_DATA[subItem.icon]}
                                                    trigger={isActive ? 'loop' : 'hover'}
                                                    colors={`primary:${isActive ? activeColor : theme.palette.text.secondary},secondary:${isActive ? theme.palette.secondary.main : theme.palette.text.secondary}`}
                                                    stroke="bold"
                                                    style={{ width: '26px', height: '26px' }}
                                                />
                                            </Box>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={subItem.label}
                                            sx={{
                                                '& .MuiTypography-root': {
                                                    fontWeight: isActive ? 600 : 500,
                                                    fontSize: '0.85rem',
                                                    color: isActive ? activeColor : 'inherit'
                                                }
                                            }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                    </List>
                </Collapse>
            )}
        </>
    );
};

const Sidebar = () => {
    const { t } = useTranslation();
    const theme = useTheme();
    const { sidebarOpen, toggleSidebar } = useSettingsStore();
    const location = useLocation();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const user = useAuthStore((state) => state.user);
    const hasPermission = useAuthStore((state) => state.hasPermission);

    // Check if user is Super Admin
    const isSuperAdmin = user?.roles?.includes('ROLE_SUPER_ADMIN') || false;

    const primaryHex = theme.palette.primary.main;
    const secondaryHex = theme.palette.secondary.main;

    // Normal user menu items with required permissions (Module or View)
    const normalUserMenuItems = [
        { key: 'dashboard', icon: 'dashboard', label: t('menu.dashboard'), path: '/', requiredPermission: ['DASHBOARD_VIEW', 'MODULE_DASHBOARD'] },
        { key: 'appointments', icon: 'appointments', label: t('menu.appointments'), path: '/appointments', requiredPermission: ['APPOINTMENTS_VIEW', 'MODULE_APPOINTMENTS'] },
        { key: 'customers', icon: 'customers', label: t('menu.customers'), path: '/customers', requiredPermission: ['CUSTOMERS_VIEW', 'MODULE_CUSTOMERS'] },
        { key: 'reminders', icon: 'reminders', label: t('menu.reminders'), path: '/reminders', requiredPermission: ['REMINDERS_VIEW', 'MODULE_REMINDERS'] },
        { key: 'statistics', icon: 'statistics', label: t('menu.statistics'), path: '/statistics', requiredPermission: ['STATISTICS_VIEW', 'MODULE_STATISTICS'] },
        { key: 'notifications', icon: 'notifications', label: t('menu.notifications'), path: '/notifications', requiredPermission: ['NOTIFICATIONS_VIEW', 'MODULE_NOTIFICATIONS'] },
    ];

    // Super Admin menu items with granular permissions
    const superAdminMenuItems = [
        { key: 'super_dashboard', icon: 'dashboard', label: t('menu.super_admin.dashboard', 'Dashboard'), path: '/super-admin/dashboard', requiredPermission: ['MODULE_SUPERADMIN'] },
        { key: 'tenants', icon: 'tenants', label: t('menu.super_admin.tenants', 'Tenants'), path: '/super-admin/tenants', requiredPermission: ['SUPERADMIN_TENANTS_VIEW', 'MODULE_SUPERADMIN'] },
        { key: 'user_search', icon: 'user_search', label: t('menu.super_admin.user_search', 'User Search'), path: '/super-admin/users/search', requiredPermission: ['SUPERADMIN_USER_SEARCH_VIEW', 'MODULE_SUPERADMIN'] },
        { key: 'schema_pool', icon: 'schema_pool', label: t('menu.super_admin.schema_pool', 'Schema Pool'), path: '/super-admin/schema-pool', requiredPermission: ['SUPERADMIN_SCHEMAPOOL_VIEW', 'MODULE_SUPERADMIN'] },
        { key: 'audit_logs', icon: 'audit_logs', label: t('menu.super_admin.audit_logs', 'System Logs'), path: '/super-admin/audit-logs', requiredPermission: ['SUPERADMIN_AUDIT_VIEW', 'MODULE_SUPERADMIN'] },
    ];

    // Filter menu items based on permissions
    // CRITICAL: Super Admin bypass is now handled in authStore.hasPermission()
    const menuItems = (isSuperAdmin ? superAdminMenuItems : normalUserMenuItems).filter(item => {
        if (!item.requiredPermission) return true;
        const hasPerm = hasPermission(item.requiredPermission);
        
        // DEBUG: Log permission checks for troubleshooting
        if (process.env.NODE_ENV === 'development') {
            const matchedPermissions = item.requiredPermission?.filter(p => user?.permissions?.includes(p)) || [];
            console.debug(`[Sidebar] Menu item "${item.key}": hasPermission(${JSON.stringify(item.requiredPermission)}) = ${hasPerm}`, {
                userPermissions: user?.permissions,
                requiredPermission: item.requiredPermission,
                matchedPermissions: matchedPermissions,
                userPermissionsCount: user?.permissions?.length || 0
            });
        }
        
        return hasPerm;
    });

    // CRITICAL: Filter sub-items FIRST, then check if dropdown should be visible
    // Marketing dropdown - MODULE_MARKETING kontrolü + Empty State
    const hasMarketingModule = hasPermission(['MODULE_MARKETING']);
    const marketingDropdown = {
        key: 'marketing',
        icon: 'marketing',
        label: t('ads.title'),
        subItems: [
            { key: 'marketing_dashboard', icon: 'dashboard', label: t('ads.dashboard'), path: '/marketing/dashboard', requiredPermission: ['MARKETING_DASHBOARD'] },
            { key: 'marketing_campaigns', icon: 'statistics', label: t('ads.campaigns'), path: '/marketing/campaigns', requiredPermission: ['MARKETING_CAMPAIGNS'] },
            { key: 'marketing_attribution', icon: 'customer_panel', label: t('ads.attribution'), path: '/marketing/attribution', requiredPermission: ['MARKETING_ATTRIBUTION'] },
        ].filter(item => hasPermission(item.requiredPermission))
    };

    // Settings dropdown - MODULE_SETTINGS kontrolü + Empty State
    const hasSettingsModule = hasPermission(['MODULE_SETTINGS']);
    const settingsDropdown = {
        key: 'settings',
        icon: 'settings',
        label: t('menu.settings'),
        subItems: [
            { key: 'users', icon: 'users', label: t('menu.users'), path: '/settings/users', requiredPermission: ['SETTINGS_USERS'] },
            { key: 'permissions', icon: 'permissions', label: t('menu.permissions'), path: '/settings/permissions', requiredPermission: ['SETTINGS_PERMISSIONS'] },
            { key: 'reminder_settings', icon: 'settings', label: t('settings.reminder_settings', 'Hatırlatıcı Ayarları'), path: '/settings/reminders', requiredPermission: ['SETTINGS_REMINDERS'] },
            { key: 'system_settings', icon: 'system_settings', label: t('menu.system_settings'), path: '/settings', requiredPermission: ['SETTINGS_SYSTEM'] },
            { key: 'customer_panel', icon: 'customer_panel', label: t('menu.customer_panel'), path: '/settings/customer-panel', requiredPermission: ['SETTINGS_CUSTOMER_PANEL'] },
        ].filter(item => hasPermission(item.requiredPermission))
    };

    const sidebarHeader = (
        <DrawerHeader sx={{
            px: 2,
            py: isMobile ? 3 : 2,
            justifyContent: 'space-between',
            minHeight: isMobile ? 80 : 64
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{
                    width: isMobile ? 36 : 32,
                    height: isMobile ? 36 : 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <lord-icon
                        src={ICON_DATA.logo}
                        trigger="hover"
                        colors={`primary:${primaryHex},secondary:${secondaryHex}`}
                        style={{ width: isMobile ? '36px' : '32px', height: isMobile ? '36px' : '32px' }}
                    />
                </Box>
                <Typography
                    variant="h6"
                    noWrap
                    sx={{
                        fontWeight: 900,
                        letterSpacing: -1,
                        fontSize: isMobile ? '1.15rem' : '1.2rem',
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        lineHeight: 1
                    }}>
                    TERRA HEALTH
                </Typography>
            </Box>

            <IconButton onClick={(e) => { toggleSidebar(); e.currentTarget.blur(); }} sx={{
                color: 'text.secondary',
                ml: 'auto',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'rotate(90deg)', color: 'primary.main' }
            }}>
                {isMobile ? <X size={24} /> : <ChevronLeft size={20} />}
            </IconButton>
        </DrawerHeader>
    );

    const content = (
        <>
            {(sidebarOpen || isMobile) ? sidebarHeader : (
                <DrawerHeader sx={{ justifyContent: 'center' }}>
                    <IconButton onClick={(e) => { toggleSidebar(); e.currentTarget.blur(); }} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', transform: 'scale(1.2)' } }}>
                        <ChevronRight size={20} />
                    </IconButton>
                </DrawerHeader>
            )}

            <Divider sx={{ opacity: mode => mode === 'light' ? 0.3 : 0.1, mb: 2 }} />

            {/* CRITICAL: Global Empty State - User has no module permissions */}
            {/* Check if user has absolutely no menu items (no modules assigned) */}
            {menuItems.length === 0 && 
             (!isSuperAdmin && marketingDropdown.subItems.length === 0 && settingsDropdown.subItems.length === 0) && (
                <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
                    <Box sx={{
                        width: 64,
                        height: 64,
                        mx: 'auto',
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        background: theme => theme.palette.mode === 'light'
                            ? `linear-gradient(135deg, ${alpha(primaryHex, 0.1)} 0%, ${alpha(secondaryHex, 0.1)} 100%)`
                            : `linear-gradient(135deg, ${alpha(primaryHex, 0.2)} 0%, ${alpha(secondaryHex, 0.2)} 100%)`,
                        border: `2px solid ${alpha(primaryHex, 0.2)}`
                    }}>
                        <lord-icon
                            src="https://cdn.lordicon.com/tdrtiskw.json"
                            trigger="loop"
                            colors={`primary:${primaryHex},secondary:${secondaryHex}`}
                            style={{ width: '40px', height: '40px' }}
                        />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                        {t('sidebar.no_permissions', 'Yetki Bulunamadı')}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
                        {t('sidebar.contact_admin', 'Yöneticinizle iletişime geçin')}
                    </Typography>
                </Box>
            )}

            <List sx={{ px: 0 }}>
                {menuItems.map((item) => (
                    <NavItem
                        key={item.key}
                        icon={item.icon}
                        text={item.label}
                        open={isMobile ? true : sidebarOpen}
                        active={location.pathname === item.path}
                        path={item.path}
                        onClick={isMobile ? toggleSidebar : undefined}
                    />
                ))}

                {/* CRITICAL: Super Admin should ONLY see Super Admin menu items */}
                {/* Do NOT show Marketing or Settings dropdowns for Super Admin */}
                {!isSuperAdmin && (
                    <>
                        {/* Marketing dropdown - CRITICAL: MODULE kontrolü + Empty State */}
                        {/* Dropdown sadece MODULE yetkisi VAR VE alt öğelerden en az biri görünürse gösterilir */}
                        {hasMarketingModule && marketingDropdown.subItems.length > 0 && (
                            <DropdownNavItem
                                key={marketingDropdown.key}
                                icon={marketingDropdown.icon}
                                text={marketingDropdown.label}
                                open={isMobile ? true : sidebarOpen}
                                subItems={marketingDropdown.subItems}
                                currentPath={location.pathname}
                                onClick={isMobile ? toggleSidebar : undefined}
                            />
                        )}

                        {/* Settings dropdown - CRITICAL: MODULE kontrolü + Empty State */}
                        {/* Dropdown sadece MODULE yetkisi VAR VE alt öğelerden en az biri görünürse gösterilir */}
                        {hasSettingsModule && settingsDropdown.subItems.length > 0 && (
                            <DropdownNavItem
                                key={settingsDropdown.key}
                                icon={settingsDropdown.icon}
                                text={settingsDropdown.label}
                                open={isMobile ? true : sidebarOpen}
                                subItems={settingsDropdown.subItems}
                                currentPath={location.pathname}
                                onClick={isMobile ? toggleSidebar : undefined}
                            />
                        )}
                    </>
                )}
            </List>

            <Box sx={{ flexGrow: 1 }} />

            {(sidebarOpen || isMobile) && (
                <Box sx={{
                    p: 2,
                    mb: 4,
                    mx: 2,
                    borderRadius: 3,
                    background: theme => theme.palette.mode === 'light'
                        ? 'linear-gradient(135deg, rgba(162, 89, 255, 0.05) 0%, rgba(0, 210, 255, 0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(162, 89, 255, 0.1) 0%, rgba(0, 210, 255, 0.1) 100%)',
                    border: '1px solid',
                    borderColor: 'divider',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <Box sx={{ position: 'absolute', top: -10, right: -10, width: 60, height: 60, background: 'radial-gradient(circle, rgba(162, 89, 255, 0.1) 0%, transparent 70%)' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                        {t('common.system_status')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981', boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary' }}>{t('common.live_panel')}</Typography>
                    </Box>
                </Box>
            )}
        </>
    );

    if (isMobile) {
        return (
            <MuiDrawer
                variant="temporary"
                open={sidebarOpen}
                onClose={toggleSidebar}
                ModalProps={{ keepMounted: true }}
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 5,
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none' },
                }}
            >
                {content}
            </MuiDrawer>
        );
    }

    return (
        <DesktopDrawer variant="permanent" open={sidebarOpen}>
            {content}
        </DesktopDrawer>
    );
};

export default Sidebar;
