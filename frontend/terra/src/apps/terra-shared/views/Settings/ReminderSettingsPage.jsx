import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { getIconComponent } from '../../modules/reminders/utils/iconUtils.jsx';
import {
    Box,
    Typography,
    Paper,
    Button,
    Grid,
    Alert,
    Snackbar,
    useTheme,
    useMediaQuery,
    alpha
} from '@mui/material';
import { Plus, Sparkles, Layers, Activity, Tag, ListFilter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useReminderSettingsStore } from '@shared/modules/reminders';
import { ReminderItemGrid } from './components/reminder/ReminderItemGrid';
import { ReminderEditDialog } from './components/reminder/ReminderEditDialog';
import { ReminderDeleteDialog } from './components/reminder/ReminderDeleteDialog';
import { ReminderTypeDialog } from './components/reminder/ReminderTypeDialog';
import { ReminderCategoryList } from './components/reminder/ReminderCategoryList';
import { ModulePageWrapper } from '@common/ui';
import { usePerformance } from '@common/hooks';

const ReminderSettingsPage = () => {
    usePerformance('ReminderSettingsPage');
    const { t, i18n } = useTranslation(['translation', 'terra-health']);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // UI States
    const [tabValue, setTabValue] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [paramTypeDialogOpen, setParamTypeDialogOpen] = useState(false);

    // Data States
    const [editMode, setEditMode] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [selectedParamType, setSelectedParamType] = useState(null);
    const [newParamType, setNewParamType] = useState({
        labelTr: '',
        labelEn: '',
        icon: 'Tag',
        color: theme.palette.primary.main
    });

    const settings = useReminderSettingsStore();
    const {
        categories, subCategories, statuses, fetchSettings,
        addCategory, updateCategory, deleteCategory,
        addSubCategory, updateSubCategory, deleteSubCategory,
        addStatus, updateStatus, deleteStatus
    } = settings;

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    /**
     * Recreate the virtual customParameterTypes structure for the UI
     * This maps the new separate backend tables (Categories, Subcategories, Statuses)
     * into a unified tree for the settings UI.
     */
    const virtualParameterTypes = useMemo(() => {
        const types = [];

        // 1. Each Category becomes a "Parameter Type" with its subcategories as "data"
        categories.forEach(cat => {
            // Include all categories except the internal 'Status' category which is handled separately
            if (cat.labelEn !== 'Status') {
                types.push({
                    ...cat,
                    id: cat.id,
                    type: 'category',
                    isCategory: true,
                    icon: cat.icon || 'Tag',
                    data: subCategories.filter(s => s.categoryId === cat.id).map(s => ({
                        ...s,
                        label_tr: s.labelTr,
                        label_en: s.labelEn
                    }))
                });
            }
        });

        // 2. Add Status as a virtual category if there are statuses
        if (statuses.length > 0 || true) {
            types.push({
                id: 'static_category_status',
                labelTr: 'Durumlar',
                labelEn: 'Statuses',
                // Legacy support (optional)
                label_tr: 'Durumlar',
                label_en: 'Statuses',
                icon: 'Activity',
                color: theme.palette.secondary.main,
                isCategory: true,
                type: 'status',
                data: statuses.map(s => ({
                    ...s,
                    label_tr: s.labelTr,
                    label_en: s.labelEn
                }))
            });
        }

        return types;
    }, [categories, subCategories, statuses, theme.palette.secondary.main]);

    const tabsContent = useMemo(() => {
        return virtualParameterTypes.map(pt => ({
            key: pt.id,
            paramTypeId: pt.id,
            label: i18n.language === 'tr' ? pt.labelTr || pt.label_tr : (pt.labelEn || pt.label_en || pt.labelTr || pt.label_tr),
            icon: getIconComponent(pt.icon),
            data: pt.data || [],
            color: pt.color || theme.palette.primary.main,
            type: pt.type
        }));
    }, [i18n.language, virtualParameterTypes, theme.palette.primary.main]);

    // Ensure tabValue is within range
    useEffect(() => {
        if (tabsContent.length > 0 && tabValue >= tabsContent.length) {
            setTabValue(0);
        }
    }, [tabsContent.length, tabValue]);

    const activeTab = tabsContent[tabValue] || null;

    const openDialog = (item = null) => {
        if (item) {
            setEditMode(true);
            setCurrentItem({
                ...item,
                labelTr: item.labelTr || item.label_tr,
                labelEn: item.labelEn || item.label_en
            });
        } else {
            setEditMode(false);
            const baseItem = { color: theme.palette.primary.main, labelTr: '', labelEn: '', value: '' };
            if (activeTab?.type === 'status') {
                baseItem.isCompleted = false;
            }
            setCurrentItem(baseItem);
        }
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!activeTab || !currentItem.labelTr) return;

        try {
            if (activeTab.type === 'category') {
                // We are editing a Subcategory
                const data = { ...currentItem, categoryId: activeTab.paramTypeId };
                if (editMode) await updateSubCategory(currentItem.id, data);
                else await addSubCategory(data);
            } else if (activeTab.type === 'status') {
                if (editMode) await updateStatus(currentItem.id, currentItem);
                else await addStatus(currentItem);
            }

            setDialogOpen(false);
            setSnackbar({ open: true, message: t('common.success_save'), severity: 'success' });
            fetchSettings(); // Refresh to ensure virtual tree is updated
        } catch (error) {
            setSnackbar({ open: true, message: t('common.error'), severity: 'error' });
        }
    };

    const handleSaveParameterType = async () => {
        if (!newParamType.labelTr) return;

        try {
            if (selectedParamType) {
                await updateCategory(selectedParamType.id, newParamType);
            } else {
                await addCategory(newParamType);
            }
            setParamTypeDialogOpen(false);
            setSelectedParamType(null);
            setSnackbar({ open: true, message: t('common.success_save'), severity: 'success' });
            fetchSettings();
        } catch (error) {
            setSnackbar({ open: true, message: t('common.error'), severity: 'error' });
        }
    };

    const confirmDelete = (item) => {
        setItemToDelete(item);
        setDeleteConfirm({ open: true, item: item });
    };

    const executeDelete = async () => {
        if (!itemToDelete || !activeTab) return;

        try {
            if (activeTab.type === 'category') {
                await deleteSubCategory(itemToDelete.id);
            } else if (activeTab.type === 'status') {
                await deleteStatus(itemToDelete.id);
            }

            setDeleteConfirm({ open: false, item: null });
            setItemToDelete(null);
            setSnackbar({ open: true, message: t('common.success_delete'), severity: 'success' });
            fetchSettings();
        } catch (error) {
            setSnackbar({ open: true, message: t('common.error'), severity: 'error' });
        }
    };

    const handleDeleteCategory = async (cat) => {
        if (window.confirm(t('common.delete_confirm_text', 'Bu kategoriyi ve tüm alt öğelerini silmek istediğinizden emin misiniz?'))) {
            try {
                await deleteCategory(cat.id);
                setSnackbar({ open: true, message: t('common.success_delete'), severity: 'success' });
                setTabValue(0);
                fetchSettings();
            } catch (error) {
                setSnackbar({ open: true, message: t('common.error'), severity: 'error' });
            }
        }
    };

    const handleEditCategory = (cat) => {
        setSelectedParamType(cat);
        setNewParamType({
            labelTr: cat.labelTr || cat.label_tr,
            labelEn: cat.labelEn || cat.label_en,
            icon: cat.icon || 'Tag',
            color: cat.color || theme.palette.primary.main
        });
        setParamTypeDialogOpen(true);
    };

    const getDisplayName = (item) => {
        if (!item) return '';
        if (i18n.language === 'tr') return item.labelTr || item.label_tr || '';
        return item.labelEn || item.label_en || item.labelTr || item.label_tr || '';
    };

    const virtualSettingsProxy = {
        customParameterTypes: virtualParameterTypes
    };

    return (
        <ModulePageWrapper moduleName="Settings" aria-label="Reminder Settings">
            <Box sx={{ animation: 'fadeIn 0.5s ease', p: 3 }}>
                {/* Header */}
                <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.02em', background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {t('settings.reminder_settings')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            {t('settings.reminder_settings_desc')}
                        </Typography>
                    </Box>
                </Box>

                {!activeTab || tabsContent.length === 0 ? (
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: '24px',
                            border: `1px solid ${theme.palette.divider}`,
                            bgcolor: 'background.paper',
                            p: 8,
                            textAlign: 'center'
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                            {t('common.loading', 'Yükleniyor...')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {t('settings.initializing_parameters', 'Hatırlatıcı türleri hazırlanıyor...')}
                        </Typography>
                    </Paper>
                ) : (
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 3,
                        height: { xs: 'auto', md: 'calc(100vh - 250px)' },
                        minHeight: { xs: 'auto', md: 600 }
                    }}>
                        {/* Sol Panel: Parametre Türleri Ağacı */}
                        <Paper
                            elevation={0}
                            sx={{
                                width: { xs: '100%', md: 320 },
                                height: { xs: 400, md: 'auto' },
                                borderRadius: '24px',
                                border: `1px solid ${theme.palette.divider}`,
                                bgcolor: 'background.paper',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                flexShrink: 0
                            }}
                        >
                            {/* Sol Panel Header */}
                            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                    {t('settings.reminder_types', 'Hatırlatıcı Türleri')}
                                </Typography>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<Sparkles size={14} />}
                                    onClick={() => {
                                        setSelectedParamType(null);
                                        setNewParamType({ labelTr: '', labelEn: '', icon: 'Tag', color: theme.palette.primary.main });
                                        setParamTypeDialogOpen(true);
                                    }}
                                    sx={{
                                        borderRadius: '10px',
                                        px: 1.5,
                                        py: 0.5,
                                        fontWeight: 800,
                                        textTransform: 'none',
                                        borderColor: theme.palette.primary.main,
                                        color: theme.palette.primary.main,
                                        fontSize: '0.75rem',
                                        '&:hover': {
                                            borderColor: theme.palette.primary.dark,
                                            bgcolor: alpha(theme.palette.primary.main, 0.05)
                                        }
                                    }}
                                >
                                    {t('common.add_new', 'Yeni')}
                                </Button>
                            </Box>

                            {/* Sol Panel: Hatırlatıcı Türleri Listesi */}
                            <ReminderCategoryList
                                tabsContent={tabsContent}
                                tabValue={tabValue}
                                onTabChange={setTabValue}
                                settings={virtualSettingsProxy}
                                onEditCategory={handleEditCategory}
                                onDeleteCategory={handleDeleteCategory}
                            />
                        </Paper>

                        {/* Sağ Panel: Seçilen Hatırlatıcı Türünün İçeriği */}
                        <Paper
                            elevation={0}
                            sx={{
                                flex: 1,
                                borderRadius: '24px',
                                border: `1px solid ${theme.palette.divider}`,
                                bgcolor: 'background.paper',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Sağ Panel Header */}
                            <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ color: activeTab?.color || theme.palette.primary.main }}>
                                        {activeTab?.icon}
                                    </Box>
                                    <Box>
                                        <Typography variant="h5" sx={{ fontWeight: 900 }}>
                                            {activeTab?.label}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                            {activeTab?.data?.length || 0} {t('common.items', 'öğe')}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Button
                                    variant="contained"
                                    startIcon={<Plus size={18} />}
                                    onClick={() => openDialog()}
                                    sx={{
                                        borderRadius: '14px', px: 3, py: 1.5,
                                        fontWeight: 800,
                                        textTransform: 'none',
                                        background: `linear-gradient(135deg, ${activeTab?.color || theme.palette.primary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                                        boxShadow: `0 8px 16px ${alpha(activeTab?.color || theme.palette.primary.main, 0.25)}`,
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: `0 12px 20px ${alpha(activeTab?.color || theme.palette.primary.main, 0.3)}`,
                                        },
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                >
                                    {t('common.add_new')}
                                </Button>
                            </Box>

                            {/* Sağ Panel: İçerik Alanı */}
                            <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 4 } }}>
                                {/* Parametre Değerleri Grid */}
                                <Grid container spacing={2.5}>
                                    <ReminderItemGrid
                                        items={activeTab?.data || []}
                                        activeTab={activeTab}
                                        onEdit={openDialog}
                                        onDelete={confirmDelete}
                                        getDisplayName={getDisplayName}
                                    />
                                </Grid>
                            </Box>
                        </Paper>
                    </Box>
                )}

                {/* Delete Dialog */}
                <ReminderDeleteDialog
                    open={deleteConfirm.open}
                    onClose={() => setDeleteConfirm({ open: false, item: null })}
                    onConfirm={executeDelete}
                />

                {/* Add/Edit Item Dialog */}
                <ReminderEditDialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    editMode={editMode}
                    currentItem={currentItem}
                    setCurrentItem={setCurrentItem}
                    itemType={activeTab?.type}
                    onSave={handleSave}
                />

                {/* Hatırlatıcı Türü Ekleme/Düzenleme Dialog */}
                <ReminderTypeDialog
                    open={paramTypeDialogOpen}
                    onClose={() => {
                        setParamTypeDialogOpen(false);
                        setSelectedParamType(null);
                        setNewParamType({ labelTr: '', labelEn: '', icon: 'Tag', color: theme.palette.primary.main });
                    }}
                    selectedParamType={selectedParamType}
                    newParamType={newParamType}
                    setNewParamType={setNewParamType}
                    onSave={handleSaveParameterType}
                />

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={3000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ borderRadius: '16px', fontWeight: 700 }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </ModulePageWrapper>
    );
};

export default ReminderSettingsPage;
