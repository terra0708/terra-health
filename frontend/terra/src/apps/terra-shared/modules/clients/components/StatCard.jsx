import React from 'react';
import { Box, Typography, Paper, alpha, useTheme } from '@mui/material';

export const StatCard = ({ icon: Icon, title, value, color }) => {
    const theme = useTheme();

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: '24px',
                border: `1px solid ${theme.palette.divider}`,
                background: `linear-gradient(135deg, ${alpha(color, 0.02)} 0%, ${alpha(color, 0.06)} 100%)`,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 28px ${alpha(color, 0.15)}`,
                    border: `1px solid ${alpha(color, 0.2)}`,
                }
            }}
        >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box
                    sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '16px',
                        bgcolor: alpha(color, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        color: color,
                    }}
                >
                    <Icon size={28} strokeWidth={2.5} />
                </Box>
                <Typography
                    variant="caption"
                    sx={{
                        color: 'text.secondary',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontSize: '0.7rem',
                    }}
                >
                    {title}
                </Typography>
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 900,
                        color: 'text.primary',
                        mt: 0.5,
                        letterSpacing: '-0.03em',
                    }}
                >
                    {value}
                </Typography>
            </Box>
            <Box
                sx={{
                    position: 'absolute',
                    right: -20,
                    bottom: -20,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    bgcolor: alpha(color, 0.04),
                    zIndex: 0,
                }}
            />
        </Paper>
    );
};
