import React from 'react';
import { Box, Typography, Button, useTheme, Stack } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ShieldX } from 'lucide-react';

/**
 * ForbiddenPage - Professional "Access Denied" page
 * 
 * Displays when user tries to access a resource they don't have permission for.
 * Used for 403 errors from API or route-level permission checks.
 * 
 * CRITICAL: This route must NOT be wrapped in ProtectedRoute to avoid infinite redirect loops.
 */
const ForbiddenPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const primaryHex = theme.palette.primary.main;
    const secondaryHex = theme.palette.secondary.main;

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: theme.palette.mode === 'light'
                    ? `linear-gradient(135deg, ${alpha(primaryHex, 0.05)} 0%, ${alpha(secondaryHex, 0.05)} 100%)`
                    : `linear-gradient(135deg, ${alpha(primaryHex, 0.1)} 0%, ${alpha(secondaryHex, 0.1)} 100%)`,
                position: 'relative',
                overflow: 'hidden',
                p: { xs: 2, sm: 4 }
            }}
        >
            {/* Background decoration */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-20%',
                    width: '600px',
                    height: '600px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${alpha(primaryHex, 0.1)} 0%, transparent 70%)`,
                    filter: 'blur(60px)',
                    zIndex: 0
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    bottom: '-30%',
                    left: '-10%',
                    width: '500px',
                    height: '500px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${alpha(secondaryHex, 0.1)} 0%, transparent 70%)`,
                    filter: 'blur(60px)',
                    zIndex: 0
                }}
            />

            {/* Content */}
            <Stack
                spacing={4}
                alignItems="center"
                sx={{
                    position: 'relative',
                    zIndex: 1,
                    maxWidth: '600px',
                    textAlign: 'center'
                }}
            >
                {/* Icon */}
                <Box
                    sx={{
                        width: { xs: 120, sm: 150 },
                        height: { xs: 120, sm: 150 },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        background: theme.palette.mode === 'light'
                            ? `linear-gradient(135deg, ${alpha(primaryHex, 0.1)} 0%, ${alpha(secondaryHex, 0.1)} 100%)`
                            : `linear-gradient(135deg, ${alpha(primaryHex, 0.2)} 0%, ${alpha(secondaryHex, 0.2)} 100%)`,
                        border: `2px solid ${alpha(primaryHex, 0.2)}`,
                        mb: 2
                    }}
                >
                    <lord-icon
                        src="https://cdn.lordicon.com/tdrtiskw.json"
                        trigger="loop"
                        colors={`primary:${primaryHex},secondary:${secondaryHex}`}
                        style={{ width: '80px', height: '80px' }}
                    />
                </Box>

                {/* Title */}
                <Typography
                    variant="h3"
                    fontWeight={900}
                    sx={{
                        background: `linear-gradient(135deg, ${primaryHex} 0%, ${secondaryHex} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: { xs: '2rem', sm: '3rem' },
                        lineHeight: 1.2
                    }}
                >
                    {t('errors.access_denied', 'Erişim Engellendi')}
                </Typography>

                {/* Message */}
                <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{
                        fontWeight: 500,
                        fontSize: { xs: '1rem', sm: '1.25rem' },
                        lineHeight: 1.6,
                        maxWidth: '500px'
                    }}
                >
                    {t('errors.access_denied_message', 'Burası senin yetki sınırlarının dışında.')}
                </Typography>

                {/* Description */}
                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        opacity: 0.8,
                        maxWidth: '450px'
                    }}
                >
                    {t('errors.access_denied_description', 'Bu sayfayı veya kaynağı görüntülemek için gerekli izinlere sahip değilsiniz. Lütfen yöneticinizle iletişime geçin.')}
                </Typography>

                {/* Action Button */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<Home size={20} />}
                        onClick={() => navigate('/')}
                        sx={{
                            px: 4,
                            py: 1.5,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${primaryHex} 0%, ${secondaryHex} 100%)`,
                            fontWeight: 700,
                            textTransform: 'none',
                            fontSize: '1rem',
                            boxShadow: `0 4px 20px ${alpha(primaryHex, 0.3)}`,
                            '&:hover': {
                                boxShadow: `0 6px 30px ${alpha(primaryHex, 0.4)}`,
                                transform: 'translateY(-2px)',
                                transition: 'all 0.3s ease'
                            },
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {t('common.back_to_dashboard', "Dashboard'a Dön")}
                    </Button>
                </Stack>

                {/* Error Code */}
                <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{
                        mt: 4,
                        fontSize: '0.75rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        opacity: 0.6
                    }}
                >
                    {t('errors.error_code', 'Hata Kodu')}: 403
                </Typography>
            </Stack>
        </Box>
    );
};

export default ForbiddenPage;
