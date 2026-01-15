import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    InputAdornment,
    IconButton,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Divider,
    Checkbox,
    alpha,
    useTheme,
    Tabs,
    Tab,
    useMediaQuery,
    Pagination,
    Snackbar,
    Alert
} from '@mui/material';
import {
    Search,
    Plus,
    Shield,
    Lock,
    Save,
    Trash2,
    ChevronRight,
    UserCircle,
    Layers,
    ArrowLeft
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    PERMISSION_MODULES,
    PermissionCard,
    CreateDrawer,
    PermissionDeleteDialog,
    usePermissions
} from '../../modules/permissions';

const PermissionsPage = () => {
    const { t, i18n } = useTranslation();
    const lang = i18n.language;
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
    const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });

    // --- LOGIC HOOK ---
    const {
        tabValue,
        handleTabChange,
        selectedId,
        handleSelectItem,
        searchTerm,
        setSearchTerm,
        drawerOpen,
        setDrawerOpen,
        showDetail,
        setShowDetail,
        selectedItem,
        formData,
        setFormData,
        filteredItems,
        totalCount,
        page,
        setPage,
        itemsPerPage,
        handleCreate,
        store
    } = usePermissions();

    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

    // Verilerin (etiketler vb.) her zaman mock ve ayarlar ile senkron kalmasını sağla
    React.useEffect(() => {
        if (store.repairData) store.repairData();
    }, []);

    const [localData, setLocalData] = React.useState([]);
    const [hasChanges, setHasChanges] = React.useState(false);

    // Seçilen öğe değiştiğinde yerel veriyi sıfırla
    React.useEffect(() => {
        if (selectedItem) {
            setLocalData(tabValue === 0 ? [...(selectedItem.permissions || [])] : [...(selectedItem.packages || [])]);
            setHasChanges(false);
        }
    }, [selectedId, tabValue, selectedItem]);

    if (!selectedItem) return null;

    const handleTogglePermission = (permissionId) => {
        setLocalData(prev => {
            const next = prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId];
            return next;
        });
        setHasChanges(true);
    };

    const handleTogglePackageInRole = (packageId) => {
        setLocalData(prev => {
            const next = prev.includes(packageId)
                ? prev.filter(id => id !== packageId)
                : [...prev, packageId];
            return next;
        });
        setHasChanges(true);
    };

    const handleDelete = () => {
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = (action, targetId) => {
        // Logic for migration (simulated for now since users are mock)
        if (action === 'migrate') {
            console.log(`Migrating users from ${selectedId} to ${targetId}`);
        } else {
            console.log(`Removing ${selectedId} from all users`);
        }

        if (tabValue === 0) store.deletePackage(selectedId);
        else store.deleteRole(selectedId);

        setDeleteDialogOpen(false);
        setSnackbar({ open: true, message: t('common.success_delete'), severity: 'success' });
    };

    const handleUpdate = () => {
        if (tabValue === 0) {
            store.updatePackage(selectedId, { permissions: localData });
        } else {
            store.updateRole(selectedId, { packages: localData });
        }
        setHasChanges(false);
        setSnackbar({ open: true, message: t('common.success_save'), severity: 'success' });
    };

    const onSaveNew = () => {
        handleCreate();
        setSnackbar({ open: true, message: t('common.success_save'), severity: 'success' });
    };

    return (
        <Box sx={{ animation: 'fadeIn 0.6s ease', pb: 4 }}>
            {/* ÜST BAŞLIK */}
            <Box sx={{
                mb: isSmall ? 2 : 4,
                display: 'flex',
                flexDirection: isSmall ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isSmall ? 'flex-start' : 'flex-end',
                gap: 2
            }}>
                <Box>
                    <Typography variant={isSmall ? "h5" : "h4"} sx={{ fontWeight: 900, letterSpacing: '-0.05em', color: 'text.primary' }}>
                        {t('permissions.title')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {t('permissions.subtitle')}
                    </Typography>
                </Box>
                <Button
                    fullWidth={isSmall}
                    onClick={(e) => { setDrawerOpen(true); e.currentTarget.blur(); }}
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    sx={{
                        borderRadius: '16px', px: 3, py: 1.2, fontWeight: 800, textTransform: 'none',
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                    }}
                >
                    {tabValue === 0 ? t('permissions.add_package') : t('permissions.add_role')}
                </Button>
            </Box>

            {/* TAB SEÇİMİ */}
            <Paper elevation={0} sx={{
                borderRadius: '18px', p: 0.5, mb: 3, bgcolor: alpha(theme.palette.divider, 0.05), border: `1px solid ${theme.palette.divider}`,
                width: isMobile ? '100%' : 'fit-content',
                overflow: 'hidden'
            }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant={isMobile ? "fullWidth" : "standard"}
                    sx={{
                        minHeight: 40,
                        '& .MuiTabs-indicator': { display: 'none' },
                        '& .MuiTab-root': {
                            minHeight: 40, py: 1, px: isSmall ? 1 : 3, borderRadius: '14px', textTransform: 'none', fontWeight: 700, fontSize: isSmall ? '0.75rem' : '0.9rem', color: 'text.secondary',
                            transition: 'all 0.2s ease',
                            '&.Mui-selected': {
                                color: 'primary.main',
                                bgcolor: isDark ? 'background.paper' : '#ffffff',
                                boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.05)'
                            }
                        }
                    }}
                >
                    <Tab label={t('permissions.packages_tab')} icon={<Layers size={18} />} iconPosition="start" />
                    <Tab label={t('permissions.roles_tab')} icon={<UserCircle size={18} />} iconPosition="start" />
                </Tabs>
            </Paper>

            <Grid container spacing={3}>
                {/* SOL LİSTE */}
                {(!isMobile || !showDetail) && (
                    <Grid item xs={12} md={4} lg={3}>
                        <Paper elevation={0} sx={{
                            borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, overflow: 'hidden',
                            bgcolor: 'background.paper', minHeight: isMobile ? 'auto' : '600px'
                        }}>
                            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                                <TextField
                                    fullWidth placeholder={tabValue === 0 ? t('permissions.package_search') : t('permissions.role_search')} variant="standard"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment>,
                                        disableUnderline: true,
                                        sx: { px: 1, fontWeight: 600, color: 'text.primary' }
                                    }}
                                />
                            </Box>
                            <List sx={{ p: 1 }}>
                                {filteredItems.map((item) => (
                                    <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                                        <ListItemButton
                                            selected={selectedId === item.id}
                                            onClick={() => handleSelectItem(item.id, isMobile)}
                                            sx={{
                                                borderRadius: '14px',
                                                py: 2,
                                                '&.Mui-selected': {
                                                    bgcolor: alpha(item.color || theme.palette.primary.main, 0.08),
                                                    color: item.color || theme.palette.primary.main,
                                                    '&:hover': { bgcolor: alpha(item.color || theme.palette.primary.main, 0.12) }
                                                }
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                                                {tabValue === 0 ? <Layers size={20} /> : <UserCircle size={20} />}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={lang === 'tr' ? item.name_tr : (item.name_en || item.name_tr)}
                                                primaryTypographyProps={{ fontWeight: 800, fontSize: '0.9rem' }}
                                            />
                                            <ChevronRight size={16} style={{ opacity: selectedId === item.id ? 1 : 0.3 }} />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                            {totalCount > itemsPerPage && (
                                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: `1px solid ${theme.palette.divider}` }}>
                                    <Pagination
                                        count={Math.ceil(totalCount / itemsPerPage)}
                                        page={page + 1}
                                        onChange={(e, p) => setPage(p - 1)}
                                        size="small"
                                        color="primary"
                                    />
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                )}

                {/* SAĞ DETAY */}
                {(!isMobile || showDetail) && (
                    <Grid item xs={12} md={8} lg={9}>
                        <Paper elevation={0} sx={{
                            borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, overflow: 'hidden',
                            bgcolor: 'background.paper', minHeight: isMobile ? 'auto' : '640px', display: 'flex', flexDirection: 'column'
                        }}>
                            {/* MOBİL GERİ BUTONU */}
                            {isMobile && (
                                <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <IconButton onClick={() => setShowDetail(false)} size="small" sx={{ color: 'primary.main' }}>
                                        <ArrowLeft size={20} />
                                    </IconButton>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{t('common.search')}</Typography>
                                </Box>
                            )}

                            {/* BAŞLIK */}
                            <Box sx={{
                                p: isSmall ? 2 : 3,
                                display: 'flex',
                                flexDirection: isSmall ? 'column' : 'row',
                                justifyContent: 'space-between',
                                alignItems: isSmall ? 'flex-start' : 'center',
                                bgcolor: alpha(selectedItem.color, 0.02),
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                gap: 2
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ p: 1.5, borderRadius: '14px', bgcolor: alpha(selectedItem.color, 0.1), color: selectedItem.color }}>
                                        {tabValue === 0 ? <Lock size={24} /> : <Shield size={24} />}
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', fontSize: isSmall ? '1rem' : '1.25rem' }}>
                                            {lang === 'tr' ? selectedItem.name_tr : (selectedItem.name_en || selectedItem.name_tr)}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                            {tabValue === 0
                                                ? t('permissions.permission_count', { count: localData.length })
                                                : t('permissions.package_count', { count: localData.length })}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5, width: isSmall ? '100%' : 'auto' }}>
                                    <Button
                                        fullWidth={isSmall}
                                        onClick={handleDelete}
                                        variant="outlined" color="error" startIcon={<Trash2 size={18} />}
                                        sx={{ borderRadius: '14px', fontWeight: 700, textTransform: 'none' }}
                                    >
                                        {t('common.delete')}
                                    </Button>
                                    <Button
                                        fullWidth={isSmall}
                                        onClick={handleUpdate}
                                        variant="contained"
                                        startIcon={<Save size={18} />}
                                        disabled={!hasChanges}
                                        sx={{
                                            borderRadius: '14px', fontWeight: 800, textTransform: 'none', px: 3,
                                            bgcolor: hasChanges ? selectedItem.color : alpha(selectedItem.color, 0.5),
                                            boxShadow: hasChanges ? `0 4px 14px 0 ${alpha(selectedItem.color, 0.39)}` : 'none',
                                            '&:hover': { bgcolor: selectedItem.color, filter: 'brightness(0.9)' }
                                        }}
                                    >
                                        {t('common.save')}
                                    </Button>
                                </Box>
                            </Box>

                            {/* İÇERİK */}
                            <Box sx={{ p: isSmall ? 2 : 3, flexGrow: 1, overflowY: 'auto', maxHeight: isMobile ? 'none' : '550px' }}>
                                {tabValue === 0 ? (
                                    <Grid container spacing={isSmall ? 2 : 4}>
                                        {PERMISSION_MODULES.map((module) => (
                                            <Grid item xs={12} key={module.id}>
                                                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <module.icon size={20} color={theme.palette.primary.main} />
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                                        {lang === 'tr' ? module.name_tr : (module.name_en || module.name_tr)}
                                                    </Typography>
                                                    <Divider sx={{ flexGrow: 1, ml: 2, opacity: 0.5 }} />
                                                </Box>
                                                <Grid container spacing={isSmall ? 1.5 : 2}>
                                                    {module.permissions.map((perm) => (
                                                        <Grid item xs={12} sm={6} lg={4} key={perm.id}>
                                                            <PermissionCard
                                                                perm={perm}
                                                                selected={localData.includes(perm.id)}
                                                                color={selectedItem.color}
                                                                onClick={() => handleTogglePermission(perm.id)}
                                                            />
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            </Grid>
                                        ))}
                                    </Grid>
                                ) : (
                                    <Box>
                                        <Box sx={{ mb: 4, p: 3, borderRadius: '20px', bgcolor: alpha(theme.palette.primary.main, 0.03), border: `1px dashed ${alpha(theme.palette.primary.main, isDark ? 0.3 : 0.2)}` }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>{t('permissions.role_description')}</Typography>
                                            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                                                {lang === 'tr' ? selectedItem.description_tr : (selectedItem.description_en || selectedItem.description_tr)}
                                            </Typography>
                                        </Box>

                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary' }}>
                                            <Layers size={20} /> {t('permissions.assigned_packages')}
                                        </Typography>
                                        <Grid container spacing={isSmall ? 1.5 : 2}>
                                            {store.packages.map((pkg) => {
                                                const isAtanan = localData.includes(pkg.id);
                                                return (
                                                    <Grid item xs={12} sm={6} key={pkg.id}>
                                                        <Paper
                                                            onClick={() => handleTogglePackageInRole(pkg.id)}
                                                            sx={{
                                                                p: 2.5, borderRadius: '18px', cursor: 'pointer', border: '2px solid',
                                                                borderColor: isAtanan ? pkg.color : theme.palette.divider,
                                                                bgcolor: isAtanan ? alpha(pkg.color, 0.04) : 'transparent',
                                                                transition: 'all 0.2s ease',
                                                                '&:hover': { transform: 'translateY(-3px)', boxShadow: isAtanan ? (isDark ? `0 10px 20px ${alpha('#000', 0.5)}` : `0 10px 20px ${alpha(pkg.color, 0.1)}`) : 'none' }
                                                            }}
                                                        >
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: pkg.color }} />
                                                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                                                        {lang === 'tr' ? pkg.name_tr : (pkg.name_en || pkg.name_tr)}
                                                                    </Typography>
                                                                </Box>
                                                                <Checkbox checked={isAtanan} sx={{ color: pkg.color, '&.Mui-checked': { color: pkg.color } }} />
                                                            </Box>
                                                        </Paper>
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                    </Box>
                                )}
                            </Box>
                        </Paper>
                    </Grid>
                )}
            </Grid>

            {/* OLUŞTURMA DRAWER */}
            <CreateDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSave={onSaveNew}
                type={tabValue === 0 ? 'package' : 'role'}
                formData={formData}
                setFormData={setFormData}
                theme={theme}
                t={t}
                isMobile={isSmall}
            />

            {/* SİLME ONAY DİYALOGU */}
            <PermissionDeleteDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                type={tabValue === 0 ? 'package' : 'role'}
                item={selectedItem}
                list={tabValue === 0 ? store.packages : store.roles}
                t={t}
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

            <style>{` @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } `}</style>
        </Box>
    );
};

export default PermissionsPage;
