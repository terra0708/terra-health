import { styled, useTheme } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, Box, Divider, Typography, useMediaQuery } from '@mui/material';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@core';
import { useNavigate, useLocation } from 'react-router-dom';

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
    ads: 'https://cdn.lordicon.com/wyaqzesp.json',
    statistics: 'https://cdn.lordicon.com/sqqsmbzs.json',
    notifications: 'https://cdn.lordicon.com/zyylfmfm.json',
    users: 'https://cdn.lordicon.com/ntfaoelc.json',
    permissions: 'https://cdn.lordicon.com/ojgowmvw.json',
    settings: 'https://cdn.lordicon.com/eduzjjfi.json',
    logo: 'https://cdn.lordicon.com/qlrjanhh.json',
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

const Sidebar = () => {
    const { t } = useTranslation();
    const theme = useTheme();
    const { sidebarOpen, toggleSidebar } = useSettingsStore();
    const location = useLocation();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const primaryHex = theme.palette.primary.main;
    const secondaryHex = theme.palette.secondary.main;

    const menuItems = [
        { key: 'dashboard', icon: 'dashboard', label: t('menu.dashboard'), path: '/' },
        { key: 'appointments', icon: 'appointments', label: t('menu.appointments'), path: '/appointments' },
        { key: 'customers', icon: 'customers', label: t('menu.customers'), path: '/customers' },
        { key: 'ads', icon: 'ads', label: t('menu.ads'), path: '/ads' },
        { key: 'statistics', icon: 'statistics', label: t('menu.statistics'), path: '/statistics' },
        { key: 'notifications', icon: 'notifications', label: t('menu.notifications'), path: '/notifications' },
        { key: 'users', icon: 'users', label: t('menu.users'), path: '/users' },
        { key: 'permissions', icon: 'permissions', label: t('menu.permissions'), path: '/permissions' },
        { key: 'settings', icon: 'settings', label: t('menu.settings'), path: '/settings' },
    ];

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
                disableEnforceFocus
                disableRestoreFocus
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
