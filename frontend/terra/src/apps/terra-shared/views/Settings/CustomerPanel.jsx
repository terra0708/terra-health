import React, { useState, useMemo, useCallback } from 'react';
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
    Tabs,
    Tab
} from '@mui/material';
import {
    Plus,
    Briefcase,
    Activity,
    Link,
    Tag as TagIcon,
    FileText,
    Layers
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCustomerSettingsStore } from '@terra-health/modules/customers/hooks/useCustomerSettingsStore';
import { useCustomers } from '@terra-health/modules/customers';
import { CustomColorPicker } from './components/shared/CustomColorPicker';
import { CustomerItemGrid } from './components/customer/CustomerItemGrid';
import { CustomerEditDialog } from './components/customer/CustomerEditDialog';
import { CustomerDeleteDialog } from './components/customer/CustomerDeleteDialog';
import { ModulePageWrapper } from '@common/ui';
import { usePerformance } from '@common/hooks';

const CustomerPanel = () => {
    usePerformance('CustomerPanel');
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

    const settings = useCustomerSettingsStore();
    const { customers } = useCustomers();


    // Basit tab'lar - eski yapı
    const tabs = useMemo(() => [
        { 
            key: 'categories', 
            label: i18n.language === 'tr' ? 'Kategoriler' : 'Categories', 
            icon: Layers,
            data: settings.categories || [],
            type: 'category'
        },
        { 
            key: 'services', 
            label: i18n.language === 'tr' ? 'Hizmetler' : 'Services', 
            icon: Briefcase,
            data: settings.services || [],
            type: 'service'
        },
        { 
            key: 'statuses', 
            label: i18n.language === 'tr' ? 'Durumlar' : 'Statuses', 
            icon: Activity,
            data: settings.statuses || [],
            type: 'status'
        },
        { 
            key: 'sources', 
            label: i18n.language === 'tr' ? 'Kaynaklar' : 'Sources', 
            icon: Link,
            data: settings.sources || [],
            type: 'source'
        },
        { 
            key: 'tags', 
            label: i18n.language === 'tr' ? 'Etiketler' : 'Tags', 
            icon: TagIcon,
            data: settings.tags || [],
            type: 'tag'
        },
        { 
            key: 'fileCategories', 
            label: i18n.language === 'tr' ? 'Dosya Kategorileri' : 'File Categories', 
            icon: FileText,
            data: settings.fileCategories || [],
            type: 'file_category'
        }
    ], [i18n.language, settings.categories, settings.services, settings.statuses, settings.sources, settings.tags, settings.fileCategories]);

    const activeTab = tabs[tabValue] || tabs[0] || null;



    const handleTabChange = (event, newValue) => setTabValue(newValue);

    const openDialog = (item = null) => {
        if (item) {
            setEditMode(true);
            setCurrentItem(item);
        } else {
            setEditMode(false);
            const baseItem = { color: '#a259ff' };
            if (activeTab?.type === 'service') {
                setCurrentItem({ ...baseItem, name_tr: '', name_en: '', value: '', category: '' });
            } else {
                setCurrentItem({ ...baseItem, label_tr: '', label_en: '', value: '' });
            }
        }
        setDialogOpen(true);
    };


    const handleSave = () => {
        if (!activeTab || !currentItem) {
            setSnackbar({ open: true, message: t('common.error', 'Bir hata oluştu'), severity: 'error' });
            return;
        }

        const newItem = { ...currentItem };
        
        // Basit CRUD işlemleri
        switch (activeTab.type) {
            case 'category':
                if (!editMode) {
                    settings.addCategory(newItem);
                } else {
                    settings.updateCategory(currentItem.id, newItem);
                }
                break;
            case 'service':
                if (!editMode) {
                    settings.addService(newItem);
                } else {
                    settings.updateService(currentItem.id, newItem);
                }
                break;
            case 'status':
                if (!editMode) {
                    settings.addStatus(newItem);
                } else {
                    settings.updateStatus(currentItem.id, newItem);
                }
                break;
            case 'source':
                if (!editMode) {
                    settings.addSource(newItem);
                } else {
                    settings.updateSource(currentItem.id, newItem);
                }
                break;
            case 'tag':
                if (!editMode) {
                    settings.addTag(newItem);
                } else {
                    settings.updateTag(currentItem.id, newItem);
                }
                break;
            case 'file_category':
                if (!editMode) {
                    settings.addFileCategory(newItem);
                } else {
                    settings.updateFileCategory(currentItem.id, newItem);
                }
                break;
        }
        
        setDialogOpen(false);
        setSnackbar({ open: true, message: t('common.success_save'), severity: 'success' });
    };


    const confirmDelete = (item) => {
        setItemToDelete(item);
        setDeleteConfirm({ open: true, item: item });
    };

    const executeDelete = () => {
        if (!deleteConfirm.item || !activeTab) return;
        
        // Basit silme işlemleri
        switch (activeTab.type) {
            case 'category':
                settings.deleteCategory(itemToDelete.id);
                break;
            case 'service':
                settings.deleteService(itemToDelete.id);
                break;
            case 'status':
                settings.deleteStatus(itemToDelete.id);
                break;
            case 'source':
                settings.deleteSource(itemToDelete.id);
                break;
            case 'tag':
                settings.deleteTag(itemToDelete.id);
                break;
            case 'file_category':
                settings.deleteFileCategory(itemToDelete.id);
                break;
        }
        
        setDeleteConfirm({ open: false, item: null });
        setItemToDelete(null);
        setSnackbar({ open: true, message: t('common.success_delete'), severity: 'success' });
    };

    const getDisplayName = (item) => {
        const lang = i18n.language;
        // Eski format desteği: service için name_tr/name_en, diğerleri için label_tr/label_en
        if (item.name_tr || item.name_en) {
            return lang === 'tr' ? (item.name_tr || item.name_en) : (item.name_en || item.name_tr);
        }
        return lang === 'tr' ? (item.label_tr || item.label_en) : (item.label_en || item.label_tr) || '-';
    };

    const getLocalizedCategory = (categoryName) => {
        if (!categoryName) return '';
        const category = settings.categories?.find(c =>
            c.label_tr === categoryName ||
            c.label_en === categoryName ||
            c.id === categoryName
        );
        if (category) {
            return i18n.language === 'tr' ? category.label_tr : category.label_en;
        }
        return categoryName;
    };

    // Color picker performance optimization
    const handleColorChange = useCallback((color) => {
        setCurrentItem(prev => ({ ...prev, color }));
    }, []);

    return (
        <ModulePageWrapper moduleName="Settings" aria-label="Customer Panel Settings">
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
            </Box>

            {/* Basit Tabs Yapısı */}
            <Paper elevation={0} sx={{ borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper', overflow: 'hidden' }}>
                <Tabs
                    value={tabValue}
                    onChange={(e, newValue) => setTabValue(newValue)}
                    sx={{
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        px: 2,
                        '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', minHeight: 64 }
                    }}
                >
                    {tabs.map((tab, index) => {
                        const IconComponent = tab.icon;
                        return (
                            <Tab 
                                key={tab.key} 
                                label={tab.label}
                                icon={<IconComponent size={18} />}
                                iconPosition="start"
                            />
                        );
                    })}
                </Tabs>

                {/* Tab Content */}
                {activeTab && (
                    <Box sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                {activeTab.label} ({activeTab.data?.length || 0})
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<Plus size={18} />}
                                onClick={() => openDialog()}
                                sx={{
                                    borderRadius: '14px', px: 3, py: 1.5,
                                    fontWeight: 800,
                                    textTransform: 'none'
                                }}
                            >
                                {t('common.add_new')}
                            </Button>
                        </Box>

                        {/* Basit Grid */}
                        <Grid container spacing={2.5}>
                            <CustomerItemGrid
                                items={activeTab?.data || []}
                                activeTab={activeTab}
                                onEdit={openDialog}
                                onDelete={confirmDelete}
                                getDisplayName={getDisplayName}
                                getLocalizedCategory={getLocalizedCategory}
                            />
                        </Grid>
                    </Box>
                )}
            </Paper>

            {/* Smart Delete Dialog */}
            <CustomerDeleteDialog
                open={deleteConfirm.open}
                onClose={() => setDeleteConfirm({ open: false, item: null })}
                onConfirm={executeDelete}
                itemToDelete={itemToDelete}
                getDisplayName={getDisplayName}
            />

            {/* Add/Edit Dialog */}
            <CustomerEditDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                editMode={editMode}
                currentItem={currentItem}
                setCurrentItem={setCurrentItem}
                activeTab={activeTab}
                settings={settings}
                i18n={i18n}
                onSave={handleSave}
            />


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
        </ModulePageWrapper>
    );
};

export default CustomerPanel;
