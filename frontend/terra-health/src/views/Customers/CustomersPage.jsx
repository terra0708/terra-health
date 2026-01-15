import React, { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Button, TextField,
    Chip, useTheme, alpha, Grid, Tooltip, useMediaQuery, TablePagination,
    Stack, MenuItem, FormControl, InputLabel, Select, OutlinedInput,
    Badge, Collapse, Divider, Snackbar, Alert
} from '@mui/material';
import {
    Search, Edit3, Trash2, UserPlus, Users as UsersIcon, CheckCircle,
    Clock, Calendar, Tag as TagIcon, Filter, Circle, Copy, Link as LinkIcon,
    ChevronDown, ChevronUp, RotateCcw, Info, UserCheck
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CustomerDrawer, StatCard, CustomerMobileCard, CustomerDetailsDialog } from '../../modules/customers';
import { useCustomerSettingsStore } from '../../modules/customers/hooks/useCustomerSettingsStore';
import { useCustomerStore } from '../../modules/customers/hooks/useCustomerStore';
import { formatLocaleDate, ALL_COUNTRIES } from '../../modules/customers/data/countries';
import { MOCK_USERS } from '../../modules/users';

const CustomersPage = () => {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const settings = useCustomerSettingsStore();
    const { customers, deleteCustomer, syncWithMockData } = useCustomerStore();
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Verilerin (etiketler vb.) her zaman mock ve ayarlar ile senkron kalmasını sağla
    React.useEffect(() => {
        if (syncWithMockData) syncWithMockData();
        if (settings.repairData) settings.repairData();
    }, []); // Sadece ilk açılışta 1 kere çalışması yeterlidir.

    const lang = i18n.language;

    // --- FILTER STATES ---
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [countryFilter, setCountryFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [selectedServices, setSelectedServices] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // --- PAGINATION STATES ---
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [infoTarget, setInfoTarget] = useState(null);

    // --- RESET FILTERS ---
    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setCountryFilter('all');
        setSourceFilter('all');
        setSelectedServices([]);
        setSelectedTags([]);
        setDateRange({ start: '', end: '' });
    };

    // --- ACTIVE FILTER COUNT ---
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (statusFilter !== 'all') count++;
        if (countryFilter !== 'all') count++;
        if (sourceFilter !== 'all') count++;
        if (selectedServices.length > 0) count++;
        if (selectedTags.length > 0) count++;
        if (dateRange.start || dateRange.end) count++;
        return count;
    }, [statusFilter, countryFilter, sourceFilter, selectedServices, selectedTags, dateRange]);

    // --- FILTER LOGIC ---
    const filteredCustomers = useMemo(() => {
        return customers.filter(c => {
            const nameMatch = c.name?.toLowerCase().includes(searchTerm.toLowerCase());
            const phoneMatch = c.phone?.includes(searchTerm);
            const matchesSearch = nameMatch || phoneMatch;

            const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
            const matchesCountry = countryFilter === 'all' || c.country === countryFilter;

            const sourceVal = typeof c.source === 'object' ? c.source?.type : c.source;
            const matchesSource = sourceFilter === 'all' || sourceVal === sourceFilter;

            const matchesServices = selectedServices.length === 0 ||
                selectedServices.every(s => c.services?.includes(s));

            const matchesTags = selectedTags.length === 0 ||
                selectedTags.some(t => c.tags?.includes(t));

            let matchesDate = true;
            if (dateRange.start || dateRange.end) {
                const regDate = new Date(c.registrationDate);
                if (dateRange.start && regDate < new Date(dateRange.start)) matchesDate = false;
                if (dateRange.end && regDate > new Date(dateRange.end)) matchesDate = false;
            }

            return matchesSearch && matchesStatus && matchesCountry && matchesSource && matchesServices && matchesTags && matchesDate;
        });
    }, [customers, searchTerm, statusFilter, countryFilter, sourceFilter, selectedServices, selectedTags, dateRange]);

    // Statistics Calculation
    const stats = {
        total: customers.length,
        active: customers.filter(c => c.status === 'active').length,
        pending: customers.filter(c => c.status === 'pending').length,
        completed: customers.filter(c => c.status === 'completed').length
    };

    const getLocalizedLabel = (item, type) => {
        if (!item) return '-';
        if (type === 'service') return lang === 'tr' ? item.name_tr : (item.name_en || item.name_tr);
        return lang === 'tr' ? item.label_tr : (item.label_en || item.label_tr);
    };

    const getStatusChip = (statusValue) => {
        const s = settings.statuses.find(x => x.value === statusValue);
        if (!s) return <Chip label={statusValue} size="small" />;

        const label = (lang === 'tr' ? s.label_tr : (s.label_en || s.label_tr)) || s.label || statusValue;
        return (
            <Chip
                icon={<Circle size={8} fill="currentColor" />}
                label={label}
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

    const handleInfo = (customer) => {
        setInfoTarget(customer);
        setDetailsOpen(true);
    };


    const onDelete = (id) => {
        deleteCustomer(id);
        setSnackbar({ open: true, message: t('common.success_delete'), severity: 'success' });
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

            {/* ADVANCED FILTERS SECTION */}
            <Paper elevation={0} sx={{ borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, mb: 3, overflow: 'hidden' }}>
                <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        placeholder={t('common.search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        variant="outlined"
                        size="small"
                        sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        InputProps={{ startAdornment: <Search size={18} style={{ marginRight: 8, opacity: 0.5 }} /> }}
                    />
                    <Badge badgeContent={activeFilterCount} color="primary" sx={{ '& .MuiBadge-badge': { fontWeight: 900 } }}>
                        <Button
                            variant={showFilters ? "contained" : "outlined"}
                            startIcon={<Filter size={18} />}
                            onClick={() => setShowFilters(!showFilters)}
                            endIcon={showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            sx={{ borderRadius: '12px', transition: 'all 0.3s' }}
                        >
                            {t('common.filters')}
                        </Button>
                    </Badge>
                    {(activeFilterCount > 0 || searchTerm) && (
                        <IconButton onClick={resetFilters} sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), color: 'error.main' }}>
                            <RotateCcw size={18} />
                        </IconButton>
                    )}
                </Box>

                <Collapse in={showFilters}>
                    <Divider />
                    <Box sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.01) }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ fontWeight: 700 }}>{t('common.status')}</InputLabel>
                                    <Select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        label={t('common.status')}
                                        sx={{ borderRadius: '12px' }}
                                    >
                                        <MenuItem value="all">{t('customers.filter.all')}</MenuItem>
                                        {settings.statuses.map(s => (
                                            <MenuItem key={s.id} value={s.value}>{lang === 'tr' ? s.label_tr : (s.label_en || s.label_tr)}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ fontWeight: 700 }}>{t('customers.country')}</InputLabel>
                                    <Select
                                        value={countryFilter}
                                        onChange={(e) => setCountryFilter(e.target.value)}
                                        label={t('customers.country')}
                                        sx={{ borderRadius: '12px' }}
                                    >
                                        <MenuItem value="all">{t('customers.filter.all')}</MenuItem>
                                        {ALL_COUNTRIES.map(c => (
                                            <MenuItem key={c.code} value={c.code}>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <span>{c.flag}</span> {c.name}
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ fontWeight: 700 }}>{t('customers.source')}</InputLabel>
                                    <Select
                                        value={sourceFilter}
                                        onChange={(e) => setSourceFilter(e.target.value)}
                                        label={t('customers.source')}
                                        sx={{ borderRadius: '12px' }}
                                    >
                                        <MenuItem value="all">{t('customers.filter.all')}</MenuItem>
                                        {settings.sources.map(s => (
                                            <MenuItem key={s.id} value={s.value}>{lang === 'tr' ? s.label_tr : (s.label_en || s.label_tr)}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Stack direction="row" spacing={1} sx={{ height: '40px' }}>
                                    <TextField
                                        type="date"
                                        size="small"
                                        label={t('common.start_date')}
                                        InputLabelProps={{ shrink: true }}
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                        sx={{
                                            flex: 1,
                                            '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'background.paper' },
                                            '& .MuiInputLabel-root': { fontWeight: 700 }
                                        }}
                                    />
                                    <TextField
                                        type="date"
                                        size="small"
                                        label={t('common.end_date')}
                                        InputLabelProps={{ shrink: true }}
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                        sx={{
                                            flex: 1,
                                            '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'background.paper' },
                                            '& .MuiInputLabel-root': { fontWeight: 700 }
                                        }}
                                    />
                                </Stack>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ fontWeight: 700 }}>{t('customers.services')}</InputLabel>
                                    <Select
                                        multiple value={selectedServices} onChange={(e) => setSelectedServices(e.target.value)}
                                        input={<OutlinedInput label={t('customers.services')} sx={{ borderRadius: '12px' }} />}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selectedServices.map((val) => {
                                                    const s = settings.services.find(x => x.name_tr === val || x.name_en === val);
                                                    return <Chip key={val} label={getLocalizedLabel(s, 'service')} size="small" />;
                                                })}
                                            </Box>
                                        )}
                                    >
                                        {settings.services.map((s) => (
                                            <MenuItem key={s.id} value={lang === 'tr' ? s.name_tr : (s.name_en || s.name_tr)}>{getLocalizedLabel(s, 'service')}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ fontWeight: 700 }}>{t('customers.tags')}</InputLabel>
                                    <Select
                                        multiple value={selectedTags} onChange={(e) => setSelectedTags(e.target.value)}
                                        input={<OutlinedInput label={t('customers.tags')} sx={{ borderRadius: '12px' }} />}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((val) => {
                                                    const tag = settings.tags.find(x => x.label_tr === val || x.label_en === val);
                                                    return <Chip key={val} label={getLocalizedLabel(tag)} size="small" />;
                                                })}
                                            </Box>
                                        )}
                                    >
                                        {settings.tags.map((t) => (
                                            <MenuItem key={t.id} value={lang === 'tr' ? t.label_tr : (t.label_en || t.label_tr)}>{getLocalizedLabel(t)}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Box>
                </Collapse>
            </Paper>

            {/* DATA CONTENT */}
            <Paper elevation={0} sx={{ borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}>
                {isMobile ? (
                    <Box sx={{ p: 2 }}>
                        {filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((c) => (
                            <CustomerMobileCard key={c.id} customer={c} t={t} theme={theme} onEdit={handleEdit} onInfo={handleInfo} getStatusChip={getStatusChip} />
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
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('customers.consultant').toUpperCase()}</TableCell>
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
                                                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', bgcolor: alpha(theme.palette.divider, 0.4), px: 1, py: 0.5, borderRadius: '6px', width: 'fit-content' }}>{c.country}</Typography>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell><Typography variant="body2" sx={{ fontWeight: 800 }}>{c.name}</Typography></TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <UserCheck size={14} color={theme.palette.secondary.main} />
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                                    {MOCK_USERS.find(u => u.id === c.consultantId)?.name || '-'}
                                                </Typography>
                                            </Box>
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
                                                const sLabel = (lang === 'tr' ? sourceDef?.label_tr : (sourceDef?.label_en || sourceDef?.label_tr)) || sourceDef?.label;
                                                return (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <LinkIcon size={14} color={sColor} />
                                                        <Typography variant="body2" sx={{ fontWeight: 700, color: sColor }}>{sLabel || sourceVal || '-'}</Typography>
                                                    </Box>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell>{getStatusChip(c.status)}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {c.services?.map((sName, i) => {
                                                    const def = settings.services.find(x => x.name_tr === sName || x.name_en === sName || x.name === sName);
                                                    if (!def) return <Chip key={i} label={sName} size="small" />;
                                                    const sColor = def.color || theme.palette.secondary.main;
                                                    const finalLabel = (lang === 'tr' ? def.name_tr : (def.name_en || def.name_tr)) || def.name;
                                                    return <Chip key={i} label={finalLabel} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 900, bgcolor: alpha(sColor, 0.1), color: sColor, border: `1px solid ${alpha(sColor, 0.2)}` }} />;
                                                })}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {c.tags?.map((tLabel, i) => {
                                                    const tagDef = settings.tags.find(x => x.label_tr === tLabel || x.label_en === tLabel || x.label === tLabel);
                                                    if (!tagDef) return <Chip key={i} label={tLabel} size="small" />;
                                                    const tColor = tagDef.color || theme.palette.text.secondary;
                                                    const finalLabel = (lang === 'tr' ? tagDef.label_tr : (tagDef.label_en || tagDef.label_tr)) || tagDef.label;
                                                    return <Chip key={i} label={finalLabel} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 900, bgcolor: alpha(tColor, 0.1), color: tColor, borderRadius: '4px' }} />;
                                                })}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right" sx={{ pr: 4 }}>
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <IconButton onClick={() => handleInfo(c)} sx={{ bgcolor: alpha(theme.palette.info.main, 0.05), color: 'info.main', borderRadius: '10px' }} size="small"><Info size={16} /></IconButton>
                                                <IconButton onClick={() => handleEdit(c)} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), color: 'primary.main', borderRadius: '10px' }} size="small"><Edit3 size={16} /></IconButton>
                                                <IconButton onClick={() => onDelete(c.id)} sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), color: 'error.main', borderRadius: '10px' }} size="small"><Trash2 size={16} /></IconButton>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                <TablePagination component="div" count={filteredCustomers.length} rowsPerPage={rowsPerPage} page={page} onPageChange={(e, p) => setPage(p)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage={t('common.rows_per_page')} />
            </Paper>

            <CustomerDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} customer={editTarget} t={t} />
            <CustomerDetailsDialog open={detailsOpen} onClose={() => setDetailsOpen(false)} customer={infoTarget} />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', borderRadius: '12px', fontWeight: 600 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </Box>
    );
};

export default CustomersPage;
