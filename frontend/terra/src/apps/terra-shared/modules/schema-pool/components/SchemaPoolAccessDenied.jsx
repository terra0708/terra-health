import React, { memo } from 'react';
import { Box, Typography, Paper, useTheme, alpha } from '@mui/material';
import { ShieldX } from 'lucide-react';

/**
 * Schema Pool Access Denied Empty State Component
 * Shows when SYSTEM tenant validation fails (403 error)
 * 
 * Provides a user-friendly message explaining that this area
 * can only be accessed through the System Management Center.
 */
export const SchemaPoolAccessDenied = memo(({ t }) => {
    const theme = useTheme();
    
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                p: 4
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: 6,
                    borderRadius: '24px',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    background: theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.paper, 0.8)
                        : '#ffffff',
                    textAlign: 'center',
                    maxWidth: 500
                }}
            >
                <Box
                    sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                        color: theme.palette.error.main,
                        mx: 'auto',
                        mb: 3
                    }}
                >
                    <ShieldX size={40} />
                </Box>
                
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                    {t('schema_pool.access_denied')}
                </Typography>
                
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                    {t('schema_pool.access_denied_message')}
                </Typography>
                
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                    {t('schema_pool.access_denied_subtitle')}
                </Typography>
            </Paper>
        </Box>
    );
});

SchemaPoolAccessDenied.displayName = 'SchemaPoolAccessDenied';
