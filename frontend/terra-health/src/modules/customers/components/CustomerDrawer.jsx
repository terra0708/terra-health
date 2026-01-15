import React, { useState, useEffect, useRef } from 'react';
import {
    Drawer, Box, Typography, TextField, Button, IconButton, Stack,
    MenuItem, FormControl, InputLabel, Select, OutlinedInput, Chip,
    alpha, useTheme, Divider, Snackbar, Alert, Tabs, Tab, Switch, FormControlLabel,
    List, ListItem, ListItemText, LinearProgress, useMediaQuery, Paper, Tooltip
} from '@mui/material';
import {
    X, Save, User, Phone, Mail, Calendar, FileText, Bell, Activity,
    Plus, Trash2, Upload, AlertCircle, CreditCard, ChevronRight,
    Filter, Info, CheckCircle2, Plane, Hotel, Car, Edit2, Check
} from 'lucide-react';
import { useCustomerSettingsStore } from '../hooks/useCustomerSettingsStore';
import { useCustomerStore } from '../hooks/useCustomerStore';
import { ALL_COUNTRIES } from '../data/countries';
import { useTranslation } from 'react-i18next';
import { MOCK_USERS } from '../../users';

export const CustomerDrawer = ({ open, onClose, customer, t }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const { i18n } = useTranslation();
    const settings = useCustomerSettingsStore();
    const { customers, addCustomer, updateCustomer } = useCustomerStore();
    const lang = i18n.language;
    const fileInputRef = useRef(null);

    const [tabValue, setTabValue] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFileCategory, setSelectedFileCategory] = useState('');
    const [pendingFiles, setPendingFiles] = useState([]);

    useEffect(() => {
        if (settings.fileCategories.length > 0 && !selectedFileCategory) {
            setSelectedFileCategory(settings.fileCategories[0].label_tr);
        }
    }, [settings.fileCategories, selectedFileCategory]);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        country: 'TR',
        notes: [],
        registrationDate: new Date().toISOString().split('T')[0],
        consultantId: '',
        category: '',
        services: [],
        status: 'active',
        source: '',
        reminder: {
            active: false,
            time: '',
            notes: []
        },
        files: [],
        payments: []
    });

    const [duplicates, setDuplicates] = useState({ phone: false, email: false });
    const [newNote, setNewNote] = useState('');
    const [newReminderNote, setNewReminderNote] = useState('');
    const [newPaymentNote, setNewPaymentNote] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        if (customer) {
            setFormData({
                ...customer,
                notes: customer.notes || [],
                reminder: customer.reminder || { active: false, time: '', notes: [] },
                files: customer.files || [],
                payments: customer.payments || []
            });
        } else {
            setFormData({
                name: '', phone: '', email: '', country: 'TR',
                notes: [],
                registrationDate: new Date().toISOString().split('T')[0],
                source: settings.sources[0]?.value || '',
                status: settings.statuses[0]?.value || 'active',
                consultantId: '',
                category: '',
                services: [],
                reminder: { active: false, time: '', notes: [] },
                files: [],
                payments: []
            });
        }
        setDuplicates({ phone: false, email: false });
        setTabValue(0);
        setPendingFiles([]);
    }, [customer, open, settings]);

    // Çakışma Kontrolü
    useEffect(() => {
        if (!open) return;

        const checkDuplicates = () => {
            const otherCustomers = customers.filter(c => c.id !== customer?.id);
            const phoneDup = formData.phone && otherCustomers.some(c => c.phone === formData.phone);
            const emailDup = formData.email && otherCustomers.some(c => c.email?.toLowerCase() === formData.email?.toLowerCase());
            setDuplicates({ phone: !!phoneDup, email: !!emailDup });
        };

        const timer = setTimeout(checkDuplicates, 300);
        return () => clearTimeout(timer);
    }, [formData.phone, formData.email, customers, customer, open]);

    const handleChange = (field) => (e) => {
        setFormData({ ...formData, [field]: e.target.value });
    };

    const handleReminderChange = (field) => (e) => {
        const val = field === 'active' ? e.target.checked : e.target.value;
        setFormData({
            ...formData,
            reminder: { ...formData.reminder, [field]: val }
        });
    };

    const handleFileSelection = (files) => {
        const selected = Array.from(files).map(f => {
            const lastDotIndex = f.name.lastIndexOf('.');
            const name = lastDotIndex !== -1 ? f.name.substring(0, lastDotIndex) : f.name;
            const extension = lastDotIndex !== -1 ? f.name.substring(lastDotIndex + 1) : '';

            return {
                id: Math.random().toString(36).substr(2, 9),
                originalFile: f,
                displayName: name,
                extension: extension,
                size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
                category: selectedFileCategory,
                date: new Date().toLocaleDateString()
            };
        });
        setPendingFiles(prev => [...prev, ...selected]);
    };

    const handlePendingFileNameChange = (id, newName) => {
        setPendingFiles(prev => prev.map(f => f.id === id ? { ...f, displayName: newName } : f));
    };

    const removePendingFile = (id) => {
        setPendingFiles(prev => prev.filter(f => f.id !== id));
    };

    const confirmUpload = () => {
        if (pendingFiles.length === 0) return;
        setUploading(true);
        setTimeout(() => {
            const newFiles = pendingFiles.map(pf => ({
                id: Date.now() + Math.random(),
                name: pf.displayName + (pf.extension ? '.' + pf.extension : ''),
                size: pf.size,
                category: pf.category,
                date: pf.date
            }));
            setFormData(prev => ({ ...prev, files: [...newFiles, ...prev.files] }));
            setPendingFiles([]);
            setUploading(false);
            setSnackbar({ open: true, message: t('common.success_save'), severity: 'success' });
        }, 1000);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) handleFileSelection(e.dataTransfer.files);
    };

    const handleAddNote = () => {
        if (!newNote.trim()) return;
        const note = { id: Date.now(), text: newNote, date: new Date().toLocaleString() };
        setFormData({ ...formData, notes: [note, ...formData.notes] });
        setNewNote('');
    };

    const handleAddReminderNote = () => {
        if (!newReminderNote.trim()) return;
        const note = { id: Date.now(), text: newReminderNote, date: new Date().toLocaleString() };
        setFormData({ ...formData, reminder: { ...formData.reminder, notes: [note, ...formData.reminder.notes] } });
        setNewReminderNote('');
    };

    const handleAddPaymentNote = () => {
        if (!newPaymentNote.trim()) return;
        const note = { id: Date.now(), text: newPaymentNote, date: new Date().toLocaleString() };
        setFormData({ ...formData, payments: [note, ...formData.payments] });
        setNewPaymentNote('');
    };

    const handleSave = () => {
        if (duplicates.phone || duplicates.email) {
            setSnackbar({ open: true, message: t('customers.error_check_fields'), severity: 'warning' });
            return;
        }
        if (customer) {
            updateCustomer(customer.id, formData);
        } else {
            addCustomer(formData);
        }
        setSnackbar({ open: true, message: t('common.success_save'), severity: 'success' });
        setTimeout(() => onClose(), 800);
    };

    const getLocalizedLabel = (item) => {
        if (!item) return '';
        return lang === 'tr' ? item.label_tr || item.name_tr : (item.label_en || item.name_en || item.label_tr || item.name_tr);
    };

    const tabs = [
        { label: t('customers.personal_info'), icon: <User size={18} />, color: theme.palette.primary.main },
        { label: t('customers.status_info'), icon: <Activity size={18} />, color: '#10b981' },
        { label: t('customers.reminder_info'), icon: <Bell size={18} />, color: '#f59e0b' },
        { label: t('customers.files_info'), icon: <FileText size={18} />, color: '#3b82f6' },
        { label: t('customers.payments'), icon: <CreditCard size={18} />, color: '#8b5cf6' },
    ];

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            disableEnforceFocus
            sx={{
                zIndex: theme.zIndex.drawer + 2,
                '& .MuiBackdrop-root': { backdropFilter: 'blur(4px)', bgcolor: alpha(theme.palette.common.black, 0.4) }
            }}
            PaperProps={{
                sx: {
                    width: { xs: '100%', sm: 800, md: 850 },
                    borderLeft: 'none',
                    boxShadow: '-10px 0 40px rgba(0,0,0,0.2)',
                    bgcolor: 'background.default',
                    overflow: 'hidden'
                }
            }}
        >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box sx={{
                    p: { xs: 2, sm: 3 }, px: { xs: 2, sm: 4 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.03) : alpha(theme.palette.primary.main, 0.02),
                    borderBottom: `2px solid ${theme.palette.divider}`
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
                        <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'primary.main', color: 'white', display: 'flex' }}>
                            <User size={isMobile ? 20 : 24} />
                        </Box>
                        <Box>
                            <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontWeight: 900, letterSpacing: '-0.02em', color: 'text.primary', lineHeight: 1.2 }}>
                                {customer ? t('customers.edit_customer') : t('customers.add_customer')}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                                {customer ? `ID: #${customer.id}` : t('customers.form_subtitle')}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} sx={{ bgcolor: alpha(theme.palette.error.main, 0.08), color: 'error.main', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.15) } }}>
                        <X size={20} />
                    </IconButton>
                </Box>

                <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* Sidebar Tabs */}
                    <Box sx={{
                        width: { xs: 70, sm: 240 }, borderRight: `1px solid ${theme.palette.divider}`,
                        bgcolor: theme.palette.mode === 'dark' ? alpha('#000', 0.1) : alpha('#f8fafc', 0.8),
                        display: 'flex', flexDirection: 'column', py: 3
                    }}>
                        <Tabs
                            orientation="vertical" value={tabValue} onChange={(e, v) => setTabValue(v)}
                            sx={{
                                '& .MuiTabs-indicator': { left: 0, right: 'auto', width: 4, borderRadius: '0 4px 4px 0', bgcolor: tabs[tabValue].color },
                                '& .MuiTab-root': {
                                    alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start',
                                    minHeight: { xs: 56, sm: 64 }, py: 2, px: { xs: 0, sm: 4 }, mb: 1, mx: { xs: 0.5, sm: 1 },
                                    borderRadius: '12px', textTransform: 'none', fontWeight: 800, fontSize: '0.9rem', color: 'text.secondary',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', minWidth: 0,
                                    '&.Mui-selected': { color: tabs[tabValue].color, bgcolor: alpha(tabs[tabValue].color, 0.08) },
                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04), color: 'primary.main' }
                                }
                            }}
                        >
                            {tabs.map((tab, i) => (
                                <Tab key={i} icon={tab.icon} iconPosition={isMobile ? "top" : "start"} label={!isMobile && tab.label} />
                            ))}
                        </Tabs>
                    </Box>

                    {/* Content Section */}
                    <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2.5, sm: 4, md: 6 }, bgcolor: 'background.paper' }}>
                        <Box sx={{ maxWidth: 650, mx: 'auto' }}>
                            <Box sx={{ mb: 4 }}>
                                <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 900, mb: 1 }}>{tabs[tabValue].label}</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                    {tabValue === 0 && t('customers.drawer.personal_desc')}
                                    {tabValue === 1 && t('customers.drawer.status_desc')}
                                    {tabValue === 2 && t('customers.drawer.reminder_desc')}
                                    {tabValue === 3 && t('customers.drawer.files_desc')}
                                    {tabValue === 4 && t('customers.drawer.payments_desc')}
                                </Typography>
                            </Box>

                            {tabValue === 0 && (
                                <Stack spacing={3}>
                                    {(duplicates.phone || duplicates.email) && !customer && (
                                        <Alert severity="error" sx={{ borderRadius: '16px', fontWeight: 700 }}>
                                            {duplicates.phone && <div>• {t('customers.duplicate_phone')}</div>}
                                            {duplicates.email && <div>• {t('customers.duplicate_email')}</div>}
                                        </Alert>
                                    )}
                                    <TextField fullWidth label={t('common.name')} value={formData.name} onChange={handleChange('name')} InputProps={{ sx: { borderRadius: '16px' }, startAdornment: <User size={18} style={{ marginRight: 12, opacity: 0.5 }} /> }} />
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                        <TextField select label={t('customers.country')} value={formData.country} onChange={handleChange('country')} sx={{ width: { xs: '100%', sm: '160px' } }} InputProps={{ sx: { borderRadius: '16px' } }}>
                                            {ALL_COUNTRIES.map((c) => <MenuItem key={c.code} value={c.code}>{c.flag} {c.code}</MenuItem>)}
                                        </TextField>
                                        <TextField fullWidth label={t('customers.phone')} value={formData.phone} onChange={handleChange('phone')} error={duplicates.phone} helperText={duplicates.phone ? t('customers.phone_number') : ''} sx={{ flex: 1, minWidth: { xs: '100%', sm: '200px' } }} InputProps={{ sx: { borderRadius: '16px' }, startAdornment: <Phone size={18} style={{ marginRight: 12, opacity: 0.5 }} /> }} />
                                    </Box>
                                    <TextField fullWidth label={t('customers.email')} value={formData.email} onChange={handleChange('email')} error={duplicates.email} InputProps={{ sx: { borderRadius: '16px' }, startAdornment: <Mail size={18} style={{ marginRight: 12, opacity: 0.5 }} /> }} />
                                    <TextField fullWidth type="date" label={t('customers.registration_date')} value={formData.registrationDate} onChange={handleChange('registrationDate')} InputLabelProps={{ shrink: true }} InputProps={{ sx: { borderRadius: '16px' }, startAdornment: <Calendar size={18} style={{ marginRight: 12, opacity: 0.5 }} /> }} />
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2, color: 'primary.main' }}>{t('customers.notes')}</Typography>
                                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                            <TextField fullWidth size="small" placeholder={t('customers.drawer.note_placeholder')} value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddNote()} InputProps={{ sx: { borderRadius: '12px' } }} />
                                            <Button variant="contained" onClick={handleAddNote} sx={{ borderRadius: '12px', minWidth: 48 }}><Plus size={20} /></Button>
                                        </Stack>
                                        <Stack spacing={1.5}>
                                            {formData.notes.map((note) => (
                                                <Paper key={note.id} elevation={0} sx={{ p: 2, borderRadius: '16px', bgcolor: alpha(theme.palette.primary.main, 0.02), border: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between' }}>
                                                    <Box sx={{ flex: 1, pr: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>{note.text}</Typography>
                                                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>{note.date}</Typography>
                                                    </Box>
                                                    <IconButton size="small" color="error" onClick={() => setFormData({ ...formData, notes: formData.notes.filter(n => n.id !== note.id) })} sx={{ alignSelf: 'flex-start' }}><Trash2 size={14} /></IconButton>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    </Box>
                                </Stack>
                            )}

                            {tabValue === 1 && (
                                <Stack spacing={3}>
                                    <TextField select fullWidth label={t('customers.consultant')} value={formData.consultantId} onChange={handleChange('consultantId')} InputProps={{ sx: { borderRadius: '16px' } }}>
                                        <MenuItem value=""><em>{t('customers.drawer.no_assignment')}</em></MenuItem>
                                        {MOCK_USERS.filter(u => u.role === 'consultant').map((u) => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
                                    </TextField>
                                    <TextField select fullWidth label={t('customers.category')} value={formData.category} onChange={handleChange('category')} InputProps={{ sx: { borderRadius: '16px' } }}>
                                        {settings.categories.map((c) => <MenuItem key={c.id} value={c.label_tr}>{getLocalizedLabel(c)}</MenuItem>)}
                                    </TextField>
                                    <FormControl fullWidth>
                                        <InputLabel>{t('customers.services')}</InputLabel>
                                        <Select multiple value={formData.services} onChange={handleChange('services')} input={<OutlinedInput label={t('customers.services')} sx={{ borderRadius: '16px' }} />} renderValue={(selected) => <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{selected.map((val) => <Chip key={val} label={val} size="small" />)}</Box>}>
                                            {settings.services.map((s) => <MenuItem key={s.id} value={s.name_tr}>{getLocalizedLabel(s)}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                        <TextField select fullWidth label={t('common.status')} value={formData.status} onChange={handleChange('status')} sx={{ flex: 1, minWidth: { xs: '100%', sm: '45%' } }} InputProps={{ sx: { borderRadius: '16px' } }}>
                                            {settings.statuses.map((s) => <MenuItem key={s.id} value={s.value}>{getLocalizedLabel(s)}</MenuItem>)}
                                        </TextField>
                                        <TextField select fullWidth label={t('customers.source')} value={formData.source} onChange={handleChange('source')} sx={{ flex: 1, minWidth: { xs: '100%', sm: '45%' } }} InputProps={{ sx: { borderRadius: '16px' } }}>
                                            {settings.sources.map((s) => <MenuItem key={s.id} value={s.value}>{getLocalizedLabel(s)}</MenuItem>)}
                                        </TextField>
                                    </Box>
                                </Stack>
                            )}

                            {tabValue === 2 && (
                                <Stack spacing={4}>
                                    <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: '24px', bgcolor: alpha(theme.palette.warning.main, 0.04) }}>
                                        <FormControlLabel control={<Switch checked={formData.reminder.active} onChange={handleReminderChange('active')} color="warning" />} label={<Typography variant="body1" sx={{ fontWeight: 700 }}>{t('customers.reminder_active')}</Typography>} />
                                        <TextField fullWidth type="datetime-local" label={t('customers.reminder_time')} value={formData.reminder.time} onChange={handleReminderChange('time')} InputLabelProps={{ shrink: true }} disabled={!formData.reminder.active} sx={{ mt: 3 }} />
                                    </Paper>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2 }}>{t('customers.reminder_note')}</Typography>
                                        {formData.reminder.notes.map((note) => (
                                            <Paper key={note.id} elevation={0} sx={{ p: 2, mb: 1.5, borderRadius: '16px', border: `1px solid ${theme.palette.divider}` }}>
                                                <Typography variant="body2">{note.text}</Typography>
                                                <Typography variant="caption">{note.date}</Typography>
                                            </Paper>
                                        ))}
                                    </Box>
                                </Stack>
                            )}

                            {tabValue === 3 && (
                                <Stack spacing={4}>
                                    {/* Scrollable Category Selection */}
                                    <Box sx={{ width: '100%', borderBottom: 1, borderColor: 'divider' }}>
                                        <Tabs
                                            value={settings.fileCategories.findIndex(c => c.label_tr === selectedFileCategory)}
                                            variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile
                                            onChange={(e, v) => setSelectedFileCategory(settings.fileCategories[v].label_tr)}
                                            sx={{
                                                '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
                                                '& .MuiTab-root': {
                                                    minHeight: 48, textTransform: 'none', fontWeight: 800, fontSize: '0.85rem', color: 'text.secondary',
                                                    '&.Mui-selected': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.04) }
                                                }
                                            }}
                                        >
                                            {settings.fileCategories.map((cat) => <Tab key={cat.id} label={getLocalizedLabel(cat)} />)}
                                        </Tabs>
                                    </Box>


                                    {/* Drag & Drop Area */}
                                    <Box
                                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)} onDrop={onDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        sx={{
                                            p: { xs: 4, sm: 6 }, border: `2px dashed ${isDragging ? theme.palette.primary.main : theme.palette.divider}`, borderRadius: '32px', textAlign: 'center',
                                            bgcolor: isDragging ? alpha(theme.palette.primary.main, 0.05) : alpha(theme.palette.primary.main, 0.01), cursor: 'pointer',
                                            '&:hover': { transform: 'scale(1.01)', borderColor: 'primary.main' }, transition: 'all 0.3s'
                                        }}
                                    >
                                        <input type="file" multiple hidden ref={fileInputRef} onChange={(e) => e.target.files && handleFileSelection(e.target.files)} />
                                        <Upload size={isMobile ? 24 : 32} style={{ marginBottom: 12, color: theme.palette.primary.main }} />
                                        <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 900, mb: 1 }}>{isDragging ? t('customers.drop_to_upload') : t('customers.drawer.click_to_select')}</Typography>
                                        <Chip label={getLocalizedLabel(settings.fileCategories.find(c => c.label_tr === selectedFileCategory))} size="small" sx={{ fontWeight: 900, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }} />
                                    </Box>

                                    {/* Pending Files Area (Where naming happens) */}
                                    {pendingFiles.length > 0 && (
                                        <Box sx={{ p: 3, borderRadius: '24px', bgcolor: alpha(theme.palette.primary.main, 0.02), border: `1px solid ${theme.palette.primary.light}` }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Filter size={18} /> {t('customers.drawer.name_files')}
                                            </Typography>
                                            <Stack spacing={2}>
                                                {pendingFiles.map((pf) => (
                                                    <Paper key={pf.id} elevation={0} sx={{ p: 2, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Box sx={{ flex: 1 }}>
                                                            <TextField
                                                                fullWidth size="small" variant="standard" label={t('customers.drawer.file_name')}
                                                                value={pf.displayName} onChange={(e) => handlePendingFileNameChange(pf.id, e.target.value)}
                                                                helperText={`.${pf.extension} | ${pf.size}`}
                                                                InputProps={{ disableUnderline: false, sx: { fontWeight: 700 } }}
                                                            />
                                                        </Box>
                                                        <IconButton size="small" color="error" onClick={() => removePendingFile(pf.id)}><Trash2 size={16} /></IconButton>
                                                    </Paper>
                                                ))}
                                                <Button
                                                    variant="contained" fullWidth onClick={confirmUpload}
                                                    startIcon={uploading ? null : <CheckCircle2 size={18} />}
                                                    sx={{ borderRadius: '12px', py: 1.5, fontWeight: 900 }}
                                                >
                                                    {uploading ? t('customers.drawer.saving') : t('customers.drawer.add_multiple_to_system', { count: pendingFiles.length })}
                                                </Button>
                                            </Stack>
                                        </Box>
                                    )}

                                    {/* Categorized File List */}
                                    <Box>
                                        {settings.fileCategories.map(cat => {
                                            const categoryFiles = formData.files.filter(f => f.category === cat.label_tr);
                                            if (categoryFiles.length === 0) return null;
                                            return (
                                                <Box key={cat.id} sx={{ mb: 3 }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary', textTransform: 'uppercase', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <ChevronRight size={14} /> {getLocalizedLabel(cat)}
                                                    </Typography>
                                                    <Stack spacing={1}>
                                                        {categoryFiles.map((file) => (
                                                            <Paper key={file.id} elevation={0} sx={{ p: 2, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 2 }}>
                                                                <FileText size={20} style={{ flexShrink: 0 }} />
                                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                    <Typography variant="body2" sx={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</Typography>
                                                                    <Typography variant="caption">{file.size} • {file.date}</Typography>
                                                                </Box>
                                                                <IconButton size="small" color="error" onClick={() => setFormData({ ...formData, files: formData.files.filter(f => f.id !== file.id) })}><Trash2 size={16} /></IconButton>
                                                            </Paper>
                                                        ))}
                                                    </Stack>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </Stack>
                            )}

                            {tabValue === 4 && (
                                <Stack spacing={4}>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2, color: 'success.main' }}>{t('customers.payments')}</Typography>
                                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                            <TextField fullWidth size="small" placeholder={t('customers.drawer.payment_note_placeholder')} value={newPaymentNote} onChange={(e) => setNewPaymentNote(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddPaymentNote()} InputProps={{ sx: { borderRadius: '12px' } }} />
                                            <Button variant="contained" color="success" onClick={handleAddPaymentNote} sx={{ borderRadius: '12px', minWidth: 48 }}><Plus size={20} /></Button>
                                        </Stack>
                                        <Stack spacing={1.5}>
                                            {formData.payments.map((note) => (
                                                <Paper key={note.id} elevation={0} sx={{ p: 2.5, mb: 1, borderRadius: '16px', border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`, bgcolor: alpha(theme.palette.success.main, 0.02) }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{note.text}</Typography>
                                                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>{note.date}</Typography>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    </Box>
                                </Stack>
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* Footer Buttons */}
                <Box sx={{ p: { xs: 2, sm: 3 }, px: { xs: 2, sm: 6 }, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper', display: 'flex', justifyContent: 'flex-end', gap: { xs: 1, sm: 3 } }}>
                    <Button onClick={onClose} variant="text" sx={{ fontWeight: 900, color: 'text.secondary', px: { xs: 2, sm: 4 } }}>{t('common.cancel')}</Button>
                    <Button variant="contained" onClick={handleSave} startIcon={<Save size={20} />} sx={{ borderRadius: '16px', px: { xs: 3, sm: 6 }, py: 1.5, fontWeight: 900 }}>{t('common.save')}</Button>
                </Box>
            </Box>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onFlush={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Drawer>
    );
};
