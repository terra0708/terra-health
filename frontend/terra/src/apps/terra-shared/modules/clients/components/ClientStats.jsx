import React from 'react';
import { Grid, useTheme } from '@mui/material';
import { Users as UsersIcon, CheckCircle, Clock } from 'lucide-react';
import { StatCard } from './StatCard';

/**
 * Generic Client Stats Component
 * 
 * Base client istatistiklerini gösterir. Domain-specific label'lar
 * props olarak geçilir.
 */
const ClientStats = ({ stats, t, labels = {} }) => {
    const theme = useTheme();

    return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                    icon={UsersIcon} 
                    title={labels.total || t('clients.total_clients', 'Total Clients')} 
                    value={stats.total} 
                    color={theme.palette.primary.main} 
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <CheckCircle size={20} style={{ display: 'none' }} />
                <StatCard 
                    icon={CheckCircle} 
                    title={labels.active || t('clients.active_clients', 'Active Clients')} 
                    value={stats.active} 
                    color={theme.palette.success.main} 
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                    icon={Clock} 
                    title={labels.pending || t('clients.pending_clients', 'Pending Clients')} 
                    value={stats.pending} 
                    color={theme.palette.warning.main} 
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                    icon={CheckCircle} 
                    title={labels.completed || t('clients.completed_clients', 'Completed Clients')} 
                    value={stats.completed} 
                    color={theme.palette.info.main} 
                />
            </Grid>
        </Grid>
    );
};

export default ClientStats;
export { ClientStats };
