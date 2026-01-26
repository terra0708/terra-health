import React, { useState, useMemo } from 'react';
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Button, Chip, Alert, Pagination, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { Filter, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ModulePageWrapper, LoadingSpinner } from '@common/ui';
import { usePerformance } from '@common/hooks';
import { useAuditLogs } from '@shared/modules/super-admin';

/**
 * Audit Logs Page
 * Super Admin can view and filter audit logs
 */
const AuditLogsPage = () => {
    usePerformance('AuditLogsPage');
    const { t } = useTranslation();
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
                            onChange={(e) => setActionFilter(e.target.value)}
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
                        onChange={(e) => setTenantIdFilter(e.target.value)}
                        placeholder={t('super_admin.audit_logs.tenant_id_placeholder', 'Enter tenant ID...')}
                    />
                    <Button
                        variant="outlined"
                        startIcon={<Filter />}
                        onClick={() => {
                            setPage(0);
                        }}
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
                                    {auditLogsPage.content.map((log) => (
                                        <TableRow key={log.id}>
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
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {auditLogsPage.totalPages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                <Pagination
                                    count={auditLogsPage.totalPages}
                                    page={page + 1}
                                    onChange={(e, newPage) => setPage(newPage - 1)}
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
