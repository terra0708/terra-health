import { Box, Container, useMediaQuery, useTheme } from '@mui/material';
import { Sidebar, Header } from '@common/ui';
import { Outlet } from 'react-router-dom';
import useAuthStore from '../modules/auth/hooks/useAuthStore';
import React from 'react';
import { useSettingsStore } from '@core';
import { useTranslation } from 'react-i18next';

const MainLayout = () => {
    const logout = useAuthStore((state) => state.logout);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { language } = useSettingsStore();
    const { i18n } = useTranslation();

    // Dil senkronizasyonu
    React.useEffect(() => {
        if (language && i18n.language !== language) {
            i18n.changeLanguage(language);
        }
    }, [language, i18n]);

    return (
        <Box sx={{ display: 'flex', width: '100%', overflowX: 'hidden' }}>
            <Sidebar />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'background.default',
                    transition: 'all 0.3s ease',
                    width: '100%',
                    maxWidth: '100%',
                    overflowX: 'hidden' // Sağa sola kaydırmayı engellemek için
                }}
            >
                <Header onLogout={logout} />
                <Container
                    maxWidth="xl"
                    sx={{
                        mt: { xs: 2, sm: 4 },
                        mb: { xs: 2, sm: 4 },
                        px: { xs: 2, sm: 3 },
                        flexGrow: 1,
                        width: '100%',
                        overflowX: 'hidden'
                    }}
                >
                    <Outlet />
                </Container>
            </Box>
        </Box>
    );
};

export default MainLayout;
