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
    Stack
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
    LogOut
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    UserDrawer,
    UserMobileCard,
    StatCard,
    useUsers
} from '../../modules/users';

const UsersPage = () => {
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
        setRowsPerPage
    } = useUsers();

    const getRoleChip = (role) => {
        const configs = {
            admin: { color: theme.palette.error.main, label: t('users.roles.admin'), icon: <ShieldCheck size={14} /> },
            doctor: { color: theme.palette.secondary.main, label: t('users.roles.doctor'), icon: <UserCheck size={14} /> },
            staff: { color: theme.palette.primary.main, label: t('users.roles.staff'), icon: <UsersIcon size={14} /> },
        };
        const config = configs[role] || configs.staff;
        return <Chip icon={config.icon} label={config.label} size="small" sx={{ fontWeight: 700, borderRadius: '10px', bgcolor: alpha(config.color, 0.05), color: config.color, border: `1px solid ${alpha(config.color, 0.12)}`, fontSize: '0.75rem', '& .MuiChip-icon': { color: 'inherit' } }} />;
    };

    return (
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

                {isMobile ? (
                    <Box sx={{ p: 2 }}>
                        {filteredUsers.map(user => (
                            <UserMobileCard
                                key={user.id}
                                user={user}
                                t={t}
                                theme={theme}
                                onEdit={(u) => handleOpenDrawer(u)}
                                getRoleChip={getRoleChip}
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
                                        <TableCell sx={{ py: 2.5, pl: 4, fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('common.name')}</TableCell>
                                        <TableCell sx={{ py: 2.5, fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('common.phone')}</TableCell>
                                        <TableCell sx={{ py: 2.5, fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('common.role')}</TableCell>
                                        <TableCell sx={{ py: 2.5, fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('common.joining_date')}</TableCell>
                                        <TableCell sx={{ py: 2.5, fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('common.leaving_date')}</TableCell>
                                        <TableCell align="right" sx={{ py: 2.5, pr: 4, fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('common.actions')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.id} sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.01) } }}>
                                            <TableCell sx={{ py: 2.5, pl: 4 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar src={user.avatar} sx={{ width: 48, height: 48, borderRadius: '14px', border: `2px solid ${theme.palette.background.paper}` }} />
                                                    <Box><Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>{user.name}</Typography><Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>{user.email}</Typography></Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Phone size={14} strokeWidth={2.5} color={theme.palette.text.secondary} /><Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{user.phone}</Typography></Box></TableCell>
                                            <TableCell>{getRoleChip(user.role)}</TableCell>
                                            <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Calendar size={14} strokeWidth={2.5} color={theme.palette.text.secondary} /><Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{user.joined}</Typography></Box></TableCell>
                                            <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: user.left === '-' ? theme.palette.text.disabled : theme.palette.error.main }}><LogOut size={14} strokeWidth={2.5} /><Typography variant="body2" sx={{ fontWeight: 600 }}>{user.left}</Typography></Box></TableCell>
                                            <TableCell align="right" sx={{ pr: 4 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.2 }}>
                                                    <Tooltip title={t('common.edit')}><IconButton onClick={(e) => { handleOpenDrawer(user); e.currentTarget.blur(); }} size="small" sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: '12px', width: 38, height: 38 }}><Edit3 size={18} /></IconButton></Tooltip>
                                                    <IconButton size="small" sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.04), borderRadius: '12px', width: 38, height: 38 }}><Trash2 size={18} /></IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
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

            <UserDrawer open={drawerOpen} onClose={handleCloseDrawer} user={editUser} t={t} />

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </Box>
    );
};

export default UsersPage;
