import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
    useMediaQuery
} from '@mui/material';
import {
    Plus,
    Edit2,
    Trash2,
    Briefcase,
    Activity,
    Link,
    Tag as TagIcon,
    AlertTriangle,
    ArrowRight,
    Languages,
    FileText,
    Layers,
    Palette
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCustomerSettingsStore } from '../../modules/customers/hooks/useCustomerSettingsStore';
import { useCustomerStore } from '../../modules/customers/hooks/useCustomerStore';

const COLOR_PALETTE = ['#a259ff', '#00d2ff', '#10b981', '#f59e0b', '#ef4444', '#f472b6', '#3b82f6', '#6b7280', '#fbbf24', '#8b5cf6', '#06b6d4', '#f97316'];

// Optimized Color Picker Component to prevent lag
const CustomColorPicker = ({ value, onChange, label }) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const [localColor, setLocalColor] = useState(value);

    useEffect(() => {
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
                                width: 36,
                                height: 36,
                                borderRadius: '12px',
                                bgcolor: c,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '3px solid transparent',
                                borderColor: value === c ? theme.palette.text.primary : 'transparent',
                                boxShadow: value === c ? `0 0 12px ${alpha(c, 0.5)}` : 'none',
                                transform: value === c ? 'scale(1.1)' : 'scale(1)',
                                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                '&:hover': { transform: 'scale(1.15)' }
                            }}
                        >
                            {value === c && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'white' }} />}
                        </Box>
                    </Grid>
                ))}
            </Grid>

            <Box sx={{ mt: 3, pt: 2, borderTop: `1px dashed ${theme.palette.divider}` }}>
                <Typography variant="caption" sx={{ fontWeight: 800, mb: 1, display: 'block', color: 'text.secondary' }}>
                    {t('customers.custom_color_picker')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        component="input"
                        type="color"
                        value={localColor || '#a259ff'}
                        onChange={handlePickerChange}
                        sx={{
                            width: 60,
                            height: 40,
                            p: 0,
                            border: '2px solid',
                            borderColor: 'divider',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            '&::-webkit-color-swatch-wrapper': { p: 0 },
                            '&::-webkit-color-swatch': { border: 'none', borderRadius: '10px' }
                        }}
                    />
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, opacity: 0.7 }}>
                        {localColor?.toUpperCase()}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

const CustomerPanel = () => {
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
    const [migrationTarget, setMigrationTarget] = useState('clear');

    const settings = useCustomerSettingsStore();
    const { customers } = useCustomerStore();

    // Veri uyumsuzluklarını otomatik onar (Legacy data support)
    useEffect(() => {
        if (settings.repairData) settings.repairData();
    }, []);

    // Tab definitions with reordered sequence
    const tabsContent = useMemo(() => [
        { key: 'categories', label: t('menu.service_categories'), icon: <Layers size={18} />, data: settings.categories, type: 'category' },
        { key: 'services', label: t('customers.services'), icon: <Briefcase size={18} />, data: settings.services, type: 'service' },
        { key: 'status', label: t('common.status'), icon: <Activity size={18} />, data: settings.statuses, type: 'status' },
        { key: 'source', label: t('customers.source'), icon: <Link size={18} />, data: settings.sources, type: 'source' },
        { key: 'tags', label: t('customers.tags'), icon: <TagIcon size={18} />, data: settings.tags, type: 'tag' },
        { key: 'file_categories', label: t('customers.drawer.file_categories'), icon: <FileText size={18} />, data: settings.fileCategories, type: 'file_category' },
    ], [t, settings.categories, settings.services, settings.statuses, settings.sources, settings.tags, settings.fileCategories]);

    const activeTab = tabsContent[tabValue];

    // Silme öncesi etki analizi
    const usageCount = useMemo(() => {
        if (!itemToDelete) return 0;

        let valueToMatch = '';
        const currentType = activeTab.key;

        if (currentType === 'services') valueToMatch = itemToDelete.name_tr;
        else if (currentType === 'status' || currentType === 'source') valueToMatch = itemToDelete.value;
        else valueToMatch = itemToDelete.label_tr;

        return customers.filter(c => {
            const val = c[currentType];
            if (Array.isArray(val)) return val.includes(valueToMatch);
            return val === valueToMatch;
        }).length;
    }, [itemToDelete, activeTab, customers]);

    const handleTabChange = (event, newValue) => setTabValue(newValue);

    const openDialog = (item = null) => {
        if (item) {
            setEditMode(true);
            setCurrentItem(item);
        } else {
            setEditMode(false);
            const baseItem = { color: '#a259ff' };
            if (activeTab.type === 'service') {
                setCurrentItem({ ...baseItem, name_tr: '', name_en: '', category: '' });
            } else if (activeTab.type === 'status' || activeTab.type === 'source') {
                setCurrentItem({ ...baseItem, label_tr: '', label_en: '', value: '' });
            } else {
                setCurrentItem({ ...baseItem, label_tr: '', label_en: '' });
            }
        }
        setDialogOpen(true);
    };

    const generateId = (text, prefix) => {
        if (!text) return '';
        const slug = text.toLowerCase()
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '_')
            .replace(/^-+|-+$/g, '');
        return `${prefix}_${slug}`;
    };

    const handleSave = () => {
        const actionMap = {
            'service': { add: settings.addService, update: settings.updateService },
            'status': { add: settings.addStatus, update: settings.updateStatus },
            'source': { add: settings.addSource, update: settings.updateSource },
            'tag': { add: settings.addTag, update: settings.updateTag },
            'category': { add: settings.addCategory, update: settings.updateCategory },
            'file_category': { add: settings.addFileCategory, update: settings.updateFileCategory },
        };

        const { add, update } = actionMap[activeTab.type];
        const newItem = { ...currentItem };

        // Automated ID generation
        if (!editMode) {
            const enName = activeTab.type === 'service' ? newItem.name_en : newItem.label_en;
            if (enName) {
                newItem.value = generateId(enName, activeTab.type);
            }
        }

        if (editMode) {
            update(currentItem.id, newItem);
        } else {
            add(newItem);
        }
        setDialogOpen(false);
        setSnackbar({ open: true, message: t('common.success_save'), severity: 'success' });
    };

    const confirmDelete = (item) => {
        setItemToDelete(item);
        setMigrationTarget('');
        setDeleteConfirm({ open: true, item: item });
    };

    const executeDelete = () => {
        if (!deleteConfirm.item) return;
        const deleteMap = {
            'service': settings.deleteService,
            'status': settings.deleteStatus,
            'source': settings.deleteSource,
            'tag': settings.deleteTag,
            'category': settings.deleteCategory,
            'file_category': settings.deleteFileCategory
        };
        deleteMap[activeTab.type](itemToDelete.id);
        setDeleteConfirm({ open: false, item: null });
        setItemToDelete(null);
        setSnackbar({ open: true, message: t('common.success_delete'), severity: 'success' });
    };

    const getDisplayName = (item) => {
        const lang = i18n.language;
        if (activeTab.type === 'service') {
            const val = lang === 'tr' ? item.name_tr : (item.name_en || item.name_tr);
            return val || item.name || '-';
        }
        const val = lang === 'tr' ? item.label_tr : (item.label_en || item.label_tr);
        return val || item.label || '-';
    };

    const getLocalizedCategory = (categoryName) => {
        if (!categoryName) return '';
        const category = settings.categories.find(c =>
            c.label_tr === categoryName ||
            c.label_en === categoryName ||
            c.id === categoryName
        );
        if (!category) return categoryName;
        return i18n.language === 'tr' ? category.label_tr : category.label_en;
    };

    // Color picker performance optimization
    const handleColorChange = useCallback((color) => {
        setCurrentItem(prev => ({ ...prev, color }));
    }, []);

    return (
        <Box sx={{ animation: 'fadeIn 0.5s ease', p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.02em', background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {t('menu.customer_panel')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {t('customers.panel_subtitle')}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={() => openDialog()}
                    sx={{
                        borderRadius: '14px', px: 3, py: 1.5,
                        fontWeight: 800,
                        textTransform: 'none',
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.25)}`,
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 12px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    {t('common.add_new')}
                </Button>
            </Box>

            <Paper elevation={0} sx={{ borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, overflow: 'hidden', bgcolor: 'background.paper' }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant={isMobile ? "scrollable" : "standard"}
                    scrollButtons={isMobile ? "auto" : false}
                    allowScrollButtonsMobile
                    sx={{
                        px: 2, pt: 1,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        '& .MuiTabs-indicator': { height: 4, borderRadius: '4px 4px 0 0' },
                        '& .MuiTab-root': {
                            minHeight: 70,
                            textTransform: 'none',
                            fontWeight: 800,
                            gap: 1.5,
                            fontSize: '0.95rem',
                            color: 'text.secondary',
                            '&.Mui-selected': { color: 'primary.main' }
                        }
                    }}
                >
                    {tabsContent.map((tab, index) => (
                        <Tab key={index} icon={tab.icon} iconPosition="start" label={tab.label} />
                    ))}
                </Tabs>

                <Box sx={{ p: { xs: 2, md: 4 }, minHeight: 400 }}>
                    <Grid container spacing={2.5}>
                        {activeTab.data.length > 0 ? activeTab.data.map((item) => (
                            <Grid item xs={12} sm={6} md={4} key={item.id}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: '20px',
                                        border: `1px solid ${theme.palette.divider}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        background: alpha(theme.palette.background.default, 0.5),
                                        '&:hover': {
                                            bgcolor: alpha(theme.palette.primary.main, 0.03),
                                            borderColor: theme.palette.primary.main,
                                            transform: 'translateY(-4px)',
                                            boxShadow: `0 10px 20px ${alpha(theme.palette.common.black, 0.05)}`,
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: '16px',
                                            bgcolor: alpha(item.color || '#ccc', 0.1),
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: `2px solid ${alpha(item.color || '#ccc', 0.2)}`
                                        }}>
                                            <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: item.color, boxShadow: `0 0 10px ${item.color}` }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{getDisplayName(item)}</Typography>
                                            {activeTab.type === 'service' && item.category && (
                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                    <Layers size={12} /> {getLocalizedCategory(item.category)}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Tooltip title={t('common.edit')}>
                                            <IconButton size="small" onClick={() => openDialog(item)} sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) } }}><Edit2 size={16} /></IconButton>
                                        </Tooltip>
                                        <Tooltip title={t('common.delete')}>
                                            <IconButton size="small" onClick={() => confirmDelete(item)} sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.15) } }}><Trash2 size={16} /></IconButton>
                                        </Tooltip>
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

            {/* Smart Delete Dialog */}
            <Dialog
                open={deleteConfirm.open}
                onClose={() => setDeleteConfirm({ open: false, item: null })}
                PaperProps={{ sx: { borderRadius: '28px', maxWidth: 480, p: 1 } }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, fontWeight: 900, pt: 3 }}>
                    <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.error.main, 0.1), borderRadius: '16px', color: 'error.main' }}>
                        <AlertTriangle size={28} />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900 }}>{t('common.delete')}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{itemToDelete && getDisplayName(itemToDelete)}</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary', lineHeight: 1.5 }}>
                            {t('customers.delete_confirm_text', { name: itemToDelete && getDisplayName(itemToDelete) })}
                        </Typography>

                        {usageCount > 0 ? (
                            <Alert
                                severity="warning"
                                icon={<AlertTriangle size={24} />}
                                sx={{ borderRadius: '20px', p: 2, '& .MuiAlert-message': { width: '100%' } }}
                            >
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>
                                    {t('customers.item_in_use_warning', { count: usageCount })}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 600, mb: 2 }}>
                                    {t('customers.migration_instruction')}
                                </Typography>

                                <FormControl fullWidth variant="outlined" size="medium">
                                    <InputLabel id="migration-label">{t('customers.action_to_take')}</InputLabel>
                                    <Select
                                        labelId="migration-label"
                                        value={migrationTarget}
                                        onChange={(e) => setMigrationTarget(e.target.value)}
                                        label={t('customers.action_to_take')}
                                        sx={{ borderRadius: '12px', bgcolor: 'background.paper', fontWeight: 700 }}
                                    >
                                        <MenuItem value="clear">{t('customers.clear_and_leave_empty')}</MenuItem>
                                        {activeTab.data
                                            .filter(i => i.id !== itemToDelete?.id)
                                            .map(i => (
                                                <MenuItem key={i.id} value={i.id} sx={{ fontWeight: 700 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <ArrowRight size={18} />
                                                        {t('customers.migrate_to')}: {getDisplayName(i)}
                                                    </Box>
                                                </MenuItem>
                                            ))
                                        }
                                    </Select>
                                </FormControl>
                            </Alert>
                        ) : (
                            <Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: '16px', border: `1px dashed ${theme.palette.success.main}`, textAlign: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 800, color: 'success.main' }}>
                                    ✓ {t('customers.no_usage_safe_to_delete')}
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
                    <Button
                        fullWidth
                        onClick={() => setDeleteConfirm({ open: false, item: null })}
                        sx={{ fontWeight: 800, color: 'text.secondary', py: 1.5, borderRadius: '14px' }}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        fullWidth
                        onClick={executeDelete}
                        variant="contained"
                        color="error"
                        disabled={usageCount > 0 && !migrationTarget}
                        sx={{ borderRadius: '14px', py: 1.5, fontWeight: 900, boxShadow: `0 8px 16px ${alpha(theme.palette.error.main, 0.2)}` }}
                    >
                        {t('common.delete')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add/Edit Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: '28px', width: '100%', maxWidth: 480, overflow: 'visible' } }}
            >
                <DialogTitle sx={{ fontWeight: 900, px: 4, pt: 4, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {editMode ? t('common.edit') : t('common.add_new')}
                    <IconButton onClick={() => setDialogOpen(false)} size="small" sx={{ color: 'text.secondary' }}>
                        <Plus style={{ transform: 'rotate(45deg)' }} />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ px: 4, pb: 2 }}>
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        {/* TR Name */}
                        <TextField
                            fullWidth
                            label={(activeTab.type === 'service' ? t('customers.services') : activeTab.type === 'category' ? t('customers.category') : activeTab.type === 'status' ? t('common.status') : activeTab.type === 'source' ? t('customers.source') : activeTab.type === 'tag' ? t('customers.tags') : t('customers.drawer.file_categories')) + ' (TR)'}
                            value={activeTab.type === 'service' ? currentItem?.name_tr : currentItem?.label_tr}
                            onChange={(e) => setCurrentItem({ ...currentItem, [activeTab.type === 'service' ? 'name_tr' : 'label_tr']: e.target.value })}
                            InputProps={{
                                startAdornment: <Languages size={18} style={{ marginRight: 12, opacity: 0.5 }} />,
                                sx: { borderRadius: '16px', fontWeight: 700 }
                            }}
                        />
                        {/* EN Name */}
                        <TextField
                            fullWidth
                            label={(activeTab.type === 'service' ? t('customers.services') : activeTab.type === 'category' ? t('customers.category') : activeTab.type === 'status' ? t('common.status') : activeTab.type === 'source' ? t('customers.source') : activeTab.type === 'tag' ? t('customers.tags') : t('customers.drawer.file_categories')) + ' (EN)'}
                            value={activeTab.type === 'service' ? currentItem?.name_en : currentItem?.label_en}
                            onChange={(e) => setCurrentItem({ ...currentItem, [activeTab.type === 'service' ? 'name_en' : 'label_en']: e.target.value })}
                            InputProps={{
                                startAdornment: <Languages size={18} style={{ marginRight: 12, opacity: 0.5 }} />,
                                sx: { borderRadius: '16px', fontWeight: 700 }
                            }}
                        />

                        {activeTab.type === 'service' && (
                            <FormControl fullWidth>
                                <InputLabel id="service-cat-label" sx={{ fontWeight: 600 }}>{t('customers.service_category')}</InputLabel>
                                <Select
                                    labelId="service-cat-label"
                                    value={currentItem?.category || ''}
                                    label={t('customers.service_category')}
                                    onChange={(e) => setCurrentItem({ ...currentItem, category: e.target.value })}
                                    sx={{ borderRadius: '16px', fontWeight: 700 }}
                                >
                                    <MenuItem value=""><em>{t('common.select')}</em></MenuItem>
                                    {settings.categories.map(c => (
                                        <MenuItem key={c.id} value={i18n.language === 'tr' ? c.label_tr : c.label_en} sx={{ fontWeight: 700 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color }} />
                                                {i18n.language === 'tr' ? c.label_tr : c.label_en}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        <CustomColorPicker
                            value={currentItem?.color}
                            onChange={handleColorChange}
                            label={t('customers.select_color')}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 4, pt: 0, gap: 2 }}>
                    <Button
                        fullWidth
                        onClick={() => setDialogOpen(false)}
                        sx={{ fontWeight: 800, borderRadius: '14px', py: 1.5, color: 'text.secondary' }}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        fullWidth
                        onClick={handleSave}
                        variant="contained"
                        disabled={activeTab.type === 'service' ? !currentItem?.name_tr : !currentItem?.label_tr}
                        sx={{
                            borderRadius: '14px',
                            py: 1.5,
                            fontWeight: 900,
                            boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.2)}`
                        }}
                    >
                        {t('common.save')}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} sx={{ borderRadius: '16px', fontWeight: 700, px: 3, boxShadow: theme.shadows[10] }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <style>{`
                @keyframes fadeIn { 
                    from { opacity: 0; transform: translateY(10px); } 
                    to { opacity: 1; transform: translateY(0); } 
                }
                .MuiTabs-scrollButtons.Mui-disabled {
                    opacity: 0.3;
                }
            `}</style>
        </Box>
    );
};

export default CustomerPanel;
