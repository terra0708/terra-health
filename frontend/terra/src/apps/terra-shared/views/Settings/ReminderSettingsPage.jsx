import React, { useState, useMemo, useCallback } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Paper,
    Button,
    IconButton,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    alpha,
    useTheme,
    Grid,
    Stack,
    MenuItem,
    Alert,
    Select,
    FormControl,
    InputLabel,
    Snackbar,
    Tooltip,
    useMediaQuery,
    Switch,
    FormControlLabel
} from '@mui/material';
import {
    Plus,
    Edit2,
    Trash2,
    Layers,
    Tag,
    AlertTriangle,
    ArrowRight,
    Languages,
    Palette,
    Activity
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useReminderSettingsStore } from '@shared/modules/reminders';

// Reuse Color Picker
const COLOR_PALETTE = ['#a259ff', '#00d2ff', '#10b981', '#f59e0b', '#ef4444', '#f472b6', '#3b82f6', '#6b7280', '#fbbf24', '#8b5cf6', '#06b6d4', '#f97316'];

const CustomColorPicker = ({ value, onChange, label }) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const [localColor, setLocalColor] = useState(value);

    React.useEffect(() => {
        setLocalColor(value);
    }, [value]);

    const handlePickerChange = (e) => {
        const newColor = e.target.value;
        setLocalColor(newColor);
        onChange(newColor);
    };

    return (
        <Box sx={{ mt: 2, p: 2, borderRadius: '20px', border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.default, 0.4) }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Palette size={18} style={{ color: theme.palette.primary.main }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{label}</Typography>
            </Box>
            <Grid container spacing={1.5} alignItems="center">
                {COLOR_PALETTE.map((c) => (
                    <Grid item key={c}>
                        <Box
                            onClick={() => onChange(c)}
                            sx={{
                                width: 36, height: 36, borderRadius: '12px', bgcolor: c, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '3px solid transparent',
                                borderColor: value === c ? theme.palette.text.primary : 'transparent',
                                boxShadow: value === c ? `0 0 12px ${alpha(c, 0.5)}` : 'none',
                                transform: value === c ? 'scale(1.1)' : 'scale(1)',
                                transition: 'all 0.2s',
                                '&:hover': { transform: 'scale(1.15)' }
                            }}
                        >
                            {value === c && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'white' }} />}
                        </Box>
                    </Grid>
                ))}
            </Grid>
            <Box sx={{ mt: 3, pt: 2, borderTop: `1px dashed ${theme.palette.divider}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        component="input" type="color" value={localColor || '#a259ff'} onChange={handlePickerChange}
                        sx={{ width: 60, height: 40, p: 0, border: '2px solid', borderColor: 'divider', borderRadius: '12px', cursor: 'pointer', overflow: 'hidden' }}
                    />
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, opacity: 0.7 }}>
                        {localColor?.toUpperCase()}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

const ReminderSettingsPage = () => {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // UI States
    const [tabValue, setTabValue] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Data States
    const [editMode, setEditMode] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    const {
        categories, addCategory, updateCategory, deleteCategory,
        subCategories, addSubCategory, updateSubCategory, deleteSubCategory,
        statuses, addStatus, updateStatus, deleteStatus // New Status methods
    } = useReminderSettingsStore();

    // Tab Data
    const tabsContent = useMemo(() => [
        { key: 'categories', label: t('settings.categories', 'Kategoriler'), icon: <Layers size={18} />, data: categories, type: 'category' },
        { key: 'sub_categories', label: t('settings.sub_categories', 'Alt Başlıklar'), icon: <Tag size={18} />, data: subCategories, type: 'sub_category' },
        { key: 'statuses', label: t('settings.statuses', 'Durumlar'), icon: <Activity size={18} />, data: statuses, type: 'status' },
    ], [t, categories, subCategories, statuses]);

    const activeTab = tabsContent[tabValue];

    const handleTabChange = (event, newValue) => setTabValue(newValue);

    const openDialog = (item = null) => {
        const baseItem = { color: '#6366f1', label_tr: '', label_en: '' };

        if (item) {
            setEditMode(true);
            setCurrentItem(item);
        } else {
            setEditMode(false);
            if (activeTab.type === 'sub_category') {
                setCurrentItem({ ...baseItem, categoryId: '' });
            } else if (activeTab.type === 'status') {
                setCurrentItem({ ...baseItem, isCompleted: false });
            } else {
                setCurrentItem(baseItem);
            }
        }
        setDialogOpen(true);
    };

    const handleSave = () => {
        if (!currentItem.label_tr) return;

        if (editMode) {
            if (activeTab.type === 'category') updateCategory(currentItem.id, currentItem);
            else if (activeTab.type === 'sub_category') updateSubCategory(currentItem.id, currentItem);
            else if (activeTab.type === 'status') updateStatus(currentItem.id, currentItem);
        } else {
            if (activeTab.type === 'category') addCategory(currentItem);
            else if (activeTab.type === 'sub_category') addSubCategory(currentItem);
            else if (activeTab.type === 'status') addStatus(currentItem);
        }
        setDialogOpen(false);
        setSnackbar({ open: true, message: t('common.success_save'), severity: 'success' });
    };

    const confirmDelete = (item) => {
        if (item.type === 'system') {
            setSnackbar({ open: true, message: t('common.cannot_delete_system', 'Sistem öğeleri silinemez.'), severity: 'warning' });
            return;
        }
        setItemToDelete(item);
        setDeleteConfirm({ open: true, item: item });
    };

    const executeDelete = () => {
        if (activeTab.type === 'category') deleteCategory(itemToDelete.id);
        else if (activeTab.type === 'sub_category') deleteSubCategory(itemToDelete.id);
        else if (activeTab.type === 'status') deleteStatus(itemToDelete.id);

        setDeleteConfirm({ open: false, item: null });
        setSnackbar({ open: true, message: t('common.success_delete'), severity: 'success' });
    };

    const getDisplayName = (item) => i18n.language === 'tr' ? item.label_tr : (item.label_en || item.label_tr);

    const getCategoryName = (catId) => {
        const cat = categories.find(c => c.id === catId);
        return cat ? getDisplayName(cat) : '-';
    };

    const handleColorChange = useCallback((color) => {
        setCurrentItem(prev => ({ ...prev, color }));
    }, []);

    return (
        <Box sx={{ animation: 'fadeIn 0.5s ease', p: 3 }}>
            <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.02em', background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {t('settings.reminder_settings')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {t('settings.reminder_settings_desc')}
                    </Typography>
                </Box>
                <Button
                    variant="contained" startIcon={<Plus size={18} />} onClick={() => openDialog()}
                    sx={{
                        borderRadius: '14px', px: 3, py: 1.5, fontWeight: 800, textTransform: 'none',
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.25)}`
                    }}
                >
                    {t('common.add_new')}
                </Button>
            </Box>

            <Paper elevation={0} sx={{ borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, overflow: 'hidden', bgcolor: 'background.paper' }}>
                <Tabs
                    value={tabValue} onChange={handleTabChange} variant={isMobile ? "scrollable" : "standard"}
                    sx={{ px: 2, pt: 1, borderBottom: `1px solid ${theme.palette.divider}` }}
                >
                    {tabsContent.map((tab, index) => (
                        <Tab key={index} icon={tab.icon} iconPosition="start" label={tab.label} sx={{ minHeight: 70, textTransform: 'none', fontWeight: 800 }} />
                    ))}
                </Tabs>

                <Box sx={{ p: { xs: 2, md: 4 }, minHeight: 400 }}>
                    <Grid container spacing={2.5}>
                        {activeTab.data.length > 0 ? activeTab.data.map((item) => (
                            <Grid item xs={12} sm={6} md={4} key={item.id}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.5, borderRadius: '20px', border: `1px solid ${theme.palette.divider}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        background: alpha(theme.palette.background.default, 0.5),
                                        '&:hover': {
                                            bgcolor: alpha(theme.palette.primary.main, 0.03), borderColor: theme.palette.primary.main,
                                            transform: 'translateY(-4px)', boxShadow: `0 10px 20px ${alpha(theme.palette.common.black, 0.05)}`,
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{
                                            width: 48, height: 48, borderRadius: '16px', bgcolor: alpha(item.color || '#ccc', 0.1),
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${alpha(item.color || '#ccc', 0.2)}`
                                        }}>
                                            <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: item.color, boxShadow: `0 0 10px ${item.color}` }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{getDisplayName(item)}</Typography>

                                            {activeTab.type === 'sub_category' && (
                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                    <Layers size={12} /> {getCategoryName(item.categoryId)}
                                                </Typography>
                                            )}

                                            {activeTab.type === 'status' && (
                                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                                    {item.isCompleted ?
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main', fontSize: '0.7rem', fontWeight: 800 }}><AlertTriangle size={10} style={{ transform: 'rotate(180deg)' }} /> BİTİRİR</Box>
                                                        :
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'warning.main', fontSize: '0.7rem', fontWeight: 800 }}><Activity size={10} /> SÜRDÜRÜR</Box>
                                                    }
                                                </Box>
                                            )}

                                            {item.type === 'system' && (
                                                <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.5, display: 'block', mt: 0.5 }}>SISTEM</Typography>
                                            )}
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Tooltip title={t('common.edit')}>
                                            <IconButton size="small" onClick={() => openDialog(item)} sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.08) }}><Edit2 size={16} /></IconButton>
                                        </Tooltip>
                                        {item.type !== 'system' && (
                                            <Tooltip title={t('common.delete')}>
                                                <IconButton size="small" onClick={() => confirmDelete(item)} sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.08) }}><Trash2 size={16} /></IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>
                        )) : (
                            <Grid item xs={12}>
                                <Box sx={{ py: 8, textAlign: 'center', opacity: 0.5 }}>
                                    <Layers size={48} style={{ marginBottom: 16 }} />
                                    <Typography variant="h6" fontWeight={700}>{t('common.no_data')}</Typography>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            </Paper>

            <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, item: null })} PaperProps={{ sx: { borderRadius: '28px', maxWidth: 480, p: 1 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, fontWeight: 900, pt: 3 }}>
                    <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.error.main, 0.1), borderRadius: '16px', color: 'error.main' }}><AlertTriangle size={28} /></Box>
                    <Box><Typography variant="h6" sx={{ fontWeight: 900 }}>{t('common.delete')}</Typography></Box>
                </DialogTitle>
                <DialogContent>
                    <Typography>{t('common.delete_confirm_text', 'Bu öğeyi silmek istediğinizden emin misiniz?')}</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setDeleteConfirm({ open: false, item: null })} sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('common.cancel')}</Button>
                    <Button onClick={executeDelete} variant="contained" color="error" sx={{ borderRadius: '14px', fontWeight: 900 }}>{t('common.delete')}</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} PaperProps={{ sx: { borderRadius: '28px', width: '100%', maxWidth: 480 } }}>
                <DialogTitle sx={{ fontWeight: 900, px: 4, pt: 4 }}>{editMode ? t('common.edit') : t('common.add_new')}</DialogTitle>
                <DialogContent sx={{ px: 4, pb: 2 }}>
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        <TextField
                            fullWidth label="Adı (TR)" value={currentItem?.label_tr || ''}
                            onChange={(e) => setCurrentItem({ ...currentItem, label_tr: e.target.value })}
                            InputProps={{ startAdornment: <Languages size={18} style={{ marginRight: 12, opacity: 0.5 }} />, sx: { borderRadius: '16px', fontWeight: 700 } }}
                        />
                        <TextField
                            fullWidth label="Name (EN)" value={currentItem?.label_en || ''}
                            onChange={(e) => setCurrentItem({ ...currentItem, label_en: e.target.value })}
                            InputProps={{ startAdornment: <Languages size={18} style={{ marginRight: 12, opacity: 0.5 }} />, sx: { borderRadius: '16px', fontWeight: 700 } }}
                        />

                        {activeTab.type === 'sub_category' && (
                            <FormControl fullWidth>
                                <InputLabel sx={{ fontWeight: 600 }}>{t('common.category')}</InputLabel>
                                <Select
                                    value={currentItem?.categoryId || ''}
                                    label={t('common.category')}
                                    onChange={(e) => setCurrentItem({ ...currentItem, categoryId: e.target.value })}
                                    sx={{ borderRadius: '16px', fontWeight: 700 }}
                                >
                                    {categories.map(c => (
                                        <MenuItem key={c.id} value={c.id}>{getDisplayName(c)}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        {activeTab.type === 'status' && (
                            <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: '16px', border: `1px solid ${theme.palette.divider}` }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={currentItem?.isCompleted || false}
                                            onChange={(e) => setCurrentItem({ ...currentItem, isCompleted: e.target.checked })}
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={800}>{t('settings.mark_as_completed', 'İşlemi Tamamlar')}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {t('settings.mark_as_completed_desc', 'Bu durum seçildiğinde hatırlatıcı "Tamamlandı" olarak işaretlenir.')}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </Paper>
                        )}

                        <CustomColorPicker value={currentItem?.color} onChange={handleColorChange} label={t('common.color')} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 4, pt: 0 }}>
                    <Button onClick={() => setDialogOpen(false)} sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('common.cancel')}</Button>
                    <Button onClick={handleSave} variant="contained" disabled={!currentItem?.label_tr} sx={{ borderRadius: '14px', fontWeight: 900, boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.2)}` }}>{t('common.save')}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ReminderSettingsPage;
