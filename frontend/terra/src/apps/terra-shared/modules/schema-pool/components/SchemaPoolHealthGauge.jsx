import React, { memo, useMemo } from 'react';
import { Box, Typography, Paper, LinearProgress, useTheme, alpha } from '@mui/material';
import { Activity } from 'lucide-react';

/**
 * Schema Pool Health Gauge Component
 * Shows system health as a percentage based on readyCount/totalCount
 * 
 * Color logic:
 * - 100% Error (errorCount === totalCount): Red
 * - 50-99%: Yellow (warning)
 * - 0-49%: Green (success)
 */
export const SchemaPoolHealthGauge = memo(({ stats, t }) => {
    const theme = useTheme();
    
    if (!stats) return null;
    
    const { readyCount, errorCount, totalCount } = stats;
    
    const healthData = useMemo(() => {
        if (totalCount === 0) {
            return {
                percentage: 0,
                severity: 'info',
                color: theme.palette.info.main,
                label: t('schema_pool.no_provisioning_yet')
            };
        }
        
        // Calculate health percentage (readyCount / totalCount)
        const percentage = Math.round((readyCount / totalCount) * 100);
        
        // Determine severity based on error ratio
        const errorRatio = errorCount / totalCount;
        
        let severity, color;
        if (errorRatio === 1) {
            // 100% Error - Critical
            severity = 'error';
            color = theme.palette.error.main;
        } else if (errorRatio >= 0.5) {
            // 50-99% Error - Warning
            severity = 'warning';
            color = theme.palette.warning.main;
        } else {
            // 0-49% Error - Success
            severity = 'success';
            color = theme.palette.success.main;
        }
        
        return {
            percentage,
            severity,
            color,
            label: `${percentage}%`
        };
    }, [readyCount, errorCount, totalCount, theme, t]);
    
    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: '24px',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                background: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.background.paper, 0.8)
                    : '#ffffff'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(healthData.color, 0.1),
                    color: healthData.color
                }}>
                    <Activity size={24} />
                </Box>
                <Box>
                    <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.1em' }}>
                        {t('schema_pool.system_health')}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        {healthData.label}
                    </Typography>
                </Box>
            </Box>
            
            <LinearProgress
                variant="determinate"
                value={healthData.percentage}
                color={healthData.severity}
                sx={{
                    height: 8,
                    borderRadius: '4px',
                    bgcolor: alpha(healthData.color, 0.1),
                    '& .MuiLinearProgress-bar': {
                        borderRadius: '4px',
                        bgcolor: healthData.color
                    }
                }}
            />
            
            {totalCount > 0 && (
                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
                    {readyCount} / {totalCount} {t('schema_pool.ready').toLowerCase()}
                </Typography>
            )}
        </Paper>
    );
});

SchemaPoolHealthGauge.displayName = 'SchemaPoolHealthGauge';
