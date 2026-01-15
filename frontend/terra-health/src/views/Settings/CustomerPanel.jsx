import React, { useState, useMemo } from 'react';
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
    Snackbar
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
    Languages
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCustomerSettingsStore } from '../../modules/customers/hooks/useCustomerSettingsStore';
import { useCustomerStore } from '../../modules/customers/hooks/useCustomerStore';

const CustomerPanel = () => {
    const { t, i18n } = useTranslation();
    const theme = useTheme();

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
    React.useEffect(() => {
        if (settings.repairData) settings.repairData();
    }, []); // Sadece ilk açılışta 1 kere çalışması yeterlidir.

    // Silme öncesi etki analizi
    const usageCount = useMemo(() => {
        if (!itemToDelete) return 0;
        const typeKeys = ['services', 'status', 'source', 'tags'];
        const currentType = typeKeys[tabValue];

        // Eşleşme için unique değerleri kullanıyoruz
        let valueToMatch = '';
        if (tabValue === 0) valueToMatch = itemToDelete.name_tr; // Hizmetler için isim üzerinden
        else if (tabValue === 1) valueToMatch = itemToDelete.value; // Durumlar için value
        else if (tabValue === 2) valueToMatch = itemToDelete.value; // Kaynaklar için value
        else if (tabValue === 3) valueToMatch = itemToDelete.label_tr; // Etiketler için label

        return customers.filter(c => {
            const val = c[currentType];
            if (Array.isArray(val)) return val.includes(valueToMatch);
            return val === valueToMatch;
        }).length;
    }, [itemToDelete, tabValue, customers]);

    const handleTabChange = (event, newValue) => setTabValue(newValue);

    const openDialog = (item = null) => {
        if (item) {
            setEditMode(true);
            setCurrentItem(item);
        } else {
            setEditMode(false);
            if (tabValue === 0) {
                setCurrentItem({ name_tr: '', name_en: '', color: '#a259ff', category: '' });
            } else if (tabValue === 1 || tabValue === 2) {
                setCurrentItem({ label_tr: '', label_en: '', value: '', color: '#a259ff' });
            } else {
                setCurrentItem({ label_tr: '', label_en: '', color: '#a259ff' });
            }
        }
        setDialogOpen(true);
    };

    const handleSave = () => {
        const actionMap = [
            { add: settings.addService, update: settings.updateService },
            { add: settings.addStatus, update: settings.updateStatus },
            { add: settings.addSource, update: settings.updateSource },
            { add: settings.addTag, update: settings.updateTag },
        ];

        const { add, update } = actionMap[tabValue];

        if (editMode) {
            update(currentItem.id, currentItem);
        } else {
            const newItem = { ...currentItem };
            // Otomatik value oluşturma (durum ve kaynak için)
            if ((tabValue === 1 || tabValue === 2) && !newItem.value && newItem.label_en) {
                newItem.value = newItem.label_en.toLowerCase().replace(/ /g, '_');
            }
            add(newItem);
        }
        setDialogOpen(false);
        setSnackbar({ open: true, message: t('common.success_save'), severity: 'success' });
    };

    const confirmDelete = (item) => {
        setItemToDelete(item);
        setMigrationTarget('');
        setDeleteConfirm({ open: true, item: item }); // Use setDeleteConfirm here
    };

    const executeDelete = () => {
        if (!deleteConfirm.item) return;
        const deleteMap = [
            settings.deleteService,
            settings.deleteStatus,
            settings.deleteSource,
            settings.deleteTag,
        ];
        deleteMap[tabValue](itemToDelete.id);
        setDeleteConfirm({ open: false, item: null });
        setItemToDelete(null);
        setSnackbar({ open: true, message: t('common.success_delete'), severity: 'success' });
    };

    const tabsContent = [
        { key: 'services', label: t('customers.services'), icon: <Briefcase size={18} />, data: settings.services },
        { key: 'status', label: t('common.status'), icon: <Activity size={18} />, data: settings.statuses },
        { key: 'source', label: t('customers.source'), icon: <Link size={18} />, data: settings.sources },
        { key: 'tags', label: t('customers.tags'), icon: <TagIcon size={18} />, data: settings.tags },
    ];

    const getDisplayName = (item) => {
        const lang = i18n.language;
        // Fallback to name/label if localized versions are missing (Legacy Support)
        if (tabValue === 0) {
            const val = lang === 'tr' ? item.name_tr : (item.name_en || item.name_tr);
            return val || item.name || '-';
        }
        const val = lang === 'tr' ? item.label_tr : (item.label_en || item.label_tr);
        return val || item.label || '-';
    };

    return (
        <Box sx={{ animation: 'fadeIn 0.5s ease', p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.02em' }}>
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
                        borderRadius: '14px', px: 3, py: 1.2,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.25)}`
                    }}
                >
                    {t('common.add_new')}
                </Button>
            </Box>

            <Paper elevation={0} sx={{ borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}>
                <Tabs value={tabValue} onChange={handleTabChange} sx={{ px: 2, pt: 2, borderBottom: `1px solid ${theme.palette.divider}`, '& .MuiTab-root': { minHeight: 64, textTransform: 'none', fontWeight: 800, gap: 1 } }}>
                    {tabsContent.map((tab, index) => (
                        <Tab key={index} icon={tab.icon} iconPosition="start" label={tab.label} />
                    ))}
                </Tabs>

                <Box sx={{ p: 4 }}>
                    <Grid container spacing={2}>
                        {tabsContent[tabValue].data.map((item) => (
                            <Grid item xs={12} sm={6} md={4} key={item.id}>
                                <Paper elevation={0} sx={{ p: 2, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02), transform: 'translateY(-2px)', transition: 'all 0.2s' } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        {item.color && <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color, boxShadow: `0 0 8px ${alpha(item.color, 0.4)}` }} />}
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{getDisplayName(item)}</Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                                {item.category || item.value || (i18n.language === 'tr' ? item.label_en || item.name_en : item.label_tr || item.name_tr)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <IconButton size="small" onClick={() => openDialog(item)} sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) }}><Edit2 size={16} /></IconButton>
                                        <IconButton size="small" onClick={() => confirmDelete(item)} sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.05) }}><Trash2 size={16} /></IconButton>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Paper>

            {/* Smart Delete Dialog */}
            <Dialog
                open={deleteConfirm.open}
                onClose={() => setDeleteConfirm({ open: false, item: null })}
                PaperProps={{ sx: { borderRadius: '24px', maxWidth: 450 } }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 900, pt: 3 }}>
                    <Box sx={{ p: 1, bgcolor: alpha(theme.palette.error.main, 0.1), borderRadius: '12px', color: 'error.main', display: 'flex' }}>
                        <AlertTriangle size={24} />
                    </Box>
                    {t('common.delete')} - {itemToDelete && getDisplayName(itemToDelete)}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                            {t('customers.delete_confirm_text', { name: itemToDelete && getDisplayName(itemToDelete) })}
                        </Typography>

                        {usageCount > 0 ? (
                            <Alert
                                severity="warning"
                                icon={<AlertTriangle size={20} />}
                                sx={{ borderRadius: '14px', '& .MuiAlert-message': { fontWeight: 700 } }}
                            >
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                    {t('customers.item_in_use_warning', { count: usageCount })}
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                    {t('customers.migration_instruction')}
                                </Typography>

                                <FormControl fullWidth sx={{ mt: 2 }} variant="outlined" size="small">
                                    <InputLabel id="migration-label">{t('customers.action_to_take')}</InputLabel>
                                    <Select
                                        labelId="migration-label"
                                        value={migrationTarget}
                                        onChange={(e) => setMigrationTarget(e.target.value)}
                                        label={t('customers.action_to_take')}
                                        sx={{ borderRadius: '10px', bgcolor: 'background.paper' }}
                                    >
                                        <MenuItem value="" disabled><em>{t('common.select')}</em></MenuItem>
                                        <MenuItem value="clear">{t('customers.clear_and_leave_empty')}</MenuItem>
                                        {tabsContent[tabValue].data
                                            .filter(i => i.id !== itemToDelete?.id)
                                            .map(i => (
                                                <MenuItem key={i.id} value={i.id}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <ArrowRight size={14} />
                                                        {t('customers.migrate_to')}: {getDisplayName(i)}
                                                    </Box>
                                                </MenuItem>
                                            ))
                                        }
                                    </Select>
                                </FormControl>
                            </Alert>
                        ) : (
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                                ✓ {t('customers.no_usage_safe_to_delete')}
                            </Typography>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={() => setDeleteConfirm({ open: false, item: null })} sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={executeDelete}
                        variant="contained"
                        color="error"
                        disabled={usageCount > 0 && !migrationTarget}
                        sx={{ borderRadius: '12px', px: 4, fontWeight: 800 }}
                    >
                        {t('common.delete')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} PaperProps={{ sx: { borderRadius: '24px', width: '100%', maxWidth: 450 } }}>
                <DialogTitle sx={{ fontWeight: 900, px: 3, pt: 3 }}>
                    {editMode ? t('common.edit') : t('common.add_new')}
                </DialogTitle>
                <DialogContent sx={{ px: 3, pb: 2 }}>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        {/* TR Name */}
                        <TextField
                            fullWidth
                            label={tabValue === 0 ? "Hizmet İsmi (TR)" : tabValue === 1 ? "Durum İsmi (TR)" : tabValue === 2 ? "Kaynak İsmi (TR)" : "Etiket İsmi (TR)"}
                            value={tabValue === 0 ? currentItem?.name_tr : currentItem?.label_tr}
                            onChange={(e) => setCurrentItem({ ...currentItem, [tabValue === 0 ? 'name_tr' : 'label_tr']: e.target.value })}
                            InputProps={{ startAdornment: <Languages size={18} style={{ marginRight: 8, opacity: 0.5 }} /> }}
                        />
                        {/* EN Name */}
                        <TextField
                            fullWidth
                            label={tabValue === 0 ? "Hizmet İsmi (EN)" : tabValue === 1 ? "Durum İsmi (EN)" : tabValue === 2 ? "Kaynak İsmi (EN)" : "Etiket İsmi (EN)"}
                            value={tabValue === 0 ? currentItem?.name_en : currentItem?.label_en}
                            onChange={(e) => setCurrentItem({ ...currentItem, [tabValue === 0 ? 'name_en' : 'label_en']: e.target.value })}
                            InputProps={{ startAdornment: <Languages size={18} style={{ marginRight: 8, opacity: 0.5 }} /> }}
                        />

                        {tabValue === 0 && <TextField fullWidth label={t('customers.category')} value={currentItem?.category} onChange={(e) => setCurrentItem({ ...currentItem, category: e.target.value })} />}
                        {(tabValue === 1 || tabValue === 2) && (
                            <TextField
                                fullWidth
                                label="System Value (ID)"
                                placeholder="e.g. facebook_ads"
                                value={currentItem?.value}
                                onChange={(e) => setCurrentItem({ ...currentItem, value: e.target.value })}
                                helperText="Sistem arka planda bu değeri kullanır. Boş bırakırsanız EN isminden oluşur."
                            />
                        )}

                        <Box>
                            <Typography variant="caption" sx={{ fontWeight: 800, mb: 1, display: 'block' }}>{t('customers.select_color')}</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                                {['#a259ff', '#00d2ff', '#10b981', '#f59e0b', '#ef4444', '#f472b6', '#3b82f6', '#6b7280'].map((c) => (
                                    <Box key={c} onClick={() => setCurrentItem({ ...currentItem, color: c })} sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: c, cursor: 'pointer', border: currentItem?.color === c ? `3px solid ${theme.palette.text.primary}` : 'none' }} />
                                ))}
                                <Box component="input" type="color" value={currentItem?.color || '#a259ff'} onChange={(e) => setCurrentItem({ ...currentItem, color: e.target.value })} sx={{ width: 40, height: 40, border: '2px solid', borderColor: 'divider', borderRadius: '10px', cursor: 'pointer' }} />
                            </Box>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
                    <Button onClick={handleSave} variant="contained" sx={{ borderRadius: '12px', fontWeight: 800 }}>{t('common.save')}</Button>
                </DialogActions>
            </Dialog>

            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </Box>
    );
};

export default CustomerPanel;
