import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Button,
    TextField,
    InputAdornment,
    Chip,
    Avatar,
    useTheme,
    alpha,
    Grid,
    Tooltip,
    useMediaQuery,
    TablePagination,
    Pagination,
    Stack,
    Snackbar,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent
} from '@mui/material';
import {
    Search,
    Edit3,
    Trash2,
    UserPlus,
    Users as UsersIcon,
    UserCheck,
    ShieldCheck,
    Filter,
    Phone,
    Calendar,
    LogOut,
    Info,
    Shield,
    Lock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    UserDrawer,
    UserMobileCard,
    UserDetailsDialog,
    UserTerminationDialog,
    StatCard,
    useUsers
} from '@shared/modules/users';
import { UserBundleDrawer } from '@shared/modules/users/components/UserBundleDrawer';
import { ModulePageWrapper } from '@common/ui';
import { usePerformance } from '@common/hooks';
import { useUserStore } from '@shared/modules/users/hooks/useUserStore';

const UsersPage = () => {
    usePerformance('UsersPage');
    const { t } = useTranslation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

    // --- LOGIC HOOK ---
    const {
        searchTerm,
        setSearchTerm,
        drawerOpen,
        editUser,
        handleOpenDrawer,
        handleCloseDrawer,
        filteredUsers,
        totalTeam,
        adminCount,
        totalCount,
        page,
        setPage,
        rowsPerPage,
        setRowsPerPage,
        loading,
        store // Access to actions: addUser, updateUser, deleteUser
    } = useUsers();

    const [detailsOpen, setDetailsOpen] = useState(false);
    const [viewUser, setViewUser] = useState(null);
    const [bundleDrawerOpen, setBundleDrawerOpen] = useState(false);
    const [selectedUserForBundles, setSelectedUserForBundles] = useState(null);

    const handleViewDetails = (user) => {
        setViewUser(user);
        setDetailsOpen(true);
    };

    const handleOpenBundleDrawer = (user) => {
        setSelectedUserForBundles(user);
        setBundleDrawerOpen(true);
    };

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const isProtectedUser = (user) => {
        if (!user) return false;
        return user.roles?.some(role => role === 'ROLE_ADMIN' || role === 'ROLE_SUPER_ADMIN');
    };

    const handleSaveUser = async (payload) => {
        try {
            if (editUser) {
                // The store.updateUser now accepts the full payload (auth + profile)
                await store.updateUser(editUser.id, payload);
            } else {
                // The store.addUser now accepts the full payload (auth + profile)
                await store.addUser(payload);
            }

            handleCloseDrawer();
            setSnackbar({ open: true, message: t('common.success_save'), severity: 'success' });
        } catch (error) {
            console.error('Failed to save user:', error);
            const errorMessage = error.message || t('common.error_save') || 'Kayıt başarısız';
            setSnackbar({ open: true, message: errorMessage, severity: 'error' });
        }
    };

    const [terminationOpen, setTerminationOpen] = useState(false);
    const [terminatingUser, setTerminatingUser] = useState(null);

    // NOTE: Selectors ayrı ayrı kullanılmalı; obje dönmek sonsuz render'a sebep olur.
    const passwordInfo = useUserStore((state) => state.passwordInfo);
    const clearPasswordInfo = useUserStore((state) => state.clearPasswordInfo);

    const handleOpenTermination = (user) => {
        setTerminatingUser(user);
        setTerminationOpen(true);
    };

    const handleTerminateConfirm = ({ userId, exitDate, reason }) => {
        // Instead of deleting, we update the user with exit info
        store.updateUser(userId, {
            left: exitDate,
            exit_reason: reason,
            system_access: false // Revoke access
        });
        setSnackbar({ open: true, message: t('common.success_update'), severity: 'info' });
        setTerminationOpen(false);
    };


    return (
        <ModulePageWrapper moduleName="Settings" aria-label="Users Management">
            <Box sx={{ animation: 'fadeIn 0.6s ease', pb: 4 }}>
                {/* STAT CARDS */}
                <Grid container spacing={isSmall ? 2 : 4} sx={{ mb: isSmall ? 4 : 6 }}>
                    <Grid item xs={12} sm={6}><StatCard icon={UsersIcon} title={t('users.total_team')} value={totalTeam} color={theme.palette.primary.main} /></Grid>
                    <Grid item xs={12} sm={6}><StatCard icon={ShieldCheck} title={t('users.admin_count')} value={adminCount} color={theme.palette.error.main} /></Grid>
                </Grid>

                {/* HEADER ACTIONS */}
                <Box sx={{
                    display: 'flex',
                    flexDirection: isSmall ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: isSmall ? 'flex-start' : 'flex-end',
                    mb: 3,
                    gap: 2
                }}>
                    <Box>
                        <Typography variant={isSmall ? "h5" : "h4"} sx={{ fontWeight: 900, letterSpacing: '-0.05em', color: 'text.primary' }}>{t('users.title')}</Typography>
                        {isSmall && <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{totalCount} {t('users.total_team').toLowerCase()}</Typography>}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, width: isSmall ? '100%' : 'auto' }}>
                        <IconButton sx={{ borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper', color: 'text.primary', display: { xs: 'none', sm: 'flex' } }}><Filter size={20} /></IconButton>
                        <Button
                            fullWidth={isSmall}
                            onClick={(e) => { handleOpenDrawer(); e.currentTarget.blur(); }}
                            variant="contained"
                            startIcon={<UserPlus size={18} />}
                            sx={{
                                borderRadius: '16px', px: isSmall ? 2 : 3.5, py: 1.4, fontWeight: 800, textTransform: 'none',
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                            }}
                        >
                            {t('users.add_user')}
                        </Button>
                    </Box>
                </Box>

                {/* SEARCH & CONTENT */}
                <Paper elevation={0} sx={{ borderRadius: isSmall ? '24px' : '32px', overflow: 'hidden', border: `1px solid ${theme.palette.divider}`, background: 'background.paper' }}>
                    <Box sx={{ p: isSmall ? 2 : 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                        <TextField
                            fullWidth={isSmall}
                            placeholder={t('common.search')} variant="standard"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            sx={{
                                width: { xs: '100%', sm: 350 },
                                '& .MuiInput-underline:before, & .MuiInput-underline:after': { display: 'none' },
                                '& input': { fontSize: '1rem', fontWeight: 600, color: 'text.primary' }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Box sx={{
                                            width: 36, height: 36, borderRadius: '12px',
                                            bgcolor: alpha(theme.palette.primary.main, 0.04),
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1, color: 'primary.main'
                                        }}>
                                            <Search size={18} />
                                        </Box>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Box>

                    {loading && filteredUsers.length === 0 ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                            <CircularProgress />
                        </Box>
                    ) : isMobile ? (
                        <Box sx={{ p: 2 }}>
                            {filteredUsers.map(user => (
                                <UserMobileCard
                                    key={user.id}
                                    user={user}
                                    t={t}
                                    theme={theme}
                                    onEdit={isProtectedUser(user) ? null : (u) => handleOpenDrawer(u)}
                                    onAssignBundles={isProtectedUser(user) ? null : (u) => handleOpenBundleDrawer(u)}
                                />
                            ))}
                            {totalCount > rowsPerPage && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, pb: 2 }}>
                                    <Pagination
                                        count={Math.ceil(totalCount / rowsPerPage)}
                                        page={page + 1}
                                        onChange={(e, p) => setPage(p - 1)}
                                        color="primary"
                                        size="small"
                                    />
                                </Box>
                            )}
                        </Box>
                    ) : (
                        <>
                            <TableContainer>
                                <Table sx={{ minWidth: 900 }}>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.015) }}>
                                            <TableCell sx={{ py: 2.5, pl: 4, fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('users.table.user') || 'KULLANICI'}</TableCell>
                                            <TableCell sx={{ py: 2.5, fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('users.table.terra_id') || 'TERRA ID'}</TableCell>
                                            <TableCell sx={{ py: 2.5, fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('users.table.bundles') || 'YETKİ PAKETİ'}</TableCell>
                                            <TableCell sx={{ py: 2.5, fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('users.table.contact') || 'İLETİŞİM'}</TableCell>
                                            <TableCell align="right" sx={{ py: 2.5, pr: 4, fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('common.actions')}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredUsers.map((user) => {
                                            const isAdmin = isProtectedUser(user);
                                            return (
                                                <TableRow key={user.id} sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.01) } }}>
                                                    <TableCell sx={{ py: 2.5, pl: 4 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                            <Avatar sx={{
                                                                width: 44, height: 44, borderRadius: '12px',
                                                                bgcolor: isAdmin ? theme.palette.error.main : theme.palette.primary.main,
                                                                color: '#fff', fontWeight: 800, fontSize: '1rem'
                                                            }}>
                                                                {user.firstName?.[0]}{user.lastName?.[0]}
                                                            </Avatar>
                                                            <Box>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                                                        {user.firstName} {user.lastName}
                                                                    </Typography>
                                                                    {isAdmin && (
                                                                        <Chip
                                                                            label="Yönetici"
                                                                            size="small"
                                                                            color="error"
                                                                            sx={{
                                                                                height: 18, fontSize: '0.65rem', fontWeight: 900,
                                                                                borderRadius: '6px', textTransform: 'uppercase'
                                                                            }}
                                                                        />
                                                                    )}
                                                                </Box>
                                                                {!isAdmin && user.roles?.length > 0 && (
                                                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                                                        {user.roles[0].replace('ROLE_', '').toLowerCase()}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', opacity: 0.8 }}>
                                                            {user.email?.split('@')[0]}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                                                            @{user.email?.split('@')[1]}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                            {user.bundleNames && user.bundleNames.length > 0 ? (
                                                                user.bundleNames.map(bundle => (
                                                                    <Chip
                                                                        key={bundle}
                                                                        label={bundle}
                                                                        size="small"
                                                                        variant="outlined"
                                                                        sx={{
                                                                            borderRadius: '8px', fontWeight: 700, fontSize: '0.65rem',
                                                                            bgcolor: alpha(theme.palette.primary.main, 0.03)
                                                                        }}
                                                                    />
                                                                ))
                                                            ) : (
                                                                <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                                                                    {t('users.no_bundle') || 'Paket Tanımsız'}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Phone size={14} style={{ opacity: 0.5 }} />
                                                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                                                {user.phoneNumber || '-'}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ pr: 4 }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.2 }}>
                                                            <Tooltip title={t('common.user_info')}>
                                                                <IconButton onClick={() => handleViewDetails(user)} size="small" sx={{ color: 'info.main', bgcolor: alpha(theme.palette.info.main, 0.04), borderRadius: '12px', width: 38, height: 38 }}>
                                                                    <Info size={18} />
                                                                </IconButton>
                                                            </Tooltip>
                                                            {!isProtectedUser(user) && (
                                                                <>
                                                                    <Tooltip title={t('users.assign_bundles') || 'Assign Bundles'}>
                                                                        <IconButton onClick={() => handleOpenBundleDrawer(user)} size="small" sx={{ color: 'secondary.main', bgcolor: alpha(theme.palette.secondary.main, 0.04), borderRadius: '12px', width: 38, height: 38 }}>
                                                                            <Shield size={18} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title={t('common.edit')}>
                                                                        <IconButton onClick={(e) => { handleOpenDrawer(user); e.currentTarget.blur(); }} size="small" sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: '12px', width: 38, height: 38 }}>
                                                                            <Edit3 size={18} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <IconButton onClick={() => handleOpenTermination(user)} size="small" sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.04), borderRadius: '12px', width: 38, height: 38 }}>
                                                                        <Trash2 size={18} />
                                                                    </IconButton>
                                                                </>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                rowsPerPageOptions={[5, 10, 25]}
                                component="div"
                                count={totalCount}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={(e, p) => setPage(p)}
                                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                                labelRowsPerPage={t('common.rows_per_page')}
                            />
                        </>
                    )}
                </Paper>

                <UserDrawer open={drawerOpen} onClose={handleCloseDrawer} onSave={handleSaveUser} user={editUser} t={t} />
                <UserDetailsDialog open={detailsOpen} onClose={() => setDetailsOpen(false)} user={viewUser} />
                <UserTerminationDialog
                    open={terminationOpen}
                    onClose={() => setTerminationOpen(false)}
                    user={terminatingUser}
                    onConfirm={handleTerminateConfirm}
                />
                <UserBundleDrawer
                    open={bundleDrawerOpen}
                    onClose={() => {
                        setBundleDrawerOpen(false);
                        setSelectedUserForBundles(null);
                    }}
                    userId={selectedUserForBundles?.id}
                    userName={selectedUserForBundles ? `${selectedUserForBundles.firstName} ${selectedUserForBundles.lastName}` : null}
                />

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={4000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', borderRadius: '12px', fontWeight: 600 }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>

                {/* Generated password dialog (create & reset) */}
                {passwordInfo && (
                    <Dialog
                        open={!!passwordInfo}
                        onClose={clearPasswordInfo}
                        maxWidth="xs"
                        fullWidth
                    >
                        <DialogTitle sx={{ fontWeight: 800 }}>
                            {passwordInfo.type === 'reset'
                                ? t('users.password_reset_title') || 'Şifre Sıfırlandı'
                                : t('users.password_created_title') || 'Kullanıcı Şifresi Oluşturuldu'}
                        </DialogTitle>
                        <DialogContent dividers>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                {t('users.password_info_message') ||
                                    'Bu şifre yalnızca bu ekranda görüntülenir. Lütfen kullanıcıya güvenli bir kanaldan iletin.'}
                            </Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    px: 2,
                                    py: 1,
                                    borderRadius: '12px',
                                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                                }}
                            >
                                <Typography
                                    variant="subtitle1"
                                    sx={{ fontWeight: 800, fontFamily: 'monospace', mr: 1, wordBreak: 'break-all' }}
                                >
                                    {passwordInfo.password}
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={async () => {
                                        try {
                                            await navigator.clipboard.writeText(passwordInfo.password);
                                        } catch {
                                            // ignore clipboard errors
                                        }
                                    }}
                                >
                                    <Lock size={18} />
                                </IconButton>
                            </Box>
                        </DialogContent>
                        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Button onClick={clearPasswordInfo} variant="contained">
                                {t('common.ok') || 'Tamam'}
                            </Button>
                        </Box>
                    </Dialog>
                )}

                <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
            </Box>
        </ModulePageWrapper>
    );
};

export default UsersPage;
