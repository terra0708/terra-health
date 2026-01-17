import React from 'react';
import { Grid, useTheme } from '@mui/material';
import { Users as UsersIcon, CheckCircle, Clock } from 'lucide-react';
import { StatCard } from './StatCard';

const CustomerStats = ({ stats, t }) => {
    const theme = useTheme();

    return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard icon={UsersIcon} title={t('customers.total_customers')} value={stats.total} color={theme.palette.primary.main} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <CheckCircle size={20} style={{ display: 'none' }} /> {/* Pre-fetch icon if needed, but StatCard handles it */}
                <StatCard icon={CheckCircle} title={t('customers.active_customers')} value={stats.active} color={theme.palette.success.main} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard icon={Clock} title={t('customers.pending_customers')} value={stats.pending} color={theme.palette.warning.main} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard icon={CheckCircle} title={t('customers.completed_customers')} value={stats.completed} color={theme.palette.info.main} />
            </Grid>
        </Grid>
    );
};

export default CustomerStats;
