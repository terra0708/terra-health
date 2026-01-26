import React, { useState } from 'react';
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Alert, CircularProgress, alpha, useTheme, Stack, Checkbox, FormControlLabel, FormGroup
} from '@mui/material';
import { Play, Pause, Trash2, Settings, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ModulePageWrapper, LoadingSpinner } from '@common/ui';
import { usePerformance } from '@common/hooks';
import {
    useTenants, useSuspendTenant, useActivateTenant, useDeleteTenant,
    useToggleModule, useSetQuotas, useCreateTenant
} from '@shared/modules/super-admin';

/**
 * Tenant Management Page
 * Super Admin can manage tenants: create, suspend, activate, delete, toggle modules, set quotas
 */
const TenantsPage = () => {
    usePerformance('TenantsPage');
    const { t } = useTranslation();
    const theme = useTheme();
    const { data: tenants, isLoading, isError, error } = useTenants();
    const suspendTenant = useSuspendTenant();
    const activateTenant = useActivateTenant();
    const deleteTenant = useDeleteTenant();
    const toggleModule = useToggleModule();
    const setQuotas = useSetQuotas();
    const createTenant = useCreateTenant();
    
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
    const [quotaDialogOpen, setQuotaDialogOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        tenantName: '',
        adminFirstName: '',
        adminLastName: '',
        adminEmail: '',
        adminPassword: '',
        moduleNames: ['MODULE_DASHBOARD', 'MODULE_APPOINTMENTS', 'MODULE_CUSTOMERS', 'MODULE_REMINDERS']
    });
    
    // Available modules
    const availableModules = [
        { id: 'MODULE_DASHBOARD', label: 'Dashboard' },
        { id: 'MODULE_APPOINTMENTS', label: 'Appointments' },
        { id: 'MODULE_CUSTOMERS', label: 'Customers' },
        { id: 'MODULE_REMINDERS', label: 'Reminders' },
        { id: 'MODULE_MARKETING', label: 'Marketing' },
        { id: 'MODULE_STATISTICS', label: 'Statistics' },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'ACTIVE': return 'success';
            case 'SUSPENDED': return 'warning';
            case 'DELETED': return 'error';
            default: return 'default';
        }
    };

    const handleSuspend = async (tenantId) => {
        if (window.confirm(t('super_admin.tenants.confirm_suspend', 'Are you sure you want to suspend this tenant?'))) {
            await suspendTenant.mutateAsync({ tenantId, reason: 'Suspended by Super Admin' });
        }
    };

    const handleActivate = async (tenantId) => {
        await activateTenant.mutateAsync(tenantId);
    };

    const handleDelete = async (tenantId) => {
        if (window.confirm(t('super_admin.tenants.confirm_delete', 'Are you sure you want to permanently delete this tenant? This action cannot be undone.'))) {
            await deleteTenant.mutateAsync(tenantId);
        }
    };

    const handleCreateTenant = async () => {
        try {
            await createTenant.mutateAsync(formData);
            setCreateDialogOpen(false);
            setFormData({
                tenantName: '',
                adminFirstName: '',
                adminLastName: '',
                adminEmail: '',
                adminPassword: '',
                moduleNames: ['MODULE_DASHBOARD', 'MODULE_APPOINTMENTS', 'MODULE_CUSTOMERS', 'MODULE_REMINDERS']
            });
        } catch (error) {
            console.error('Failed to create tenant:', error);
        }
    };

    const handleModuleToggle = (moduleId) => {
        setFormData(prev => ({
            ...prev,
            moduleNames: prev.moduleNames.includes(moduleId)
                ? prev.moduleNames.filter(id => id !== moduleId)
                : [...prev.moduleNames, moduleId]
        }));
    };

    return (
        <ModulePageWrapper moduleName="TenantsPage">
            <Box sx={{ p: { xs: 2, md: 4 } }}>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ mb: 0.5 }}>
                            {t('super_admin.tenants.title', 'Tenant Management')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t('super_admin.tenants.subtitle', 'Manage tenants, modules, and quotas')}
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Plus />}
                        onClick={() => setCreateDialogOpen(true)}
                    >
                        {t('super_admin.tenants.create', 'Create Tenant')}
                    </Button>
                </Box>

                {isError && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error?.message || t('super_admin.tenants.error', 'Failed to load tenants')}
                    </Alert>
                )}

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <LoadingSpinner message={t('super_admin.tenants.loading', 'Loading tenants...')} />
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                        {t('super_admin.tenants.name', 'Name')}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                        {t('super_admin.tenants.schema', 'Schema')}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                        {t('super_admin.tenants.status', 'Status')}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                        {t('super_admin.tenants.modules', 'Modules')}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                        {t('common.actions', 'Actions')}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tenants?.map((tenant) => (
                                    <TableRow key={tenant.id}>
                                        <TableCell>{tenant.name}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {tenant.schemaName}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={tenant.status}
                                                color={getStatusColor(tenant.status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {tenant.assignedModules?.length || 0} {t('super_admin.tenants.modules_count', 'modules')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                {tenant.status === 'ACTIVE' ? (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleSuspend(tenant.id)}
                                                        sx={{ color: 'warning.main' }}
                                                    >
                                                        <Pause size={18} />
                                                    </IconButton>
                                                ) : (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleActivate(tenant.id)}
                                                        sx={{ color: 'success.main' }}
                                                    >
                                                        <Play size={18} />
                                                    </IconButton>
                                                )}
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setSelectedTenant(tenant);
                                                        setModuleDialogOpen(true);
                                                    }}
                                                    sx={{ color: 'primary.main' }}
                                                >
                                                    <Settings size={18} />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDelete(tenant.id)}
                                                    sx={{ color: 'error.main' }}
                                                >
                                                    <Trash2 size={18} />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Create Tenant Dialog */}
                <Dialog
                    open={createDialogOpen}
                    onClose={() => setCreateDialogOpen(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        {t('super_admin.tenants.create_title', 'Create New Tenant')}
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={3} sx={{ mt: 1 }}>
                            <TextField
                                fullWidth
                                label={t('super_admin.tenants.tenant_name', 'Tenant Name')}
                                value={formData.tenantName}
                                onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                                required
                            />
                            <TextField
                                fullWidth
                                label={t('super_admin.tenants.admin_first_name', 'Admin First Name')}
                                value={formData.adminFirstName}
                                onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                                required
                            />
                            <TextField
                                fullWidth
                                label={t('super_admin.tenants.admin_last_name', 'Admin Last Name')}
                                value={formData.adminLastName}
                                onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                                required
                            />
                            <TextField
                                fullWidth
                                type="email"
                                label={t('super_admin.tenants.admin_email', 'Admin Email')}
                                value={formData.adminEmail}
                                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                required
                            />
                            <TextField
                                fullWidth
                                type="password"
                                label={t('super_admin.tenants.admin_password', 'Admin Password')}
                                value={formData.adminPassword}
                                onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                required
                            />
                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                    {t('super_admin.tenants.select_modules', 'Select Modules')}
                                </Typography>
                                <FormGroup>
                                    {availableModules.map((module) => (
                                        <FormControlLabel
                                            key={module.id}
                                            control={
                                                <Checkbox
                                                    checked={formData.moduleNames.includes(module.id)}
                                                    onChange={() => handleModuleToggle(module.id)}
                                                />
                                            }
                                            label={module.label}
                                        />
                                    ))}
                                </FormGroup>
                            </Box>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCreateDialogOpen(false)}>
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleCreateTenant}
                            disabled={createTenant.isPending || !formData.tenantName || !formData.adminEmail || !formData.adminPassword || formData.moduleNames.length === 0}
                        >
                            {createTenant.isPending ? (
                                <>
                                    <CircularProgress size={16} sx={{ mr: 1 }} />
                                    {t('common.creating', 'Creating...')}
                                </>
                            ) : (
                                t('common.create', 'Create')
                            )}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </ModulePageWrapper>
    );
};

export default TenantsPage;
