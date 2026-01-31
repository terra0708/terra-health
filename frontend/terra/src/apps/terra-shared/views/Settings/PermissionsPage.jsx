import React, { useEffect, useState, useMemo } from 'react';
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
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    useMediaQuery,
    Snackbar,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Search,
    Plus,
    Shield,
    Lock,
    Save,
    Trash2,
    ChevronRight,
    ChevronDown,
    ArrowLeft,
    AlertTriangle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePermissionStore } from '@shared/modules/permissions/hooks/usePermissionStore';
import { groupPermissionsByModule, filterSuperAdminPermissions, CreateDrawer } from '@shared/modules/permissions';
import { ModulePageWrapper } from '@common/ui';
import { usePerformance } from '@common/hooks';
import useAuthStore from '@shared/store/authStore';

const PermissionsPage = () => {
    usePerformance('PermissionsPage');
    const { t, i18n } = useTranslation();
    const lang = i18n.language;
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
    
    // Auth store for permission checks
    const hasPermission = useAuthStore(state => state.hasPermission);
    
    // Permission Store
    const {
        permissions,
        bundles,
        modules,
        loading,
        error,
        fetchPermissions,
        fetchBundles,
        fetchModules,
        updateBundle,
        deleteBundle,
        clearError
    } = usePermissionStore();

    // Local State
    const [selectedBundleId, setSelectedBundleId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [bundleSearchTerm, setBundleSearchTerm] = useState('');
    const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

    // Fetch data on mount
    useEffect(() => {
        Promise.all([
            fetchPermissions(),
            fetchBundles(),
            fetchModules()
        ]).catch(err => {
            console.error('Failed to fetch initial data:', err);
            setSnackbar({ open: true, message: t('common.error_loading'), severity: 'error' });
        });
    }, [fetchPermissions, fetchBundles, fetchModules]);

    // Filter Super Admin permissions
    const filteredPermissions = useMemo(() => {
        return filterSuperAdminPermissions(permissions);
    }, [permissions]);

    // Group permissions by module (parentId-based)
    // KRİTİK: permissionGrouper.js zaten modules array'ine bakarak isModuleAssigned hesaplıyor
    // Tenant admin tüm tenant'a atanmış modülleri görebilmeli
    const groupedPermissions = useMemo(() => {
        return groupPermissionsByModule(filteredPermissions, modules);
    }, [filteredPermissions, modules]);

    // Selected bundle
    const selectedBundle = useMemo(() => {
        return bundles.find(b => b.id === selectedBundleId);
    }, [bundles, selectedBundleId]);

    // Filtered bundles
    const filteredBundles = useMemo(() => {
        if (!bundleSearchTerm) return bundles;
        const term = bundleSearchTerm.toLowerCase();
        return bundles.filter(b => 
            b.name?.toLowerCase().includes(term) ||
            b.description?.toLowerCase().includes(term)
        );
    }, [bundles, bundleSearchTerm]);

    // Initialize selected permissions when bundle is selected
    useEffect(() => {
        if (selectedBundle) {
            const bundlePermissionIds = selectedBundle.permissions?.map(p => p.id) || [];
            setSelectedPermissionIds(bundlePermissionIds);
            setHasChanges(false);
        } else {
            setSelectedPermissionIds([]);
            setHasChanges(false);
        }
    }, [selectedBundle]);

    // Handle permission toggle
    const handleTogglePermission = (permissionId) => {
        setSelectedPermissionIds(prev => {
            const next = prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId];
            setHasChanges(true);
            return next;
        });
    };

    // Handle bundle selection
    const handleSelectBundle = (bundleId) => {
        setSelectedBundleId(bundleId);
    };

    // Handle bundle update
    const handleUpdateBundle = async () => {
        if (!selectedBundleId || selectedPermissionIds.length === 0) {
            setSnackbar({ open: true, message: t('permissions.error_no_permissions'), severity: 'warning' });
            return;
        }

        try {
            await updateBundle(selectedBundleId, selectedPermissionIds);
            setHasChanges(false);
            setSnackbar({ open: true, message: t('common.success_save'), severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: error.message || t('common.error_save'), severity: 'error' });
        }
    };

    // Handle bundle delete
    const handleDeleteBundle = async () => {
        if (!selectedBundleId) return;

        if (!window.confirm(t('permissions.confirm_delete_bundle'))) {
            return;
        }

        try {
            await deleteBundle(selectedBundleId);
            setSelectedBundleId(null);
            setSnackbar({ open: true, message: t('common.success_delete'), severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: error.message || t('common.error_delete'), severity: 'error' });
        }
    };

    // Handle create new bundle (opens drawer)
    const handleCreateBundle = () => {
        setCreateDrawerOpen(true);
    };

    // Handle create drawer save
    const handleCreateDrawerSave = () => {
        setCreateDrawerOpen(false);
        setSnackbar({ open: true, message: t('common.success_save'), severity: 'success' });
    };

    if (loading && bundles.length === 0) {
        return (
            <ModulePageWrapper moduleName="Settings" aria-label="Permissions Management">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                    <CircularProgress />
                </Box>
            </ModulePageWrapper>
        );
    }

    return (
        <ModulePageWrapper moduleName="Settings" aria-label="Permissions Management">
            <Box sx={{ animation: 'fadeIn 0.6s ease', pb: 4 }}>
                {/* Header */}
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
                        onClick={handleCreateBundle}
                        variant="contained"
                        startIcon={<Plus size={18} />}
                        sx={{
                            borderRadius: '16px', px: 3, py: 1.2, fontWeight: 800, textTransform: 'none',
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                        }}
                    >
                        {t('permissions.add_package')}
                    </Button>
                </Box>

                <Grid container spacing={3}>
                    {/* Left Panel - Bundle List */}
                    {(!isMobile || !selectedBundleId) && (
                        <Grid item xs={12} md={4} lg={3}>
                            <Paper elevation={0} sx={{
                                borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, overflow: 'hidden',
                                bgcolor: 'background.paper', minHeight: isMobile ? 'auto' : '600px'
                            }}>
                                <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                                    <TextField
                                        fullWidth
                                        placeholder={t('permissions.package_search')}
                                        variant="standard"
                                        value={bundleSearchTerm}
                                        onChange={(e) => setBundleSearchTerm(e.target.value)}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment>,
                                            disableUnderline: true,
                                            sx: { px: 1, fontWeight: 600, color: 'text.primary' }
                                        }}
                                    />
                                </Box>
                                <List sx={{ p: 1 }}>
                                    {filteredBundles.length === 0 ? (
                                        <ListItem>
                                            <ListItemText
                                                primary={t('permissions.no_bundles')}
                                                primaryTypographyProps={{ fontSize: '0.875rem', color: 'text.secondary' }}
                                            />
                                        </ListItem>
                                    ) : (
                                        filteredBundles.map((bundle) => (
                                            <ListItem key={bundle.id} disablePadding sx={{ mb: 0.5 }}>
                                                <ListItemButton
                                                    selected={selectedBundleId === bundle.id}
                                                    onClick={() => handleSelectBundle(bundle.id)}
                                                    sx={{
                                                        borderRadius: '14px',
                                                        py: 2,
                                                        '&.Mui-selected': {
                                                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                                                            color: theme.palette.primary.main,
                                                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.12) }
                                                        }
                                                    }}
                                                >
                                                    <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                                                        <Shield size={20} />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={bundle.name}
                                                        secondary={`${bundle.permissions?.length || 0} ${t('permissions.permissions')}`}
                                                        primaryTypographyProps={{ fontWeight: 800, fontSize: '0.9rem' }}
                                                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                                    />
                                                    <ChevronRight size={16} style={{ opacity: selectedBundleId === bundle.id ? 1 : 0.3 }} />
                                                </ListItemButton>
                                            </ListItem>
                                        ))
                                    )}
                                </List>
                            </Paper>
                        </Grid>
                    )}

                    {/* Right Panel - Permission Selection */}
                    {(!isMobile || selectedBundleId) && (
                        <Grid item xs={12} md={8} lg={9}>
                            <Paper elevation={0} sx={{
                                borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, overflow: 'hidden',
                                bgcolor: 'background.paper', minHeight: isMobile ? 'auto' : '640px', display: 'flex', flexDirection: 'column'
                            }}>
                                {/* Mobile Back Button */}
                                {isMobile && selectedBundleId && (
                                    <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <IconButton onClick={() => setSelectedBundleId(null)} size="small" sx={{ color: 'primary.main' }}>
                                            <ArrowLeft size={20} />
                                        </IconButton>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{t('common.back')}</Typography>
                                    </Box>
                                )}

                                {/* Header */}
                                <Box sx={{
                                    p: isSmall ? 2 : 3,
                                    display: 'flex',
                                    flexDirection: isSmall ? 'column' : 'row',
                                    justifyContent: 'space-between',
                                    alignItems: isSmall ? 'flex-start' : 'center',
                                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                    gap: 2
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ p: 1.5, borderRadius: '14px', bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                                            <Lock size={24} />
                                        </Box>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', fontSize: isSmall ? '1rem' : '1.25rem' }}>
                                                {selectedBundle ? selectedBundle.name : t('permissions.select_bundle')}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                                {selectedBundle 
                                                    ? t('permissions.permission_count', { count: selectedPermissionIds.length })
                                                    : t('permissions.select_bundle_hint')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    {selectedBundle && (
                                        <Box sx={{ display: 'flex', gap: 1.5, width: isSmall ? '100%' : 'auto' }}>
                                            <Button
                                                fullWidth={isSmall}
                                                onClick={handleDeleteBundle}
                                                variant="outlined"
                                                color="error"
                                                startIcon={<Trash2 size={18} />}
                                                sx={{ borderRadius: '14px', fontWeight: 700, textTransform: 'none' }}
                                            >
                                                {t('common.delete')}
                                            </Button>
                                            <Button
                                                fullWidth={isSmall}
                                                onClick={handleUpdateBundle}
                                                variant="contained"
                                                startIcon={<Save size={18} />}
                                                disabled={!hasChanges || selectedPermissionIds.length === 0}
                                                sx={{
                                                    borderRadius: '14px', fontWeight: 800, textTransform: 'none', px: 3,
                                                    bgcolor: hasChanges && selectedPermissionIds.length > 0 ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.5),
                                                    boxShadow: hasChanges && selectedPermissionIds.length > 0 ? `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.39)}` : 'none',
                                                    '&:hover': { bgcolor: theme.palette.primary.main, filter: 'brightness(0.9)' }
                                                }}
                                            >
                                                {t('common.save')}
                                            </Button>
                                        </Box>
                                    )}
                                </Box>

                                {/* Content - Accordion Structure */}
                                <Box sx={{ p: isSmall ? 2 : 3, flexGrow: 1, overflowY: 'auto', maxHeight: isMobile ? 'none' : '550px' }}>
                                    {!selectedBundle ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: 2 }}>
                                            <Shield size={48} style={{ opacity: 0.3 }} />
                                            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                                {t('permissions.select_bundle_hint')}
                                            </Typography>
                                        </Box>
                                    ) : groupedPermissions.length === 0 ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: 2 }}>
                                            <AlertTriangle size={48} style={{ opacity: 0.3 }} />
                                            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                                {t('permissions.no_permissions_available')}
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            {groupedPermissions.map((moduleGroup) => (
                                                <Accordion
                                                    key={moduleGroup.moduleId}
                                                    disabled={!moduleGroup.isModuleAssigned}
                                                    sx={{
                                                        borderRadius: '16px',
                                                        border: `1px solid ${theme.palette.divider}`,
                                                        '&:before': { display: 'none' },
                                                        '&.Mui-disabled': {
                                                            bgcolor: alpha(theme.palette.warning.main, 0.05),
                                                            borderColor: alpha(theme.palette.warning.main, 0.3)
                                                        }
                                                    }}
                                                >
                                                    <AccordionSummary
                                                        expandIcon={<ChevronDown size={20} />}
                                                        sx={{
                                                            px: 2,
                                                            py: 1.5,
                                                            '&.Mui-disabled': {
                                                                opacity: 0.7
                                                            }
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', flexGrow: 1 }}>
                                                                {moduleGroup.moduleName}
                                                            </Typography>
                                                            {!moduleGroup.isModuleAssigned && (
                                                                <Chip
                                                                    label={t('permissions.module_not_licensed')}
                                                                    color="warning"
                                                                    size="small"
                                                                    icon={<AlertTriangle size={16} />}
                                                                />
                                                            )}
                                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                                                {moduleGroup.permissions.length} {t('permissions.permissions')}
                                                            </Typography>
                                                        </Box>
                                                    </AccordionSummary>
                                                    <AccordionDetails sx={{ px: 2, pb: 2 }}>
                                                        <Grid container spacing={1.5}>
                                                            {moduleGroup.permissions.map((permission) => {
                                                                const isSelected = selectedPermissionIds.includes(permission.id);
                                                                return (
                                                                    <Grid item xs={12} sm={6} lg={4} key={permission.id}>
                                                                        <Paper
                                                                            onClick={() => !moduleGroup.isModuleAssigned ? null : handleTogglePermission(permission.id)}
                                                                            sx={{
                                                                                p: 2,
                                                                                borderRadius: '12px',
                                                                                cursor: moduleGroup.isModuleAssigned ? 'pointer' : 'not-allowed',
                                                                                border: '2px solid',
                                                                                borderColor: isSelected ? theme.palette.primary.main : theme.palette.divider,
                                                                                bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                                                                                opacity: moduleGroup.isModuleAssigned ? 1 : 0.5,
                                                                                transition: 'all 0.2s ease',
                                                                                '&:hover': moduleGroup.isModuleAssigned ? {
                                                                                    transform: 'translateY(-2px)',
                                                                                    boxShadow: isDark ? `0 4px 12px rgba(0,0,0,0.3)` : `0 4px 12px rgba(0,0,0,0.1)`
                                                                                } : {}
                                                                            }}
                                                                        >
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                                <Box sx={{ flexGrow: 1 }}>
                                                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                                                                                        {permission.name}
                                                                                    </Typography>
                                                                                    {permission.description && (
                                                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                                            {permission.description}
                                                                                        </Typography>
                                                                                    )}
                                                                                </Box>
                                                                                <Checkbox
                                                                                    checked={isSelected}
                                                                                    disabled={!moduleGroup.isModuleAssigned}
                                                                                    sx={{ color: theme.palette.primary.main, '&.Mui-checked': { color: theme.palette.primary.main } }}
                                                                                />
                                                                            </Box>
                                                                        </Paper>
                                                                    </Grid>
                                                                );
                                                            })}
                                                        </Grid>
                                                    </AccordionDetails>
                                                </Accordion>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            </Paper>
                        </Grid>
                    )}
                </Grid>

                {/* Create Drawer */}
                <CreateDrawer
                    open={createDrawerOpen}
                    onClose={() => setCreateDrawerOpen(false)}
                    onSave={handleCreateDrawerSave}
                    theme={theme}
                    t={t}
                    isMobile={isMobile}
                />

                {/* Snackbar */}
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
        </ModulePageWrapper>
    );
};

export default PermissionsPage;
