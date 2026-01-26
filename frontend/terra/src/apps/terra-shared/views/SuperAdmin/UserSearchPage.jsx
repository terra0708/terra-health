import React, { useState } from 'react';
import {
    Box, Typography, TextField, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, IconButton, Alert, CircularProgress
} from '@mui/material';
import { Search, UserCheck, UserX, Key, UserCog } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ModulePageWrapper, LoadingSpinner } from '@common/ui';
import { usePerformance } from '@common/hooks';
import {
    useUserSearch, useResetPassword, useSetUserEnabled, useImpersonateUser
} from '@shared/modules/super-admin';

/**
 * User Search Page
 * Super Admin can search users globally and impersonate them
 */
const UserSearchPage = () => {
    usePerformance('UserSearchPage');
    const { t } = useTranslation();
    const [searchEmail, setSearchEmail] = useState('');
    const [emailQuery, setEmailQuery] = useState('');
    
    const { data: searchResult, isLoading, isError, error } = useUserSearch(emailQuery);
    const resetPassword = useResetPassword();
    const setUserEnabled = useSetUserEnabled();
    const impersonateUser = useImpersonateUser();

    const handleSearch = () => {
        if (searchEmail.length >= 3) {
            setEmailQuery(searchEmail);
        }
    };

    const handleResetPassword = async (userId) => {
        const newPassword = window.prompt(t('super_admin.user_search.enter_new_password', 'Enter new password:'));
        if (newPassword) {
            await resetPassword.mutateAsync({ userId, newPassword });
        }
    };

    const handleToggleEnabled = async (userId, currentEnabled) => {
        await setUserEnabled.mutateAsync({ userId, enabled: !currentEnabled });
    };

    const handleImpersonate = async (userId) => {
        if (window.confirm(t('super_admin.user_search.confirm_impersonate', 'Start impersonation session?'))) {
            await impersonateUser.mutateAsync(userId);
        }
    };

    return (
        <ModulePageWrapper moduleName="UserSearchPage">
            <Box sx={{ p: { xs: 2, md: 4 } }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ mb: 0.5 }}>
                        {t('super_admin.user_search.title', 'User Search')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t('super_admin.user_search.subtitle', 'Search users globally and manage accounts')}
                    </Typography>
                </Box>

                <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
                    <TextField
                        fullWidth
                        label={t('super_admin.user_search.email', 'Email')}
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder={t('super_admin.user_search.email_placeholder', 'Enter email to search...')}
                    />
                    <Button
                        variant="contained"
                        startIcon={<Search />}
                        onClick={handleSearch}
                        disabled={searchEmail.length < 3}
                    >
                        {t('common.search', 'Search')}
                    </Button>
                </Box>

                {isError && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error?.message || t('super_admin.user_search.error', 'Failed to search users')}
                    </Alert>
                )}

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <LoadingSpinner message={t('super_admin.user_search.loading', 'Searching users...')} />
                    </Box>
                ) : searchResult?.users && searchResult.users.length > 0 ? (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                        {t('super_admin.user_search.email', 'Email')}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                        {t('super_admin.user_search.name', 'Name')}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                        {t('super_admin.user_search.tenant', 'Tenant')}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                        {t('super_admin.user_search.status', 'Status')}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                        {t('common.actions', 'Actions')}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {searchResult.users.map((user) => (
                                    <TableRow key={user.userId}>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            {user.firstName} {user.lastName}
                                        </TableCell>
                                        <TableCell>{user.tenantName || '-'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.enabled ? t('common.enabled', 'Enabled') : t('common.disabled', 'Disabled')}
                                                color={user.enabled ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleResetPassword(user.userId)}
                                                    title={t('super_admin.user_search.reset_password', 'Reset Password')}
                                                >
                                                    <Key size={18} />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleToggleEnabled(user.userId, user.enabled)}
                                                    title={user.enabled ? t('common.disable', 'Disable') : t('common.enable', 'Enable')}
                                                >
                                                    {user.enabled ? <UserX size={18} /> : <UserCheck size={18} />}
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleImpersonate(user.userId)}
                                                    title={t('super_admin.user_search.impersonate', 'Impersonate')}
                                                >
                                                    <UserCog size={18} />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : emailQuery ? (
                    <Alert severity="info">
                        {t('super_admin.user_search.no_results', 'No users found')}
                    </Alert>
                ) : null}
            </Box>
        </ModulePageWrapper>
    );
};

export default UserSearchPage;
