import React, { memo } from 'react';
import { Box, Typography, Paper, useTheme, alpha } from '@mui/material';

export const StatCard = memo(({ icon: Icon, title, value, color }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    return (
        <Paper elevation={0} sx={{
            p: 3,
            borderRadius: '24px',
            border: `1px solid ${alpha(color, isDark ? 0.2 : 0.1)}`,
            background: isDark
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(color, 0.05)} 100%)`
                : `linear-gradient(135deg, #ffffff 0%, ${alpha(color, 0.02)} 100%)`,
            display: 'flex', alignItems: 'center', gap: 3, transition: 'all 0.3s ease',
            '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: isDark ? `0 10px 30px ${alpha('#000', 0.4)}` : `0 10px 30px ${alpha(color, 0.08)}`
            }
        }}>
            <Box sx={{ width: 56, height: 56, borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(color, 0.08), color: color }}>
                <Icon size={28} />
            </Box>
            <Box>
                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.1em', display: 'block' }}>{title}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary' }}>{value}</Typography>
            </Box>
        </Paper>
    );
});
