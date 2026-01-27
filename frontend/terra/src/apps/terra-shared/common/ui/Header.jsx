import { AppBar, Toolbar, Box, Avatar, IconButton, Divider, Tooltip, useTheme, alpha, useMediaQuery, Typography } from '@mui/material';
import { LogOut, Menu } from 'lucide-react';
import { SettingsSwitchers } from '@common/ui';
import useAuthStore from '@shared/modules/auth/hooks/useAuthStore';
import { useSettingsStore } from '@core';
import { useTranslation } from 'react-i18next';
import NotificationCenter from '@shared/modules/notifications/NotificationCenter';

/**
 * Uygulamanın ana Header bileşeni.
 * Güvenirliği artırmak için kontrol butonlarında Lucide ikonlarına dönüldü, 
 * ancak premium hover efektleri korundu.
 */
const Header = ({ onLogout }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const user = useAuthStore((state) => state.user);
    const { toggleSidebar } = useSettingsStore();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const primaryHex = theme.palette.primary.main;
    const secondaryHex = theme.palette.secondary.main;

    // Build user full name from firstName and lastName
    const userFullName = user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.firstName || user?.lastName || user?.email || t('common.user_placeholder');

    // Get display role from roles array
    // Priority: ROLE_SUPER_ADMIN > ROLE_TENANT_ADMIN > ROLE_AGENT > first role
    const getDisplayRole = () => {
        if (!user?.roles || user.roles.length === 0) {
            return t('common.admin');
        }

        // Role priority mapping
        if (user.roles.includes('ROLE_SUPER_ADMIN')) {
            return t('common.admin'); // "Yönetici"
        }
        if (user.roles.includes('ROLE_TENANT_ADMIN')) {
            return t('common.admin'); // "Yönetici"
        }
        if (user.roles.includes('ROLE_AGENT')) {
            return t('users.roles.staff') || 'Personel';
        }

        // Return first role, removing ROLE_ prefix and formatting
        const firstRole = user.roles[0];
        if (firstRole.startsWith('ROLE_')) {
            // Try to get translation, fallback to formatted role name
            const roleKey = firstRole.replace('ROLE_', '').toLowerCase();
            return t(`users.roles.${roleKey}`, firstRole.replace('ROLE_', '').replace('_', ' '));
        }
        return firstRole;
    };

    const displayRole = getDisplayRole();

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(12px)',
                borderBottom: `1px solid ${theme.palette.divider}`,
                color: theme.palette.text.primary,
                zIndex: (theme) => isMobile ? theme.zIndex.drawer - 1 : theme.zIndex.drawer + 1
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 4 } }}>
                {/* SOL TARAF - HAMBURGER */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {isMobile && (
                        <IconButton
                            onClick={(e) => {
                                toggleSidebar();
                                e.currentTarget.blur();
                            }}
                            sx={{
                                width: 40,
                                height: 40,
                                color: 'primary.main',
                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    transform: 'scale(1.1)'
                                }
                            }}
                        >
                            <Menu size={22} />
                        </IconButton>
                    )}
                </Box>

                {/* SAĞ TARAF - AYARLAR & PROFIL */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2.5 } }}>
                    <SettingsSwitchers />
                    <NotificationCenter />

                    <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 24, alignSelf: 'center', opacity: 0.5, display: { xs: 'none', sm: 'block' } }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
                        <Box sx={{ display: { xs: 'none', lg: 'block' }, textAlign: 'right' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                                {userFullName}
                            </Typography>
                            <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 10 }}>
                                {displayRole}
                            </Typography>
                        </Box>

                        <Tooltip title={t('common.profile')}>
                            <Avatar
                                sx={{
                                    width: { xs: 36, sm: 42 },
                                    height: { xs: 36, sm: 42 },
                                    background: theme.palette.mode === 'light'
                                        ? 'linear-gradient(135deg, #f0e7ff 0%, #e0faff 100%)'
                                        : 'linear-gradient(135deg, #2a1b3d 0%, #1a2c3a 100%)',
                                    cursor: 'pointer',
                                    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                    transition: 'all 0.3s ease',
                                    '&:hover': { transform: 'scale(1.05)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
                                }}
                            >
                                <lord-icon
                                    src="https://cdn.lordicon.com/rzsnbiaw.json"
                                    trigger="hover"
                                    colors={`primary:${primaryHex},secondary:${secondaryHex}`}
                                    style={{ width: isMobile ? '26px' : '30px', height: isMobile ? '26px' : '30px' }}
                                />
                            </Avatar>
                        </Tooltip>

                        <Tooltip title={t('common.logout')}>
                            <IconButton
                                onClick={onLogout}
                                sx={{
                                    width: { xs: 36, sm: 42 },
                                    height: { xs: 36, sm: 42 },
                                    borderRadius: 2.5,
                                    bgcolor: alpha(theme.palette.error.main, 0.05),
                                    color: 'error.main',
                                    border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                        bgcolor: 'error.main',
                                        color: 'white',
                                        transform: 'translateY(-2px)',
                                        boxShadow: `0 6px 20px ${alpha(theme.palette.error.main, 0.3)}`
                                    }
                                }}
                            >
                                <LogOut size={isMobile ? 18 : 20} strokeWidth={2.5} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header;
