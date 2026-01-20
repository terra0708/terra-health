import React from 'react';
import { Card, Box, Stack, Typography, useTheme, alpha } from '@mui/material';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const MarketingStatCard = ({ title, value, icon: Icon, trend, trendValue, color, subtitle }) => {
    const theme = useTheme();
    return (
        <Card sx={{ p: 3, borderRadius: 4, height: '100%', position: 'relative', overflow: 'hidden', border: '1px solid', borderColor: alpha(color, 0.1) }}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.05 }}>
                <Icon size={100} color={color} />
            </Box>

            <Stack spacing={2}>
                <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(color, 0.1),
                    color: color
                }}>
                    <Icon size={24} />
                </Box>

                <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {title}
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                        {value}
                    </Typography>
                </Box>

                <Stack direction="row" alignItems="center" spacing={0.5}>
                    {trend === 'up' ? (
                        <ArrowUpRight size={18} color={theme.palette.success.main} />
                    ) : (
                        <ArrowDownRight size={18} color={theme.palette.error.main} />
                    )}
                    <Typography variant="caption" fontWeight={700} sx={{ color: trend === 'up' ? 'success.main' : 'error.main' }}>
                        {trendValue}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {subtitle || 'vs last month'}
                    </Typography>
                </Stack>
            </Stack>
        </Card>
    );
};

export default MarketingStatCard;
