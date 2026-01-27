import React, { useState } from 'react';
import {
    Box, Typography, Button, Stack, TextField, IconButton, Chip, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Switch, FormControlLabel
} from '@mui/material';
import { Plus, Edit, Trash2, Key, UserX, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LoadingSpinner } from '@common/ui';
import {
    useTenantAdmins, useCreateTenantAdmin, useUpdateTenantAdmin,
    useRemoveTenantAdmin, useResetTenantAdminPassword
} from '@shared/modules/super-admin';

/**
 * Admins Tab - Full CRUD for Tenant Admins
 */
const AdminsTab = ({ tenant }) => {
    const { t } = useTranslation();
    const { data: admins, isLoading } = useTenantAdmins(tenant?.id);
    const createAdmin = useCreateTenantAdmin();
    const updateAdmin = useUpdateTenantAdmin();
    const removeAdmin = useRemoveTenantAdmin();
    const resetPassword = useResetTenantAdminPassword();

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);

    const [createFormData, setCreateFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: ''
    });

    const [editFormData, setEditFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        enabled: true
    });

    const [newPassword, setNewPassword] = useState('');

    const handleCreateAdmin = async () => {
        try {
            await createAdmin.mutateAsync({
                tenantId: tenant.id,
                ...createFormData
            });
            setCreateFormData({ firstName: '', lastName: '', email: '', password: '' });
            setCreateDialogOpen(false);
        } catch (error) {
            console.error('Failed to create admin:', error);
        }
    };

    const handleEditAdmin = async () => {
        try {
            await updateAdmin.mutateAsync({
                tenantId: tenant.id,
                userId: selectedAdmin.id,
                ...editFormData
            });
            setEditDialogOpen(false);
            setSelectedAdmin(null);
        } catch (error) {
            console.error('Failed to update admin:', error);
        }
    };

    const handleResetPassword = async () => {
        try {
            await resetPassword.mutateAsync({
                tenantId: tenant.id,
                userId: selectedAdmin.id,
                newPassword
            });
            setPasswordDialogOpen(false);
            setSelectedAdmin(null);
            setNewPassword('');
        } catch (error) {
            console.error('Failed to reset password:', error);
        }
    };

    const handleRemoveAdmin = async (adminId) => {
        if (window.confirm(t('super_admin.tenants.confirm_remove_admin', 'Remove admin role from this user?'))) {
            await removeAdmin.mutateAsync({ tenantId: tenant.id, userId: adminId });
        }
    };

    const handleToggleAdminStatus = async (admin) => {
        const action = admin.enabled ? t('common.freeze', 'freeze') : t('common.activate', 'activate');
        if (window.confirm(t('super_admin.tenants.confirm_admin_status_change', `Are you sure you want to ${action} this admin?`))) {
            try {
                await updateAdmin.mutateAsync({
                    tenantId: tenant.id,
                    userId: admin.id,
                    firstName: admin.firstName,
                    lastName: admin.lastName,
                    email: admin.email,
                    enabled: !admin.enabled
                });
            } catch (error) {
                console.error('Failed to toggle admin status:', error);
            }
        }
    };

    const openEditDialog = (admin) => {
        setSelectedAdmin(admin);
        setEditFormData({
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email,
            enabled: admin.enabled
        });
        setEditDialogOpen(true);
    };

    const openPasswordDialog = (admin) => {
        setSelectedAdmin(admin);
        setNewPassword('');
        setPasswordDialogOpen(true);
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={600}>
                    {t('super_admin.tenants.manage_admins', 'Manage Admins')}
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={() => setCreateDialogOpen(true)}
                >
                    {t('super_admin.tenants.add_admin', 'Add Admin')}
                </Button>
            </Box>

            {admins && admins.length > 0 ? (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('super_admin.tenants.name', 'Name')}</TableCell>
                                <TableCell>{t('super_admin.tenants.email', 'Email')}</TableCell>
                                <TableCell>{t('super_admin.tenants.status', 'Status')}</TableCell>
                                <TableCell align="right">{t('common.actions', 'Actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {admins.map((admin) => (
                                <TableRow key={admin.id}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500}>
                                            {admin.firstName} {admin.lastName}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{admin.email}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={admin.enabled ? t('common.active', 'Active') : t('common.disabled', 'Disabled')}
                                            color={admin.enabled ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            <IconButton
                                                size="small"
                                                onClick={() => openEditDialog(admin)}
                                                sx={{ color: 'primary.main' }}
                                                title={t('common.edit', 'Edit')}
                                                disabled={admin.email === 'admin@terra.com'}
                                            >
                                                <Edit size={18} />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => openPasswordDialog(admin)}
                                                sx={{ color: 'warning.main' }}
                                                title={t('super_admin.tenants.reset_password', 'Reset Password')}
                                            >
                                                <Key size={18} />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleToggleAdminStatus(admin)}
                                                sx={{ color: admin.enabled ? 'warning.main' : 'success.main' }}
                                                title={admin.enabled ? t('common.freeze', 'Freeze') : t('common.activate', 'Activate')}
                                                disabled={admin.email === 'admin@terra.com'}
                                            >
                                                {admin.enabled ? <UserX size={18} /> : <UserCheck size={18} />}
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleRemoveAdmin(admin.id)}
                                                sx={{ color: 'error.main' }}
                                                title={t('common.delete', 'Delete')}
                                                disabled={admin.email === 'admin@terra.com' || (admins.length <= 1 && tenant.schemaName !== 'public')}
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
            ) : (
                <Alert severity="info">{t('super_admin.tenants.no_admins', 'No admins found')}</Alert>
            )}

            {/* Create Admin Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{t('super_admin.tenants.add_admin', 'Add Admin')}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            label={t('super_admin.tenants.first_name', 'First Name')}
                            value={createFormData.firstName}
                            onChange={(e) => setCreateFormData({ ...createFormData, firstName: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            label={t('super_admin.tenants.last_name', 'Last Name')}
                            value={createFormData.lastName}
                            onChange={(e) => setCreateFormData({ ...createFormData, lastName: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            label={t('super_admin.tenants.email', 'Email')}
                            type="email"
                            value={tenant?.domain ? createFormData.email.split('@')[0] : createFormData.email}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (tenant?.domain) {
                                    const prefix = val.split('@')[0].toLowerCase().trim();
                                    setCreateFormData({ ...createFormData, email: `${prefix}@${tenant.domain}` });
                                } else {
                                    setCreateFormData({ ...createFormData, email: val });
                                }
                            }}
                            InputProps={{
                                endAdornment: tenant?.domain ? (
                                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1, whiteSpace: 'nowrap', userSelect: 'none', pointerEvents: 'none' }}>
                                        @{tenant.domain}
                                    </Typography>
                                ) : null
                            }}
                        />
                        <TextField
                            fullWidth
                            label={t('super_admin.tenants.password', 'Password')}
                            type="password"
                            value={createFormData.password}
                            onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateAdmin}
                        disabled={createAdmin.isPending || !createFormData.firstName || !createFormData.lastName || !createFormData.email || !createFormData.password}
                    >
                        {createAdmin.isPending ? <CircularProgress size={20} /> : t('common.create', 'Create')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Admin Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{t('super_admin.tenants.edit_admin', 'Edit Admin')}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            label={t('super_admin.tenants.first_name', 'First Name')}
                            value={editFormData.firstName}
                            onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            label={t('super_admin.tenants.last_name', 'Last Name')}
                            value={editFormData.lastName}
                            onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            label={t('super_admin.tenants.email', 'Email')}
                            type="email"
                            value={tenant?.domain ? editFormData.email.split('@')[0] : editFormData.email}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (tenant?.domain) {
                                    const prefix = val.split('@')[0].toLowerCase().trim();
                                    setEditFormData({ ...editFormData, email: `${prefix}@${tenant.domain}` });
                                } else {
                                    setEditFormData({ ...editFormData, email: val });
                                }
                            }}
                            InputProps={{
                                endAdornment: tenant?.domain ? (
                                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1, whiteSpace: 'nowrap', userSelect: 'none', pointerEvents: 'none' }}>
                                        @{tenant.domain}
                                    </Typography>
                                ) : null
                            }}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={editFormData.enabled}
                                    onChange={(e) => setEditFormData({ ...editFormData, enabled: e.target.checked })}
                                />
                            }
                            label={t('super_admin.tenants.enabled', 'Enabled')}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
                    <Button
                        variant="contained"
                        onClick={handleEditAdmin}
                        disabled={updateAdmin.isPending || !editFormData.firstName || !editFormData.lastName || !editFormData.email}
                    >
                        {updateAdmin.isPending ? <CircularProgress size={20} /> : t('common.save', 'Save')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{t('super_admin.tenants.reset_password', 'Reset Password')}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Alert severity="info">
                            {t('super_admin.tenants.reset_password_info', 'Resetting password for')}: <strong>{selectedAdmin?.firstName} {selectedAdmin?.lastName}</strong>
                        </Alert>
                        <TextField
                            fullWidth
                            label={t('super_admin.tenants.new_password', 'New Password')}
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPasswordDialogOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
                    <Button
                        variant="contained"
                        color="warning"
                        onClick={handleResetPassword}
                        disabled={resetPassword.isPending || !newPassword}
                    >
                        {resetPassword.isPending ? <CircularProgress size={20} /> : t('common.reset', 'Reset')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminsTab;
