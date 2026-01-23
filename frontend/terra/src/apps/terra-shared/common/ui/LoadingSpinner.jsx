import React from 'react';
import { Box, CircularProgress, Typography, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Loading Spinner Component
 * 
 * Standart loading spinner - küçük ve büyük varyantları
 * Modüler yapıya uygun - her modül kendi loading state'ini kullanabilir
 */
const LoadingSpinner = ({ 
    size = 40, 
    message, 
    fullScreen = false,
    overlay = false,
    color = 'primary',
    'aria-label': ariaLabel
}) => {
    const { t } = useTranslation();
    const loadingMessage = message || t('common.loading', 'Yükleniyor...');
    const label = ariaLabel || loadingMessage;

    const content = (
        <Stack spacing={2} alignItems="center" justifyContent="center">
            <CircularProgress 
                size={size} 
                color={color}
                aria-label={label}
                role="status"
            />
            {message && (
                <Typography variant="body2" color="text.secondary" id="loading-message">
                    {message}
                </Typography>
            )}
        </Stack>
    );

    if (fullScreen) {
        return (
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: overlay ? 'rgba(0, 0, 0, 0.5)' : 'background.default',
                    zIndex: 9999
                }}
                role="status"
                aria-live="polite"
                aria-busy="true"
                aria-label={label}
            >
                {content}
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4,
                minHeight: overlay ? '100%' : '200px'
            }}
            role="status"
            aria-live="polite"
            aria-busy="true"
            aria-label={label}
        >
            {content}
        </Box>
    );
};

export default LoadingSpinner;
