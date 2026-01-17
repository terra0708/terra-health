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
import { DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import { CustomerDrawer, StatCard, CustomerMobileCard, CustomerDetailsDialog } from '../../modules/customers';
import { useCustomerSettingsStore } from '../../modules/customers/hooks/useCustomerSettingsStore';
import { useCustomerStore } from '../../modules/customers/hooks/useCustomerStore';
import { formatLocaleDate, ALL_COUNTRIES } from '../../modules/customers/data/countries';
import { MOCK_USERS } from '../../modules/users';
import { useLookup } from '../../common/hooks/useLookup';

const CustomersPage = () => {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const { getStatus, getSource, getService, getTag } = useLookup();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const settings = useCustomerSettingsStore();
    const { customers, deleteCustomer, syncWithMockData } = useCustomerStore();
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Verilerin (etiketler vb.) her zaman mock ve ayarlar ile senkron kalmasını sağla
    React.useEffect(() => {
        if (syncWithMockData) syncWithMockData();
        if (settings.repairData) settings.repairData();
    }, []);

    const lang = i18n.language;

    // --- FILTER STATES ---
    // --- FILTER STATES ---
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState([]);
    const [countryFilter, setCountryFilter] = useState([]);
    const [sourceFilter, setSourceFilter] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // --- LOCAL FILTERS (For Apply Button Logic) ---
    const [localFilters, setLocalFilters] = useState({
        status: [], country: [], source: [],
        services: [], tags: [], dateRange: { start: '', end: '' }
    });

    // Sync Main -> Local when opening filters
    React.useEffect(() => {
        if (showFilters) {
            setLocalFilters({
                status: statusFilter, country: countryFilter, source: sourceFilter,
                services: selectedServices, tags: selectedTags, dateRange: dateRange
            });
        }
    }, [showFilters]);

    // --- APPLY FILTERS ---
    const applyFilters = () => {
        setStatusFilter(localFilters.status);
        setCountryFilter(localFilters.country);
        setSourceFilter(localFilters.source);
        setSelectedServices(localFilters.services);
        setSelectedTags(localFilters.tags);
        setDateRange(localFilters.dateRange);
        // setShowFilters(false); // Optional: close panel? Let's keep it open for now
    };

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

        // Reset Main States
        setStatusFilter([]);
        setCountryFilter([]);
        setSourceFilter([]);
        setSelectedServices([]);
        setSelectedTags([]);
        setDateRange({ start: '', end: '' });

        // Reset Local States (if panel is open)
        setLocalFilters({
            status: [], country: [], source: [],
            services: [], tags: [], dateRange: { start: '', end: '' }
        });
    };

    // --- ACTIVE FILTER COUNT ---
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (statusFilter.length > 0) count++;
        if (countryFilter.length > 0) count++;
        if (sourceFilter.length > 0) count++;
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

            const matchesStatus = statusFilter.length === 0 || statusFilter.includes(c.status);
            const matchesCountry = countryFilter.length === 0 || countryFilter.includes(c.country);

            const sourceVal = typeof c.source === 'object' ? c.source?.type : c.source;
            const matchesSource = sourceFilter.length === 0 || sourceFilter.includes(sourceVal);

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
        active: customers.filter(c => ['active', 'process', 'appointment', 'post_op'].includes(c.status)).length,
        pending: customers.filter(c => ['new', 'pending', 'contacted'].includes(c.status)).length,
        completed: customers.filter(c => ['completed', 'sale'].includes(c.status)).length
    };

    const getSourceLabel = (source) => {
        return getSource(typeof source === 'object' ? source?.type : source).label;
    };

    const getLocalizedLabel = (item, type) => {
        if (!item) return '-';
        if (type === 'service') return lang === 'tr' ? item.name_tr : (item.name_en || item.name_tr);
        return lang === 'tr' ? item.label_tr : (item.label_en || item.label_tr);
    };

    const getStatusChip = (statusValue) => {
        const { label, color } = getStatus(statusValue);

        return (
            <Chip
                icon={<Circle size={8} fill="currentColor" />}
                label={label}
                size="small"
                sx={{
                    fontWeight: 800, borderRadius: '8px',
                    bgcolor: alpha(color, 0.08),
                    color: color,
                    border: `1px solid ${alpha(color, 0.2)}`,
                    fontSize: '0.65rem',
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
                                        multiple
                                        value={localFilters.status}
                                        onChange={(e) => setLocalFilters({ ...localFilters, status: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                                        input={<OutlinedInput label={t('common.status')} sx={{ borderRadius: '12px' }} />}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => {
                                                    const s = getStatus(value);
                                                    return <Chip key={value} label={s?.label} size="small" />;
                                                })}
                                            </Box>
                                        )}
                                    >
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
                                        multiple
                                        value={localFilters.country}
                                        onChange={(e) => setLocalFilters({ ...localFilters, country: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                                        input={<OutlinedInput label={t('customers.country')} sx={{ borderRadius: '12px' }} />}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => (
                                                    <Chip key={value} label={ALL_COUNTRIES.find(c => c.code === value)?.name || value} size="small" />
                                                ))}
                                            </Box>
                                        )}
                                    >
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
                                        multiple
                                        value={localFilters.source}
                                        onChange={(e) => setLocalFilters({ ...localFilters, source: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                                        input={<OutlinedInput label={t('customers.source')} sx={{ borderRadius: '12px' }} />}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => {
                                                    const s = getSource(value);
                                                    return <Chip key={value} label={s?.label} size="small" />;
                                                })}
                                            </Box>
                                        )}
                                    >
                                        {settings.sources.map(s => (
                                            <MenuItem key={s.id} value={s.value}>{lang === 'tr' ? s.label_tr : (s.label_en || s.label_tr)}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Stack direction="row" spacing={1} sx={{ height: '40px' }}>
                                    <DatePicker
                                        label={t('common.start_date')}
                                        value={localFilters.dateRange.start ? new Date(localFilters.dateRange.start) : null}
                                        onChange={(newValue) => setLocalFilters({ ...localFilters, dateRange: { ...localFilters.dateRange, start: newValue ? format(newValue, 'yyyy-MM-dd') : '' } })}
                                        slotProps={{
                                            textField: {
                                                size: 'small',
                                                fullWidth: true,
                                                InputLabelProps: { shrink: true, sx: { fontWeight: 700 } },
                                                sx: { flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'background.paper' } }
                                            }
                                        }}
                                    />
                                    <DatePicker
                                        label={t('common.end_date')}
                                        value={localFilters.dateRange.end ? new Date(localFilters.dateRange.end) : null}
                                        onChange={(newValue) => setLocalFilters({ ...localFilters, dateRange: { ...localFilters.dateRange, end: newValue ? format(newValue, 'yyyy-MM-dd') : '' } })}
                                        slotProps={{
                                            textField: {
                                                size: 'small',
                                                fullWidth: true,
                                                InputLabelProps: { shrink: true, sx: { fontWeight: 700 } },
                                                sx: { flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'background.paper' } }
                                            }
                                        }}
                                    />
                                </Stack>
                            </Grid>

                            {/* SERVICES & TAGS (Keeping simplified for brevity, assume similar update or keep existing if not requested strictly. But user said ALL filters. I should update these too if present in grid.) */}
                            {/* Wait, the viewed file showed Service and Tags selects below the date range in the grid? Let's check view_file again if needed. Grid items were 3,3,3,3. There might be more rows. */}
                            {/* Based on previous view, there was Services and Tags. Let's assume they are there and update them. */}
                            <Grid item xs={12} sm={6} md={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ fontWeight: 700 }}>{t('customers.services')}</InputLabel>
                                    <Select
                                        multiple
                                        value={localFilters.services}
                                        onChange={(e) => setLocalFilters({ ...localFilters, services: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                                        input={<OutlinedInput label={t('customers.services')} sx={{ borderRadius: '12px' }} />}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => (
                                                    <Chip key={value} label={getService(value).label} size="small" />
                                                ))}
                                            </Box>
                                        )}
                                    >
                                        {settings.services.map((s) => (
                                            <MenuItem key={s.id} value={s.name_tr}>
                                                {lang === 'tr' ? s.name_tr : (s.name_en || s.name_tr)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6} md={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ fontWeight: 700 }}>{t('common.tags')}</InputLabel>
                                    <Select
                                        multiple
                                        value={localFilters.tags}
                                        onChange={(e) => setLocalFilters({ ...localFilters, tags: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                                        input={<OutlinedInput label={t('common.tags')} sx={{ borderRadius: '12px' }} />}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => (
                                                    <Chip key={value} label={value} size="small" />
                                                ))}
                                            </Box>
                                        )}
                                    >
                                        {settings.tags.map((tag) => (
                                            <MenuItem key={tag.id} value={tag.label_tr}>
                                                <TagIcon size={14} style={{ marginRight: 8 }} />
                                                {lang === 'tr' ? tag.label_tr : (tag.label_en || tag.label_tr)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* APPLY BUTTON ROW */}
                            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                <Button
                                    variant="contained"
                                    onClick={applyFilters}
                                    sx={{
                                        borderRadius: '12px', px: 4, py: 1, fontWeight: 700, textTransform: 'none',
                                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
                                    }}
                                >
                                    {t('common.apply', 'Uygula')}
                                </Button>
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
                        <Table sx={{ minWidth: 1200 }}>
                            <TableHead>
                                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary', pl: 3 }}>{t('customers.registration_date').toUpperCase()}</TableCell>
                                    <TableCell sx={{ width: 60, fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('customers.country').toUpperCase()}</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('customers.customer').toUpperCase()}</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('customers.consultant').toUpperCase()}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('customers.phone').toUpperCase()}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('customers.source').toUpperCase()}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('common.status').toUpperCase()}</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('customers.services').toUpperCase()}</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('customers.tags').toUpperCase()}</TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary', pr: 3 }}>{t('common.actions').toUpperCase()}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((c) => (
                                    <TableRow key={c.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        {/* Date */}
                                        <TableCell sx={{ pl: 3, whiteSpace: 'nowrap' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                                                {formatLocaleDate(c.registrationDate, i18n.language)}
                                            </Typography>
                                        </TableCell>

                                        {/* Country */}
                                        <TableCell>
                                            <Tooltip title={ALL_COUNTRIES.find(x => x.code === c.country)?.name || c.country}>
                                                <Box sx={{
                                                    fontWeight: 700,
                                                    color: 'text.primary',
                                                    bgcolor: alpha(theme.palette.divider, 0.5),
                                                    width: 36, height: 26,
                                                    borderRadius: '6px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    border: `1px solid ${theme.palette.divider}`
                                                }}>
                                                    {c.country}
                                                </Box>
                                            </Tooltip>
                                        </TableCell>

                                        {/* Name */}
                                        <TableCell sx={{ maxWidth: 200 }}>
                                            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                {c.name}
                                            </Typography>
                                        </TableCell>

                                        {/* Consultant */}
                                        <TableCell sx={{ maxWidth: 180 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <UserCheck size={14} color={theme.palette.text.disabled} style={{ flexShrink: 0 }} />
                                                <Typography variant="body2" noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                                                    {MOCK_USERS.find(u => u.id === c.consultantId)?.name || '-'}
                                                </Typography>
                                            </Box>
                                        </TableCell>

                                        {/* Phone */}
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontFamily: 'monospace', letterSpacing: '-0.5px' }}>
                                                    {c.phone || '-'}
                                                </Typography>
                                                {c.phone && (
                                                    <IconButton size="small" onClick={() => navigator.clipboard.writeText(c.phone)} sx={{ p: 0.5, color: 'text.disabled', '&:hover': { color: 'primary.main' } }}>
                                                        <Copy size={12} />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        </TableCell>

                                        {/* Source */}
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                            {(() => {
                                                const sourceVal = typeof c.source === 'object' ? c.source?.type : c.source;
                                                const sourceDef = settings.sources.find(x => x.value === sourceVal);
                                                const sColor = sourceDef?.color || theme.palette.text.secondary;
                                                const sLabel = (lang === 'tr' ? sourceDef?.label_tr : (sourceDef?.label_en || sourceDef?.label_tr)) || sourceDef?.label;
                                                return (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                        <LinkIcon size={12} color={sColor} />
                                                        <Typography variant="caption" sx={{ fontWeight: 700, color: sColor }}>{sLabel || sourceVal || '-'}</Typography>
                                                    </Box>
                                                );
                                            })()}
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{getStatusChip(c.status)}</TableCell>

                                        {/* Services (Limited to 2 + count) */}
                                        <TableCell sx={{ maxWidth: 200 }}>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                                                {c.services?.slice(0, 2).map((sName, i) => {
                                                    const def = settings.services.find(x => x.value === sName || x.name_tr === sName || x.name_en === sName);
                                                    if (!def) return <Chip key={i} label={sName} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />;
                                                    const sColor = def.color || theme.palette.secondary.main;
                                                    const finalLabel = (lang === 'tr' ? def.name_tr : (def.name_en || def.name_tr)) || def.name;
                                                    return (
                                                        <Chip
                                                            key={i}
                                                            label={finalLabel}
                                                            size="small"
                                                            sx={{
                                                                height: 22, fontSize: '0.65rem', fontWeight: 700,
                                                                bgcolor: alpha(sColor, 0.08), color: sColor,
                                                                border: `1px solid ${alpha(sColor, 0.15)}`,
                                                                maxWidth: '100%',
                                                            }}
                                                        />
                                                    );
                                                })}
                                                {c.services?.length > 2 && (
                                                    <Tooltip title={c.services.slice(2).join(', ')}>
                                                        <Chip label={`+${c.services.length - 2}`} size="small" sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700, bgcolor: theme.palette.action.hover }} />
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </TableCell>

                                        {/* Tags (Limited to 2 + count) */}
                                        <TableCell sx={{ maxWidth: 180 }}>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                                                {c.tags?.slice(0, 2).map((tLabel, i) => {
                                                    const tagDef = settings.tags.find(x => x.value === tLabel || x.label_tr === tLabel || x.label_en === tLabel);
                                                    if (!tagDef) return <Chip key={i} label={tLabel} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />;
                                                    const tColor = tagDef.color || theme.palette.text.secondary;
                                                    const finalLabel = (lang === 'tr' ? tagDef.label_tr : (tagDef.label_en || tagDef.label_tr)) || tagDef.label;
                                                    return (
                                                        <Chip
                                                            key={i}
                                                            label={finalLabel}
                                                            size="small"
                                                            sx={{
                                                                height: 22, fontSize: '0.65rem', fontWeight: 700,
                                                                bgcolor: alpha(tColor, 0.08), color: tColor,
                                                                borderRadius: '4px', border: `1px solid ${alpha(tColor, 0.1)}`
                                                            }}
                                                        />
                                                    );
                                                })}
                                                {c.tags?.length > 2 && (
                                                    <Tooltip title={c.tags.slice(2).join(', ')}>
                                                        <Chip label={`+${c.tags.length - 2}`} size="small" sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700, bgcolor: theme.palette.action.hover, borderRadius: '4px' }} />
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </TableCell>

                                        <TableCell align="right" sx={{ pr: 3, whiteSpace: 'nowrap' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                <Tooltip title={t('common.details')}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => { setInfoTarget(c); setDetailsOpen(true); }}
                                                        sx={{ color: 'info.main', bgcolor: alpha(theme.palette.info.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.15) } }}
                                                    >
                                                        <Info size={18} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={t('common.edit')}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => { setEditTarget(c); setDrawerOpen(true); }}
                                                        sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) } }}
                                                    >
                                                        <Edit3 size={18} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={t('common.delete')}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => onDelete(c.id)}
                                                        sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.15) } }}
                                                    >
                                                        <Trash2 size={18} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                <TablePagination component="div" count={filteredCustomers.length} rowsPerPage={rowsPerPage} page={page} onPageChange={(e, p) => setPage(p)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage={t('common.rows_per_page')} />
            </Paper>

            <CustomerDrawer
                open={drawerOpen}
                onClose={() => { setDrawerOpen(false); setEditTarget(null); }}
                customer={editTarget}
                t={t}
            />

            <CustomerDetailsDialog
                open={detailsOpen}
                onClose={() => { setDetailsOpen(false); setInfoTarget(null); }}
                customer={infoTarget}
            />

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
        </Box >
    );
};

export default CustomersPage;
