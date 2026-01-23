import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { checkMigrationNeeded, shouldRunMigration } from '../../modules/reminders/utils/migrationUtils';
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
import { Plus, Sparkles, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useReminderSettingsStore } from '@shared/modules/reminders';
import { CustomColorPicker } from './components/shared/CustomColorPicker';
import { ReminderItemGrid } from './components/reminder/ReminderItemGrid';
import { ReminderEditDialog } from './components/reminder/ReminderEditDialog';
import { ReminderDeleteDialog } from './components/reminder/ReminderDeleteDialog';
import { ReminderTypeDialog } from './components/reminder/ReminderTypeDialog';
import { ReminderCategoryList } from './components/reminder/ReminderCategoryList';
import { ModulePageWrapper } from '@common/ui';
import { usePerformance } from '@common/hooks';

const ReminderSettingsPage = () => {
    usePerformance('ReminderSettingsPage');
    const { t, i18n } = useTranslation();
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
        label_tr: '',
        label_en: '',
        icon: 'Settings',
        isCategory: false,
        parentCategoryId: '',
        color: '#a259ff'
    });

    const settings = useReminderSettingsStore();

    // Veri uyumsuzluklarını otomatik onar (sadece bir kez)
    useEffect(() => {
        const migrationKey = 'reminder-settings-migration-completed-v10';
        const migrationChecks = checkMigrationNeeded(settings);
        
        if (shouldRunMigration(migrationKey, migrationChecks) && settings.repairData) {
            try {
                settings.repairData();
                localStorage.setItem(migrationKey, 'true');
            } catch (error) {
                console.error('Migration error:', error);
            }
        }
    }, [settings]);

    // Sol tarafta SADECE kategoriler gösterilmeli (isCategory: true)
    const tabsContent = useMemo(() => {
        return (settings.customParameterTypes || [])
            .filter(pt => pt.isCategory === true || pt.hasCategory === true) // Sadece kategoriler
            .map(pt => ({
                key: pt.id || `category_${pt.type}_${Date.now()}`, // Unique key için id kullan
                label: i18n.language === 'tr' ? pt.label_tr : (pt.label_en || pt.label_tr),
                icon: getIconComponent(pt.icon),
                data: pt.data || [], // Kategorinin içindeki öğeler
                type: pt.type,
                paramTypeId: pt.id,
                hasCategory: pt.hasCategory || pt.isCategory || false,
                isCategory: pt.isCategory !== undefined ? pt.isCategory : (pt.hasCategory || false),
                parentCategoryId: pt.parentCategoryId,
                categories: pt.categories || [],
                color: pt.color || '#a259ff'
            }));
    }, [i18n.language, settings.customParameterTypes]);


    // tabValue'nun geçerli aralıkta olduğundan emin ol
    useEffect(() => {
        if (tabsContent.length > 0 && tabValue >= tabsContent.length) {
            setTabValue(0);
        }
    }, [tabsContent.length, tabValue]);

    const activeTab = tabsContent[tabValue] || tabsContent[0] || null;

    const handleTabChange = (event, newValue) => setTabValue(newValue);

    const openDialog = (item = null) => {
        if (item) {
            setEditMode(true);
            setCurrentItem(item);
        } else {
            setEditMode(false);
            const baseItem = { color: '#a259ff' };
            // Kategorinin içindeki öğeler için varsayılan değerler
            // Sadece "Durum" kategorisi için isCompleted ekle
            const isStatusCategory = activeTab?.paramTypeId === 'static_category_status' || activeTab?.label_tr === 'Durum' || activeTab?.label_en === 'Status';
            setCurrentItem({ ...baseItem, label_tr: '', label_en: '', ...(isStatusCategory ? { isCompleted: false } : {}) });
        }
        setDialogOpen(true);
    };

    const handleSave = () => {
        if (!activeTab) {
            setSnackbar({ open: true, message: t('common.error', 'Bir hata oluştu'), severity: 'error' });
            return;
        }

        if (!currentItem.label_tr) return;

        const newItem = { ...currentItem };
        
        if (!editMode) {
            settings.addParameterValue(activeTab.paramTypeId, newItem);
        } else {
            settings.updateParameterValue(activeTab.paramTypeId, currentItem.id, newItem);
        }
        setDialogOpen(false);
        setSnackbar({ open: true, message: t('common.success_save'), severity: 'success' });
    };

    const handleSaveParameterType = () => {
        if (!newParamType.label_tr) return;
        
        if (selectedParamType) {
            settings.updateParameterType(selectedParamType.id, newParamType);
            setSnackbar({ open: true, message: t('common.success_save'), severity: 'success' });
        } else {
            const paramType = settings.addParameterType(newParamType);
            const newTabIndex = tabsContent.length;
            setTimeout(() => setTabValue(newTabIndex), 100);
        }
        
        setParamTypeDialogOpen(false);
        setSelectedParamType(null);
        setNewParamType({ label_tr: '', label_en: '', icon: 'Settings', isCategory: false, parentCategoryId: '', color: '#a259ff' });
    };

    const handleOpenParamTypeDialog = () => {
        // Sol tarafta sadece kategori eklenebilir
        setSelectedParamType(null);
        setNewParamType({ label_tr: '', label_en: '', icon: 'Settings', isCategory: true, parentCategoryId: '', color: '#a259ff' });
        setParamTypeDialogOpen(true);
    };

    const handleEditParameterType = (paramType) => {
        setSelectedParamType(paramType);
        setNewParamType({
            label_tr: paramType.label_tr,
            label_en: paramType.label_en,
            icon: paramType.icon,
            isCategory: paramType.isCategory || paramType.hasCategory || false,
            parentCategoryId: paramType.parentCategoryId || '',
            color: paramType.color
        });
        setParamTypeDialogOpen(true);
    };

    const handleDeleteParameterType = (paramType) => {
        setSelectedParamType(paramType);
        setItemToDelete(paramType);
        setDeleteConfirm({ open: true, item: paramType });
    };

    const executeDeleteParameterType = () => {
        if (!selectedParamType) return;
        settings.deleteParameterType(selectedParamType.id);
        setDeleteConfirm({ open: false, item: null });
        setSelectedParamType(null);
        setItemToDelete(null);
        if (activeTab?.paramTypeId === selectedParamType.id) {
            setTabValue(0);
        }
        setSnackbar({ open: true, message: t('common.success_delete'), severity: 'success' });
    };

    const confirmDelete = (item) => {
        const isParamType = item && settings.customParameterTypes.find(pt => pt.id === item.id);
        if (isParamType) {
            handleDeleteParameterType(item);
            return;
        }
        setItemToDelete(item);
        setDeleteConfirm({ open: true, item: item });
    };

    const executeDelete = () => {
        if (!deleteConfirm.item) return;
        
        const isParamType = itemToDelete && settings.customParameterTypes.find(pt => pt.id === itemToDelete.id);
        if (isParamType) {
            executeDeleteParameterType();
            return;
        }
        
        if (activeTab?.data && activeTab.data.find(d => d.id === itemToDelete.id)) {
            settings.deleteParameterValue(activeTab?.paramTypeId, itemToDelete.id);
            setDeleteConfirm({ open: false, item: null });
            setItemToDelete(null);
            setSnackbar({ open: true, message: t('common.success_delete'), severity: 'success' });
        }
    };

    const getDisplayName = (item) => {
        const lang = i18n.language;
        return lang === 'tr' ? (item.label_tr || item.label_en) : (item.label_en || item.label_tr) || '-';
    };

    const getCategoryName = (catId) => {
        if (!catId) return '-';
        // Önce customParameterTypes içinde kategori hatırlatıcı türünü bul
        const categoryParamType = settings.customParameterTypes.find(pt => pt.type === 'category');
        if (categoryParamType) {
            const cat = categoryParamType.data.find(c => c.id === catId);
            if (cat) return getDisplayName(cat);
        }
        // Fallback: legacy categories
        const cat = settings.categories?.find(c => c.id === catId);
        return cat ? getDisplayName(cat) : '-';
    };

    const handleColorChange = useCallback((color) => {
        setCurrentItem(prev => ({ ...prev, color }));
    }, []);

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

            {/* Split Layout: Tree (Left) + Content (Right) */}
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
                                onClick={handleOpenParamTypeDialog}
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
                            settings={settings}
                            onEditCategory={handleEditParameterType}
                            onDeleteCategory={handleDeleteParameterType}
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
                activeTab={activeTab}
                onSave={handleSave}
            />

            {/* Hatırlatıcı Türü Ekleme/Düzenleme Dialog */}
            <ReminderTypeDialog
                open={paramTypeDialogOpen}
                onClose={() => {
                    setParamTypeDialogOpen(false);
                    setSelectedParamType(null);
                    setNewParamType({ label_tr: '', label_en: '', icon: 'Settings', isCategory: false, parentCategoryId: '', color: '#a259ff' });
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
