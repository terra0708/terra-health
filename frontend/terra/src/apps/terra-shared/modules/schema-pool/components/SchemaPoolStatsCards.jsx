import React, { memo } from 'react';
import { Grid, useTheme } from '@mui/material';
import { CheckCircle, AlertTriangle, AlertCircle, Users, Database } from 'lucide-react';
import { StatCard } from '@shared/modules/users/components/StatCard';

/**
 * Schema Pool Statistics Cards Component
 * Displays 4 cards: READY, ASSIGNED, ERROR, TOTAL
 * 
 * Visual warnings:
 * - READY: Yellow icon if below threshold, green if above
 * - ERROR: Red AlertCircle if > 0, green CheckCircle if 0
 */
export const SchemaPoolStatsCards = memo(({ stats, t }) => {
    const theme = useTheme();
    
    if (!stats) return null;
    
    const { readyCount, assignedCount, errorCount, totalCount, minReadyCount } = stats;
    
    // Determine READY card icon and color based on threshold
    const readyIcon = readyCount < minReadyCount ? AlertTriangle : CheckCircle;
    const readyColor = readyCount < minReadyCount 
        ? theme.palette.warning.main 
        : theme.palette.success.main;
    
    // Determine ERROR card icon
    const errorIcon = errorCount > 0 ? AlertCircle : CheckCircle;
    
    return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    icon={readyIcon}
                    title={t('schema_pool.ready')}
                    value={readyCount}
                    color={readyColor}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    icon={Users}
                    title={t('schema_pool.assigned')}
                    value={assignedCount}
                    color={theme.palette.info.main}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    icon={errorIcon}
                    title={t('schema_pool.error')}
                    value={errorCount}
                    color={theme.palette.error.main}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    icon={Database}
                    title={t('schema_pool.total')}
                    value={totalCount}
                    color={theme.palette.grey[600]}
                />
            </Grid>
        </Grid>
    );
});

SchemaPoolStatsCards.displayName = 'SchemaPoolStatsCards';
