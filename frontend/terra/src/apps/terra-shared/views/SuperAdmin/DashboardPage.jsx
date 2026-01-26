import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ModulePageWrapper, LoadingSpinner } from '@common/ui';
import { usePerformance } from '@common/hooks';
import { useSuperAdminStats } from '@shared/modules/super-admin';

/**
 * Super Admin Dashboard Page
 * Displays system-wide statistics and overview
 */
const DashboardPage = () => {
    usePerformance('SuperAdminDashboard');
    const { t } = useTranslation();
    const { data: stats, isLoading, isError, error } = useSuperAdminStats();

    return (
        <ModulePageWrapper moduleName="SuperAdminDashboard">
            <Box sx={{ p: { xs: 2, md: 4 } }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ mb: 0.5 }}>
                        {t('super_admin.dashboard.title', 'Super Admin Dashboard')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t('super_admin.dashboard.subtitle', 'System-wide statistics and monitoring')}
                    </Typography>
                </Box>

                {isError && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error?.message || t('super_admin.dashboard.error', 'Failed to load statistics')}
                    </Alert>
                )}

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <LoadingSpinner message={t('super_admin.dashboard.loading', 'Loading statistics...')} />
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        {t('super_admin.dashboard.total_tenants', 'Total Tenants')}
                                    </Typography>
                                    <Typography variant="h4" fontWeight={700}>
                                        {stats?.totalTenants ?? '-'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        {t('super_admin.dashboard.active_tenants', 'Active Tenants')}
                                    </Typography>
                                    <Typography variant="h4" fontWeight={700} color="success.main">
                                        {stats?.activeTenants ?? '-'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        {t('super_admin.dashboard.suspended_tenants', 'Suspended Tenants')}
                                    </Typography>
                                    <Typography variant="h4" fontWeight={700} color="warning.main">
                                        {stats?.suspendedTenants ?? '-'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        {t('super_admin.dashboard.total_users', 'Total Users')}
                                    </Typography>
                                    <Typography variant="h4" fontWeight={700}>
                                        {stats?.totalUsers ?? '-'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        {t('super_admin.dashboard.total_audit_logs', 'Total Audit Logs')}
                                    </Typography>
                                    <Typography variant="h4" fontWeight={700}>
                                        {stats?.totalAuditLogs ?? '-'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        {t('super_admin.dashboard.schema_pool_ready', 'Schema Pool Ready')}
                                    </Typography>
                                    <Typography variant="h4" fontWeight={700} color="success.main">
                                        {stats?.schemaPoolReady ?? '-'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        {t('super_admin.dashboard.schema_pool_assigned', 'Schema Pool Assigned')}
                                    </Typography>
                                    <Typography variant="h4" fontWeight={700}>
                                        {stats?.schemaPoolAssigned ?? '-'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        {t('super_admin.dashboard.schema_pool_error', 'Schema Pool Error')}
                                    </Typography>
                                    <Typography variant="h4" fontWeight={700} color="error.main">
                                        {stats?.schemaPoolError ?? '-'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}
            </Box>
        </ModulePageWrapper>
    );
};

export default DashboardPage;
