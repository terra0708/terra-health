import React from 'react';
import { Box, Typography, Grid, Button, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ModulePageWrapper } from '@common/ui';
import { CardSkeleton } from '@common/ui/LoadingSkeleton';
import { usePerformance } from '@common/hooks';
import { useSchemaPoolStats } from '@shared/modules/schema-pool/hooks/useSchemaPoolStats';
import { SchemaPoolStatsCards } from '@shared/modules/schema-pool/components/SchemaPoolStatsCards';
import { SchemaPoolHealthGauge } from '@shared/modules/schema-pool/components/SchemaPoolHealthGauge';
import { SchemaPoolActivityLog } from '@shared/modules/schema-pool/components/SchemaPoolActivityLog';
import { SchemaPoolCriticalAlert } from '@shared/modules/schema-pool/components/SchemaPoolCriticalAlert';
import { SchemaPoolAccessDenied } from '@shared/modules/schema-pool/components/SchemaPoolAccessDenied';
import { RefreshCw } from 'lucide-react';

/**
 * Schema Pool Dashboard Page
 * Superadmin panel for monitoring schema pool status
 * 
 * Features:
 * - Auto-refresh every 30 seconds
 * - Critical alerts for low capacity
 * - System health gauge
 * - Activity log with live relative time updates
 * - Access denied handling for 403 errors
 */
const SchemaPoolDashboard = () => {
    usePerformance('SchemaPoolDashboard');
    const { t } = useTranslation();
    const { data: stats, isLoading, error, refetch } = useSchemaPoolStats();
    
    // Check if error is 403 (Access Denied)
    const isAccessDenied = error?.response?.status === 403 || 
                          error?.status === 403 ||
                          (error?.message && error.message.includes('403'));
    
    // Loading state
    if (isLoading) {
        return (
            <ModulePageWrapper moduleName="SchemaPoolDashboard">
                <Box sx={{ p: { xs: 2, md: 4 } }}>
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ mb: 0.5 }}>
                            {t('schema_pool.title')}
                        </Typography>
                    </Box>
                    <CardSkeleton count={4} variant="grid" aria-label={t('schema_pool.loading')} />
                </Box>
            </ModulePageWrapper>
        );
    }
    
    // Access Denied state (403)
    if (isAccessDenied) {
        return (
            <ModulePageWrapper moduleName="SchemaPoolDashboard">
                <SchemaPoolAccessDenied t={t} />
            </ModulePageWrapper>
        );
    }
    
    // Error state (other errors)
    if (error) {
        return (
            <ModulePageWrapper moduleName="SchemaPoolDashboard">
                <Box sx={{ p: { xs: 2, md: 4 } }}>
                    <Alert 
                        severity="error" 
                        action={
                            <Button 
                                color="inherit" 
                                size="small" 
                                onClick={() => refetch()}
                                startIcon={<RefreshCw size={16} />}
                            >
                                {t('schema_pool.retry')}
                            </Button>
                        }
                        sx={{ mb: 3 }}
                    >
                        {t('schema_pool.error_loading')}
                    </Alert>
                </Box>
            </ModulePageWrapper>
        );
    }
    
    // Success state - render dashboard
    return (
        <ModulePageWrapper moduleName="SchemaPoolDashboard">
            <Box sx={{ p: { xs: 2, md: 4 } }}>
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ mb: 0.5 }}>
                        {t('schema_pool.title')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        {t('schema_pool.system_health')}
                    </Typography>
                </Box>
                
                {/* Critical Alert */}
                {stats && <SchemaPoolCriticalAlert readyCount={stats.readyCount} t={t} />}
                
                {/* Stats Cards */}
                {stats && <SchemaPoolStatsCards stats={stats} t={t} />}
                
                {/* System Health and Activity Log */}
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        {stats && <SchemaPoolHealthGauge stats={stats} t={t} />}
                    </Grid>
                    <Grid item xs={12} md={6}>
                        {stats && <SchemaPoolActivityLog stats={stats} t={t} />}
                    </Grid>
                </Grid>
            </Box>
        </ModulePageWrapper>
    );
};

export default SchemaPoolDashboard;
