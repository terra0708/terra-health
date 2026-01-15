import React, { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Button, TextField, InputAdornment,
    Chip, useTheme, alpha, Grid, Tooltip, useMediaQuery, TablePagination,
    Stack, MenuItem
} from '@mui/material';
import {
    Search, Edit3, Trash2, UserPlus, Users as UsersIcon, CheckCircle,
    Clock, Calendar, Tag as TagIcon, Filter, Circle, Copy, Link as LinkIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CustomerDrawer, StatCard, CustomerMobileCard } from '../../modules/customers';
import { useCustomerSettingsStore } from '../../modules/customers/hooks/useCustomerSettingsStore';
import { useCustomerStore } from '../../modules/customers/hooks/useCustomerStore';
import { formatLocaleDate, ALL_COUNTRIES } from '../../modules/customers/data/countries';

const CustomersPage = () => {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const settings = useCustomerSettingsStore();
    const { customers, deleteCustomer, syncWithMockData } = useCustomerStore();

    // Verilerin (etiketler vb.) her zaman mock ve ayarlar ile senkron kalmasını sağla
    React.useEffect(() => {
        if (syncWithMockData) syncWithMockData();
    }, [syncWithMockData]);

    // --- LOCAL STATES ---
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);

    // --- FILTER LOGIC ---
    const filteredCustomers = useMemo(() => {
        return customers.filter(c => {
            const nameMatch = c.name?.toLowerCase().includes(searchTerm.toLowerCase());
            const phoneMatch = c.phone?.includes(searchTerm);
            const matchesSearch = nameMatch || phoneMatch;
            const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [customers, searchTerm, statusFilter]);

    // Statistics Calculation
    const stats = {
        total: customers.length,
        active: customers.filter(c => c.status === 'active').length,
        pending: customers.filter(c => c.status === 'pending').length,
        completed: customers.filter(c => c.status === 'completed').length
    };

    const getStatusChip = (statusValue) => {
        const s = settings.statuses.find(x => x.value === statusValue) || { label: statusValue, color: '#6b7280' };
        return (
            <Chip
                icon={<Circle size={8} fill="currentColor" />}
                label={s.label}
                size="small"
                sx={{
                    fontWeight: 800, borderRadius: '8px', bgcolor: alpha(s.color, 0.08),
                    color: s.color, border: `1px solid ${alpha(s.color, 0.2)}`, fontSize: '0.65rem',
                    '& .MuiChip-icon': { color: 'inherit' }
                }}
            />
        );
    };

    const handleEdit = (customer) => {
        setEditTarget(customer);
        setDrawerOpen(true);
    };

    return (
        <Box sx={{ animation: 'fadeIn 0.6s ease', pb: 4 }}>
            {/* STAT CARDS */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}><StatCard icon={UsersIcon} title={t('customers.total_customers')} value={stats.total} color={theme.palette.primary.main} /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard icon={CheckCircle} title={t('customers.active_customers')} value={stats.active} color={theme.palette.success.main} /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard icon={Clock} title={t('customers.pending_customers')} value={stats.pending} color={theme.palette.warning.main} /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard icon={CheckCircle} title={t('customers.completed_customers')} value={stats.completed} color={theme.palette.info.main} /></Grid>
            </Grid>

            {/* HEADER */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.03em' }}>{t('customers.title')}</Typography>
                <Button
                    variant="contained"
                    startIcon={<UserPlus size={18} />}
                    onClick={() => { setEditTarget(null); setDrawerOpen(true); }}
                    sx={{
                        borderRadius: '16px', px: 3, py: 1.2, fontWeight: 800,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.25)}`
                    }}
                >
                    {t('customers.add_customer')}
                </Button>
            </Box>

            {/* FILTERS */}
            <Paper elevation={0} sx={{ borderRadius: '24px', p: 2, mb: 3, border: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 2 }}>
                <TextField
                    placeholder={t('common.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    variant="standard"
                    sx={{ flex: 1, '& .MuiInput-underline:before, & .MuiInput-underline:after': { display: 'none' } }}
                    InputProps={{ startAdornment: <Search size={18} style={{ marginRight: 8, opacity: 0.5 }} /> }}
                />
                <TextField
                    select
                    size="small"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    InputProps={{ startAdornment: <Filter size={16} style={{ marginRight: 8 }} /> }}
                >
                    <MenuItem value="all">{t('customers.filter.all')}</MenuItem>
                    {settings.statuses.map(s => <MenuItem key={s.id} value={s.value}>{s.label}</MenuItem>)}
                </TextField>
            </Paper>

            {/* DATA CONTENT */}
            <Paper elevation={0} sx={{ borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}>
                {isMobile ? (
                    <Box sx={{ p: 2 }}>
                        {filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((c) => (
                            <CustomerMobileCard key={c.id} customer={c} t={t} theme={theme} onEdit={handleEdit} getStatusChip={getStatusChip} />
                        ))}
                    </Box>
                ) : (
                    <TableContainer>
                        <Table sx={{ minWidth: 1300 }}>
                            <TableHead>
                                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary', pl: 4 }}>{t('customers.registration_date').toUpperCase()}</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('customers.country').toUpperCase()}</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('customers.customer').toUpperCase()}</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('customers.phone').toUpperCase()}</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('customers.source').toUpperCase()}</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('common.status').toUpperCase()}</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('customers.services').toUpperCase()}</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('customers.tags').toUpperCase()}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary', pr: 4 }}>{t('common.actions').toUpperCase()}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((c) => (
                                    <TableRow key={c.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell sx={{ pl: 4 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Calendar size={14} color={theme.palette.text.secondary} />
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatLocaleDate(c.registrationDate, i18n.language)}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title={ALL_COUNTRIES.find(x => x.code === c.country)?.name || c.country}>
                                                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', bgcolor: alpha(theme.palette.divider, 0.4), px: 1, py: 0.5, borderRadius: '6px', width: 'fit-content' }}>
                                                    {c.country}
                                                </Typography>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 800 }}>{c.name}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>{c.phone || '-'}</Typography>
                                                {c.phone && <IconButton size="small" onClick={() => navigator.clipboard.writeText(c.phone)} sx={{ p: 0.5 }}><Copy size={12} /></IconButton>}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {(() => {
                                                const sourceVal = typeof c.source === 'object' ? c.source?.type : c.source;
                                                const sourceDef = settings.sources.find(x => x.value === sourceVal);
                                                const sColor = sourceDef?.color || theme.palette.text.secondary;
                                                return (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <LinkIcon size={14} color={sColor} />
                                                        <Typography variant="body2" sx={{ fontWeight: 700, color: sColor }}>
                                                            {sourceDef?.label || sourceVal || '-'}
                                                        </Typography>
                                                    </Box>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell>{getStatusChip(c.status)}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {c.services?.map((sName, i) => {
                                                    const def = settings.services.find(x => x.name === sName);
                                                    if (!def) return null; // Panelde yoksa gösterme
                                                    const sColor = def.color || theme.palette.secondary.main;
                                                    return <Chip key={i} label={sName} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 900, bgcolor: alpha(sColor, 0.1), color: sColor, border: `1px solid ${alpha(sColor, 0.2)}` }} />;
                                                })}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {c.tags?.map((tLabel, i) => {
                                                    const tagDef = settings.tags.find(x => x.label === tLabel);
                                                    if (!tagDef) return null; // Panelde yoksa gösterme
                                                    const tColor = tagDef.color || theme.palette.text.secondary;
                                                    return <Chip key={i} label={tLabel} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 900, bgcolor: alpha(tColor, 0.1), color: tColor, borderRadius: '4px' }} />;
                                                })}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right" sx={{ pr: 4 }}>
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <IconButton onClick={() => handleEdit(c)} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), color: 'primary.main', borderRadius: '10px' }} size="small"><Edit3 size={16} /></IconButton>
                                                <IconButton onClick={() => deleteCustomer(c.id)} sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), color: 'error.main', borderRadius: '10px' }} size="small"><Trash2 size={16} /></IconButton>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                <TablePagination
                    component="div"
                    count={filteredCustomers.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, p) => setPage(p)}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    labelRowsPerPage={t('common.rows_per_page')}
                />
            </Paper>

            <CustomerDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} customer={editTarget} t={t} />
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </Box>
    );
};

export default CustomersPage;
