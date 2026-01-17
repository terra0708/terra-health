import React, { useState, useMemo, useEffect, memo, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    IconButton,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    useTheme,
    alpha,
    Stack,
    TablePagination,
    Tooltip,
    Fade,
    Avatar,
    MenuItem,
    Autocomplete,
    Alert,
    Divider,
    Grid,
    Badge,
    Collapse,
    FormControl,
    InputLabel,
    Select,
    OutlinedInput
} from '@mui/material';
import {
    Activity,
    AlertTriangle,
    Clock,
    Plus,
    RefreshCw,
    Search,
    Tag,
    Filter,
    ChevronDown,
    ChevronUp,
    RotateCcw
} from 'lucide-react';
import { DatePicker } from '@mui/x-date-pickers';
import { useTranslation } from 'react-i18next';
import { useCustomerStore } from '../../modules/customers/hooks/useCustomerStore';
import { useReminderStore } from '../../modules/reminders/hooks/useReminderStore';
import { useReminderSettingsStore } from '../../modules/reminders/hooks/useReminderSettingsStore';
import { CustomerDetailsDialog } from '../../modules/customers';
import { format, isPast, isValid } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { ReminderCard } from '../../modules/reminders/components/ReminderCard';

// --- Separate Components ---

const AddReminderDialog = ({ open, onClose, onAdd, customers, categories, subCategories, statuses, editingReminder }) => {
    const { t, i18n } = useTranslation();
    const theme = useTheme();

    // Find default 'pending' status
    const defaultStatus = statuses.find(s => s.id === 'pending') || statuses[0];

    const [formData, setFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        note: '',
        categoryId: 'personal',
        subCategoryId: '',
        statusId: defaultStatus?.id || '',
        customerId: null,
        customerName: ''
    });

    useEffect(() => {
        if (open) {
            if (editingReminder) {
                setFormData({
                    title: editingReminder.title || editingReminder.text,
                    date: editingReminder.date,
                    time: editingReminder.time,
                    note: editingReminder.note,
                    categoryId: editingReminder.categoryId || 'personal',
                    subCategoryId: editingReminder.subCategoryId || '',
                    statusId: editingReminder.statusId || defaultStatus?.id,
                    customerId: editingReminder.customer?.id || null,
                    customerName: editingReminder.customer?.name || ''
                });
            } else {
                setFormData({
                    title: '',
                    date: new Date().toISOString().split('T')[0],
                    time: '09:00',
                    note: '',
                    categoryId: 'personal',
                    subCategoryId: '',
                    statusId: defaultStatus?.id || '',
                    customerId: null,
                    customerName: ''
                });
            }
        }
    }, [open, editingReminder, defaultStatus]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        if (!formData.title) return;
        if (formData.categoryId === 'customer' && !formData.customerId) {
            alert(t('reminders.select_customer_error', 'Lütfen bir müşteri seçiniz'));
            return;
        }

        const selectedStatus = statuses.find(s => s.id === formData.statusId);

        onAdd({
            ...formData,
            id: editingReminder?.id,
            type: editingReminder?.type,
            isCompleted: selectedStatus ? selectedStatus.isCompleted : false
        });
        onClose();
    };

    const getDisplayName = (item) => i18n.language === 'tr' ? item.label_tr : (item.label_en || item.label_tr);
    const availableSubCategories = subCategories.filter(s => s.categoryId === formData.categoryId);
    const selectedCategory = categories.find(c => c.id === formData.categoryId);

    return (
        <Dialog
            open={open} onClose={onClose}
            PaperProps={{ sx: { borderRadius: 3, width: '100%', maxWidth: 500 } }}
        >
            <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem' }}>
                {editingReminder ? t('common.edit', 'Düzenle') : t('reminders.add_new')}
            </DialogTitle>
            <DialogContent>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    {editingReminder && editingReminder.type === 'customer' && (
                        <Alert severity="info" icon={<AlertTriangle size={20} />} sx={{ borderRadius: 2 }}>
                            {t('reminders.editing_customer_record', 'Bir Müşteri Kaydını Düzenliyorsunuz. Değişiklikler müşteri profiline de yansıyacaktır.')}
                        </Alert>
                    )}

                    <TextField
                        select fullWidth label={t('common.category', 'Kategori')}
                        value={formData.categoryId}
                        onChange={(e) => { handleChange('categoryId', e.target.value); handleChange('subCategoryId', ''); }}
                        variant="outlined"
                        disabled={!!editingReminder && editingReminder.type === 'customer'}
                    >
                        {categories.map((cat) => (
                            <MenuItem key={cat.id} value={cat.id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: cat.color }} />
                                    {getDisplayName(cat)}
                                </Box>
                            </MenuItem>
                        ))}
                    </TextField>

                    {availableSubCategories.length > 0 && (
                        <TextField
                            select fullWidth label={t('common.sub_category', 'Alt Başlık / Etiket')}
                            value={formData.subCategoryId}
                            onChange={(e) => handleChange('subCategoryId', e.target.value)}
                            variant="outlined"
                        >
                            <MenuItem value=""><em>{t('common.none', 'Yok')}</em></MenuItem>
                            {availableSubCategories.map((sub) => (
                                <MenuItem key={sub.id} value={sub.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Tag size={14} color={sub.color} />
                                        {getDisplayName(sub)}
                                    </Box>
                                </MenuItem>
                            ))}
                        </TextField>
                    )}

                    <TextField
                        select fullWidth label={t('common.status', 'Durum')}
                        value={formData.statusId}
                        onChange={(e) => handleChange('statusId', e.target.value)}
                        variant="outlined"
                    >
                        {statuses.map((stat) => (
                            <MenuItem key={stat.id} value={stat.id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Activity size={14} color={stat.color} />
                                    {getDisplayName(stat)}
                                </Box>
                            </MenuItem>
                        ))}
                    </TextField>

                    {formData.categoryId === 'customer' && (
                        <Autocomplete
                            options={customers}
                            getOptionLabel={(option) => option.name}
                            value={customers.find(c => c.id === formData.customerId) || null}
                            onChange={(event, newValue) => {
                                handleChange('customerId', newValue ? newValue.id : null);
                                handleChange('customerName', newValue ? newValue.name : '');
                                if (newValue && !editingReminder) {
                                    handleChange('title', `${t('reminders.meeting_with', 'Görüşme')}: ${newValue.name}`);
                                }
                            }}
                            renderInput={(params) => <TextField {...params} label={t('customers.customer', 'Müşteri')} variant="outlined" placeholder={t('common.search')} />}
                            disabled={!!(editingReminder && editingReminder.type === 'customer')}
                        />
                    )}

                    <TextField
                        fullWidth label={t('common.title', 'Başlık')}
                        value={formData.title} onChange={(e) => handleChange('title', e.target.value)}
                        variant="outlined" InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                        fullWidth multiline rows={3} label={t('common.note', 'Not')}
                        value={formData.note} onChange={(e) => handleChange('note', e.target.value)}
                        variant="outlined" InputLabelProps={{ shrink: true }}
                    />

                    <Stack direction="row" spacing={2}>
                        <TextField
                            fullWidth type="date" label={t('common.date', 'Tarih')}
                            value={formData.date} onChange={(e) => handleChange('date', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            fullWidth type="time" label={t('common.time', 'Saat')}
                            value={formData.time} onChange={(e) => handleChange('time', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} sx={{ fontWeight: 600, color: 'text.secondary', borderRadius: 2 }}>{t('common.cancel')}</Button>
                <Button
                    onClick={handleSubmit} variant="contained" disabled={!formData.title}
                    sx={{
                        fontWeight: 700, px: 4, py: 1, borderRadius: 2,
                        bgcolor: selectedCategory?.color || theme.palette.primary.main,
                        '&:hover': { bgcolor: alpha(selectedCategory?.color || theme.palette.primary.main, 0.8) }
                    }}
                >
                    {t('common.save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const RemindersPage = () => {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const navigate = useNavigate();

    // Stores
    const { customers, deleteCustomerNote, updateCustomerNote, addCustomerNote, generateRandomReminders, syncWithMockData } = useCustomerStore();
    const { personalReminders, addPersonalReminder, updatePersonalReminder, deletePersonalReminder } = useReminderStore();
    const { categories, subCategories, statuses } = useReminderSettingsStore();

    // State
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [editingReminder, setEditingReminder] = useState(null);
    const [currentTab, setCurrentTab] = useState([]); // Filter Status Array
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Advanced Filters State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');
    const [filterCategory, setFilterCategory] = useState([]); // Filter Category Array
    const [filterSubCategory, setFilterSubCategory] = useState([]); // Filter SubCategory Array
    const [showFilters, setShowFilters] = useState(false); // Yeni Filtre State

    // --- LOCAL FILTERS (For Apply Button Logic) ---
    const [localFilters, setLocalFilters] = useState({
        status: [],
        category: [],
        subCategory: [],
        dateStart: '',
        dateEnd: ''
    });

    // Sync Main -> Local when opening filters
    useEffect(() => {
        if (showFilters) {
            setLocalFilters({
                status: currentTab,
                category: filterCategory,
                subCategory: filterSubCategory,
                dateStart: filterDateStart,
                dateEnd: filterDateEnd
            });
        }
    }, [showFilters]); // Minimal deps for open trigger

    const applyFilters = () => {
        setCurrentTab(localFilters.status);
        setFilterCategory(localFilters.category);
        setFilterSubCategory(localFilters.subCategory);
        setFilterDateStart(localFilters.dateStart);
        setFilterDateEnd(localFilters.dateEnd);
        setPage(0);
    };

    // Active Filter Count
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (currentTab.length > 0) count++;
        if (filterDateStart) count++;
        if (filterDateEnd) count++;
        if (filterCategory.length > 0) count++;
        if (filterSubCategory.length > 0) count++;
        return count;
    }, [currentTab, filterDateStart, filterDateEnd, filterCategory, filterSubCategory]);

    const resetFilters = () => {
        setSearchQuery('');
        setFilterDateStart('');
        setFilterDateEnd('');
        setFilterCategory([]);
        setFilterSubCategory([]);
        setCurrentTab([]);

        setLocalFilters({
            status: [],
            category: [],
            subCategory: [],
            dateStart: '',
            dateEnd: ''
        });
    };

    // Initial Sync
    useEffect(() => {
        syncWithMockData(); // Ensure mock data with standardized structure is loaded
        const totalReminders = personalReminders.length + customers.reduce((acc, c) => acc + (c.reminder?.notes?.length || 0), 0);
        if (totalReminders === 0) generateRandomReminders();
    }, []);

    const allReminders = useMemo(() => {
        const customerReminders = customers.flatMap(c =>
            (c.reminder?.notes || []).map(note => ({
                ...note, // Now standard structure, just spread it
                type: 'customer',
                customer: c,
                source: 'CRM'
            }))
        );

        const personal = personalReminders.map(r => ({ ...r, type: 'personal', source: 'Personal' }));

        return [...customerReminders, ...personal].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (!isValid(dateA)) return 1; // Hatalı tarihler sona
            if (!isValid(dateB)) return -1;
            return dateA - dateB;
        });
    }, [customers, personalReminders]);

    const filteredReminders = useMemo(() => {
        let filtered = allReminders;

        // 1. Tab Filter (Status)
        if (currentTab.length > 0) {
            const hasOverdue = currentTab.includes('overdue');
            const statusIds = currentTab.filter(s => s !== 'overdue');

            filtered = filtered.filter(r => {
                let match = false;
                if (statusIds.length > 0 && statusIds.includes(r.statusId)) match = true;
                if (hasOverdue && !r.isCompleted && isPast(new Date(`${r.date}T${r.time || '00:00'}`))) match = true;
                return match;
            });
        }

        // 2. Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(r =>
                (r.title && r.title.toLowerCase().includes(query)) ||
                (r.note && r.note.toLowerCase().includes(query)) ||
                (r.customer && r.customer.name && r.customer.name.toLowerCase().includes(query))
            );
        }

        // 3. Date Range Filter
        if (filterDateStart) {
            filtered = filtered.filter(r => r.date >= filterDateStart);
        }
        if (filterDateEnd) {
            filtered = filtered.filter(r => r.date <= filterDateEnd);
        }

        // 4. Category Filter
        if (filterCategory.length > 0) {
            filtered = filtered.filter(r => filterCategory.includes(r.categoryId));
        }

        // 5. SubCategory Filter
        if (filterSubCategory.length > 0) {
            filtered = filtered.filter(r => filterSubCategory.includes(r.subCategoryId));
        }

        return filtered;
    }, [allReminders, currentTab, searchQuery, filterDateStart, filterDateEnd, filterCategory, filterSubCategory]);

    const paginatedReminders = useMemo(() => {
        return filteredReminders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredReminders, page, rowsPerPage]);

    const handleAddSubmit = useCallback((data) => {
        // Data is now uniform coming from Dialog
        if (data.categoryId === 'customer' && data.customerId) {
            // Customer Note
            const noteData = { ...data, type: 'customer' };
            if (data.id && data.type === 'customer') updateCustomerNote(data.customerId, data.id, noteData);
            else addCustomerNote(data.customerId, noteData);
        } else {
            // Personal Reminder
            const reminderData = { ...data, type: 'personal' };
            if (data.id && data.type === 'personal') updatePersonalReminder(data.id, reminderData);
            else addPersonalReminder(reminderData);
        }
    }, [addCustomerNote, updateCustomerNote, addPersonalReminder, updatePersonalReminder]);

    const handleDelete = useCallback((reminder) => {
        if (reminder.type === 'customer') {
            if (window.confirm(t('reminders.delete_confirm'))) deleteCustomerNote(reminder.customer.id, reminder.id);
        } else deletePersonalReminder(reminder.id);
    }, [deleteCustomerNote, deletePersonalReminder, t]);

    const handleChangeStatus = useCallback((reminder, newStatusId) => {
        const newStatus = statuses.find(s => s.id === newStatusId);
        const isCompleted = newStatus ? newStatus.isCompleted : false;

        if (reminder.type === 'customer') {
            updateCustomerNote(reminder.customer.id, reminder.id, {
                statusId: newStatusId,
                isCompleted: isCompleted
            });
        } else {
            updatePersonalReminder(reminder.id, {
                statusId: newStatusId,
                isCompleted: isCompleted
            });
        }
    }, [statuses, updateCustomerNote, updatePersonalReminder]);


    const handleEdit = useCallback((reminder) => {
        setEditingReminder(reminder);
        setOpenAddDialog(true);
    }, []);

    const handleShowInfo = useCallback((customer) => {
        setSelectedCustomer(customer);
        setDetailsOpen(true);
    }, []);

    const getDisplayName = (item) => item ? (i18n.language === 'tr' ? item.label_tr : (item.label_en || item.label_tr)) : '';

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight={900} sx={{ mb: 1, background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {t('reminders.title')}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>{t('reminders.subtitle', ' ')}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" startIcon={<RefreshCw size={18} />} onClick={generateRandomReminders} sx={{ borderRadius: 3, fontWeight: 600, textTransform: 'none' }}>Demo</Button>
                    <Button
                        variant="contained" startIcon={<Plus size={20} />}
                        onClick={() => { setEditingReminder(null); setOpenAddDialog(true); }}
                        sx={{ borderRadius: 3, px: 3, py: 1.5, fontWeight: 700, textTransform: 'none', background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}` }}
                    >
                        {t('reminders.add_new')}
                    </Button>
                </Box>
            </Box>

            {/* --- Advanced Filter Bar (Customers Style) --- */}
            <Paper elevation={0} sx={{ borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, mb: 3, overflow: 'hidden' }}>
                <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        placeholder={t('common.search', 'Ara...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
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
                            sx={{ borderRadius: '12px', transition: 'all 0.3s', whiteSpace: 'nowrap', minWidth: 'fit-content' }}
                        >
                            {t('common.filters', 'Filtreler')}
                        </Button>
                    </Badge>
                    {(activeFilterCount > 0 || searchQuery) && (
                        <IconButton onClick={resetFilters} sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), color: 'error.main' }}>
                            <RotateCcw size={18} />
                        </IconButton>
                    )}
                </Box>

                <Collapse in={showFilters}>
                    <Divider />
                    <Box sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.01) }}>
                        <Grid container spacing={3}>
                            {/* Durum */}
                            <Grid item xs={12} sm={6} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ fontWeight: 700 }}>{t('common.status', 'Durum')}</InputLabel>
                                    <Select
                                        multiple
                                        value={localFilters.status}
                                        onChange={(e) => setLocalFilters({ ...localFilters, status: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                                        input={<OutlinedInput label={t('common.status', 'Durum')} sx={{ borderRadius: '12px' }} />}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => {
                                                    const stat = statuses.find(s => s.id === value) || { label_tr: value, color: '#999' };
                                                    const handleDelete = (e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setLocalFilters({ ...localFilters, status: localFilters.status.filter(s => s !== value) });
                                                    };
                                                    return (
                                                        <Chip
                                                            key={value} label={getDisplayName(stat)} size="small" onDelete={handleDelete} onMouseDown={(e) => e.stopPropagation()}
                                                            sx={{ borderRadius: '8px', fontWeight: 700, bgcolor: alpha(stat.color, 0.1), color: stat.color, border: `1px solid ${alpha(stat.color, 0.2)}` }}
                                                        />
                                                    );
                                                })}
                                            </Box>
                                        )}
                                    >
                                        {statuses.map(s => <MenuItem key={s.id} value={s.id}>{getDisplayName(s)}</MenuItem>)}
                                        <MenuItem value="overdue">{t('common.overdue', 'Gecikmiş')}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Kategori */}
                            <Grid item xs={12} sm={6} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ fontWeight: 700 }}>{t('common.category', 'Kategori')}</InputLabel>
                                    <Select
                                        multiple
                                        value={localFilters.category}
                                        onChange={(e) => setLocalFilters({ ...localFilters, category: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                                        input={<OutlinedInput label={t('common.category', 'Kategori')} sx={{ borderRadius: '12px' }} />}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => {
                                                    const cat = categories.find(c => c.id === value);
                                                    const handleDelete = (e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setLocalFilters({ ...localFilters, category: localFilters.category.filter(c => c !== value) });
                                                    };
                                                    return (
                                                        <Chip
                                                            key={value} label={getDisplayName(cat)} size="small" onDelete={handleDelete} onMouseDown={(e) => e.stopPropagation()}
                                                            sx={{ borderRadius: '8px', fontWeight: 700, bgcolor: alpha(cat?.color || '#999', 0.1), color: cat?.color || '#666', border: `1px solid ${alpha(cat?.color || '#999', 0.2)}` }}
                                                        />
                                                    );
                                                })}
                                            </Box>
                                        )}
                                    >
                                        {categories.map(c => <MenuItem key={c.id} value={c.id}>{getDisplayName(c)}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Alt Kategori */}
                            <Grid item xs={12} sm={6} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ fontWeight: 700 }}>{t('common.subcategory', 'Alt Kategori')}</InputLabel>
                                    <Select
                                        multiple
                                        value={localFilters.subCategory}
                                        onChange={(e) => setLocalFilters({ ...localFilters, subCategory: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                                        disabled={localFilters.category.length === 0}
                                        input={<OutlinedInput label={t('common.subcategory', 'Alt Kategori')} sx={{ borderRadius: '12px' }} />}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => {
                                                    const s = subCategories.find(x => x.id === value);
                                                    const color = s?.color || theme.palette.text.secondary;
                                                    const handleDelete = (e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        const newSub = localFilters.subCategory.filter(item => item !== value);
                                                        setLocalFilters({ ...localFilters, subCategory: newSub });
                                                    };
                                                    return (
                                                        <Chip
                                                            key={value} label={getDisplayName(s)} size="small" onDelete={handleDelete} onMouseDown={(e) => e.stopPropagation()}
                                                            sx={{ borderRadius: '8px', fontWeight: 700, bgcolor: alpha(color, 0.1), color: color, border: `1px solid ${alpha(color, 0.2)}` }}
                                                        />
                                                    );
                                                })}
                                            </Box>
                                        )}
                                    >
                                        {subCategories.filter(s => localFilters.category.includes(s.categoryId)).map(s => (
                                            <MenuItem key={s.id} value={s.id}>{getDisplayName(s)}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Tarih Aralığı */}
                            <Grid item xs={12} sm={6} md={3}>
                                <Stack direction="row" spacing={1} sx={{ height: '40px' }}>
                                    <DatePicker
                                        label={t('common.start_date', 'Başlangıç')}
                                        value={localFilters.dateStart ? new Date(localFilters.dateStart) : null}
                                        onChange={(newValue) => setLocalFilters({ ...localFilters, dateStart: newValue ? format(newValue, 'yyyy-MM-dd') : '' })}
                                        slotProps={{
                                            textField: {
                                                size: 'small', fullWidth: true, InputLabelProps: { shrink: true },
                                                sx: { flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'background.paper' } }
                                            }
                                        }}
                                    />
                                    <DatePicker
                                        label={t('common.end_date', 'Bitiş')}
                                        value={localFilters.dateEnd ? new Date(localFilters.dateEnd) : null}
                                        onChange={(newValue) => setLocalFilters({ ...localFilters, dateEnd: newValue ? format(newValue, 'yyyy-MM-dd') : '' })}
                                        slotProps={{
                                            textField: {
                                                size: 'small', fullWidth: true, InputLabelProps: { shrink: true },
                                                sx: { flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'background.paper' } }
                                            }
                                        }}
                                    />
                                </Stack>
                            </Grid>

                            {/* APPLY BUTTON */}
                            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                <Button
                                    variant="contained" onClick={applyFilters}
                                    sx={{ borderRadius: '12px', px: 4, py: 1, fontWeight: 700, textTransform: 'none', background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)` }}
                                >
                                    {t('common.apply', 'Uygula')}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Collapse>
            </Paper>

            <Box sx={{ minHeight: 400 }}>
                {paginatedReminders.length > 0 ? (
                    paginatedReminders.map(reminder => (
                        <ReminderCard
                            key={`${reminder.type}-${reminder.id}`}
                            reminder={reminder}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onShowInfo={handleShowInfo}
                            onChangeStatus={handleChangeStatus}
                            t={t} i18n={i18n}
                            categories={categories} subCategories={subCategories} statuses={statuses}
                        />
                    ))
                ) : (
                    <Box sx={{ textAlign: 'center', py: 10, bgcolor: 'background.paper', borderRadius: 4, border: `1px dashed ${theme.palette.divider}` }}>
                        <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.05), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                            <Clock size={40} color={theme.palette.primary.main} style={{ opacity: 0.5 }} />
                        </Box>
                        <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>{t('reminders.no_scheduled_reminders')}</Typography>
                        <Typography variant="body2" color="text.secondary">{t('reminders.empty_state_desc')}</Typography>
                    </Box>
                )}
            </Box>

            <TablePagination
                component="div"
                count={filteredReminders.length}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                }}
                labelRowsPerPage={t('common.rows_per_page')}
                sx={{ borderTop: `1px solid ${theme.palette.divider}`, mt: 2 }}
            />

            <AddReminderDialog
                open={openAddDialog}
                onClose={() => setOpenAddDialog(false)}
                onAdd={handleAddSubmit}
                editingReminder={editingReminder}
                customers={customers}
                statuses={statuses}
                categories={categories}
                subCategories={subCategories}
            />

            {selectedCustomer && (
                <CustomerDetailsDialog
                    open={detailsOpen}
                    onClose={() => setDetailsOpen(false)}
                    customer={selectedCustomer}
                />
            )}
        </Box>
    );
};

export default RemindersPage;
