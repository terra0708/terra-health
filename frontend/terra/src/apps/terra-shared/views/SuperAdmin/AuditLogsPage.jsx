import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Button, Chip, Alert, Pagination, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ModulePageWrapper, LoadingSpinner } from '@common/ui';
import { usePerformance } from '@common/hooks';
import { useAuditLogs } from '@shared/modules/super-admin';

// Memoized Row Component to prevent unnecessary re-renders
const AuditLogRow = React.memo(({ log }) => (
    <TableRow>
        <TableCell>
            {new Date(log.createdAt).toLocaleString()}
        </TableCell>
        <TableCell>
            <Chip label={log.action} size="small" />
        </TableCell>
        <TableCell>{log.resourceType || '-'}</TableCell>
        <TableCell>
            <Typography variant="body2" color="text.secondary">
                {log.userId?.substring(0, 8)}...
            </Typography>
        </TableCell>
        <TableCell>
            {log.tenantId ? (
                <Typography variant="body2" color="text.secondary">
                    {log.tenantId.substring(0, 8)}...
                </Typography>
            ) : '-'}
        </TableCell>
        <TableCell>{log.ipAddress || '-'}</TableCell>
    </TableRow>
));

AuditLogRow.displayName = 'AuditLogRow';

// Memoized Table Component
const AuditLogsTable = React.memo(({ logs }) => {
    const { t } = useTranslation();
    return (
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                            {t('super_admin.audit_logs.date', 'Date')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                            {t('super_admin.audit_logs.action', 'Action')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                            {t('super_admin.audit_logs.resource_type', 'Resource Type')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                            {t('super_admin.audit_logs.user_id', 'User ID')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                            {t('super_admin.audit_logs.tenant_id', 'Tenant ID')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                            {t('super_admin.audit_logs.ip_address', 'IP Address')}
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {logs.map((log) => (
                        <AuditLogRow key={log.id} log={log} />
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
});

AuditLogsTable.displayName = 'AuditLogsTable';

/**
 * Audit Logs Page
 * Super Admin can view and filter audit logs
 */
const AuditLogsPage = () => {
    usePerformance('AuditLogsPage');
    const { t } = useTranslation();
    
    // Debug: Monitor render count
    const renderCount = useRef(0);
    useEffect(() => {
        renderCount.current += 1;
        console.log(`[AuditLogsPage] Render count: ${renderCount.current}`);
    });

    const [page, setPage] = useState(0);
    const [actionFilter, setActionFilter] = useState('');
    const [tenantIdFilter, setTenantIdFilter] = useState('');

    const filters = useMemo(() => ({
        action: actionFilter || undefined,
        tenantId: tenantIdFilter || undefined,
        page,
        size: 20,
    }), [actionFilter, tenantIdFilter, page]);

    const { data: auditLogsPage, isLoading, isError, error } = useAuditLogs(filters);

    // Stable handlers
    const handleActionFilterChange = useCallback((e) => {
        setActionFilter(e.target.value);
    }, []);

    const handleTenantIdFilterChange = useCallback((e) => {
        setTenantIdFilter(e.target.value);
    }, []);

    const handleFilterReset = useCallback(() => {
        setPage(0);
        // If we wanted to reset filters too, we could do it here
    }, []);
    
    const handlePageChange = useCallback((e, newPage) => {
        setPage(newPage - 1);
    }, []);

    return (
        <ModulePageWrapper moduleName="AuditLogsPage">
            <Box sx={{ p: { xs: 2, md: 4 } }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ mb: 0.5 }}>
                        {t('super_admin.audit_logs.title', 'System Logs')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t('super_admin.audit_logs.subtitle', 'View and filter system audit logs')}
                    </Typography>
                </Box>

                <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>{t('super_admin.audit_logs.filter_action', 'Action')}</InputLabel>
                        <Select
                            value={actionFilter}
                            label={t('super_admin.audit_logs.filter_action', 'Action')}
                            onChange={handleActionFilterChange}
                        >
                            <MenuItem value="">{t('common.all', 'All')}</MenuItem>
                            <MenuItem value="TENANT_SUSPENDED">TENANT_SUSPENDED</MenuItem>
                            <MenuItem value="TENANT_ACTIVATED">TENANT_ACTIVATED</MenuItem>
                            <MenuItem value="TENANT_DELETED">TENANT_DELETED</MenuItem>
                            <MenuItem value="MODULE_TOGGLED">MODULE_TOGGLED</MenuItem>
                            <MenuItem value="PASSWORD_RESET">PASSWORD_RESET</MenuItem>
                            <MenuItem value="SESSION_STARTED">SESSION_STARTED</MenuItem>
                            <MenuItem value="USER_SEARCH">USER_SEARCH</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        size="small"
                        label={t('super_admin.audit_logs.filter_tenant', 'Tenant ID')}
                        value={tenantIdFilter}
                        onChange={handleTenantIdFilterChange}
                        placeholder={t('super_admin.audit_logs.tenant_id_placeholder', 'Enter tenant ID...')}
                    />
                    <Button
                        variant="outlined"
                        startIcon={<Filter />}
                        onClick={handleFilterReset}
                    >
                        {t('common.filter', 'Filter')}
                    </Button>
                </Box>

                {isError && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error?.message || t('super_admin.audit_logs.error', 'Failed to load audit logs')}
                    </Alert>
                )}

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <LoadingSpinner message={t('super_admin.audit_logs.loading', 'Loading audit logs...')} />
                    </Box>
                ) : auditLogsPage?.content && auditLogsPage.content.length > 0 ? (
                    <>
                        <AuditLogsTable logs={auditLogsPage.content} />
                        {auditLogsPage.totalPages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                <Pagination
                                    count={auditLogsPage.totalPages}
                                    page={page + 1}
                                    onChange={handlePageChange}
                                />
                            </Box>
                        )}
                    </>
                ) : (
                    <Alert severity="info">
                        {t('super_admin.audit_logs.no_logs', 'No audit logs found')}
                    </Alert>
                )}
            </Box>
        </ModulePageWrapper>
    );
};

export default AuditLogsPage;
