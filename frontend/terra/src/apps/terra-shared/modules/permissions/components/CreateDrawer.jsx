import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Button,
    TextField,
    Drawer,
    Divider,
    alpha,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Checkbox,
    Chip,
    CircularProgress,
    useTheme,
    Snackbar,
    Alert
} from '@mui/material';
import { X, AlertTriangle, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePermissionStore } from '../hooks/usePermissionStore';
import { groupPermissionsByModule, filterSuperAdminPermissions } from '../utils/permissionGrouper';

export const CreateDrawer = ({ open, onClose, onSave, theme: themeProp, t: tProp, isMobile }) => {
    const theme = themeProp || useTheme();
    const { t: tHook, i18n } = useTranslation();
    const t = tProp || tHook;
    const isDark = theme.palette.mode === 'dark';

    const {
        permissions,
        modules,
        loading,
        createBundle,
        fetchModules
    } = usePermissionStore();

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Ensure modules are fetched when drawer opens
    useEffect(() => {
        if (open && modules.length === 0) {
            fetchModules();
        }
    }, [open, modules.length, fetchModules]);

    // Filter and group permissions
    const filteredPermissions = useMemo(() => {
        return filterSuperAdminPermissions(permissions);
    }, [permissions]);

    // Group permissions by module
    // KRİTİK: permissionGrouper.js zaten modules array'ine bakarak isModuleAssigned hesaplıyor
    // Tenant admin tüm tenant'a atanmış modülleri görebilmeli, hasPermission kontrolü gereksiz kısıtlama
    const groupedPermissions = useMemo(() => {
        return groupPermissionsByModule(filteredPermissions, modules);
    }, [filteredPermissions, modules]);

    // Debug: Log modules and grouped permissions for troubleshooting
    useEffect(() => {
        if (import.meta.env.DEV && open) {
            console.log('[CreateDrawer] Modules:', modules);
            console.log('[CreateDrawer] Grouped Permissions:', groupedPermissions);
        }
    }, [open, modules, groupedPermissions]);

    // Reset form when drawer closes
    useEffect(() => {
        if (!open) {
            setName('');
            setDescription('');
            setSelectedPermissionIds([]);
            setSubmitting(false);
        }
    }, [open]);

    // Handle permission toggle
    const handleTogglePermission = (permissionId, isModuleAssigned) => {
        if (!isModuleAssigned) return;
        setSelectedPermissionIds(prev => {
            if (prev.includes(permissionId)) {
                return prev.filter(id => id !== permissionId);
            } else {
                return [...prev, permissionId];
            }
        });
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!name.trim()) {
            setSnackbar({ 
                open: true, 
                message: 'Paket ismi gereklidir', 
                severity: 'warning' 
            });
            return;
        }

        if (selectedPermissionIds.length === 0) {
            setSnackbar({ 
                open: true, 
                message: t('permissions.error_no_permissions'), 
                severity: 'warning' 
            });
            return;
        }

        setSubmitting(true);
        try {
            await createBundle(name.trim(), description.trim(), selectedPermissionIds);
            setSnackbar({ 
                open: true, 
                message: t('permissions.success_save'), 
                severity: 'success' 
            });
            onSave?.();
            // Close drawer after short delay to show success message
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            console.error('Failed to create bundle:', error);
            
            // Extract error message from various possible formats
            let errorMessage = t('permissions.error_save');
            
            if (error.message) {
                errorMessage = error.message;
            } else if (error.response?.data?.error?.message) {
                errorMessage = error.response.data.error.message;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.status === 403) {
                errorMessage = t('permissions.error_no_permission', 'Bu işlem için yetkiniz bulunmamaktadır.');
            }
            
            setSnackbar({ 
                open: true, 
                message: errorMessage, 
                severity: 'error' 
            });
        } finally {
            setSubmitting(false);
        }
    };

    const isValid = name.trim().length > 0 && selectedPermissionIds.length > 0;

    return (
        <Drawer
            anchor={isMobile ? "bottom" : "right"}
            open={open}
            onClose={onClose}
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 2,
                '& .MuiBackdrop-root': {
                    backdropFilter: 'blur(4px)'
                }
            }}
            PaperProps={{
                sx: {
                    width: isMobile ? '100%' : 600,
                    height: isMobile ? '90vh' : '100vh',
                    borderRadius: isMobile ? '24px 24px 0 0' : '24px 0 0 24px',
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                    top: 0
                }
            }}
        >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
                {/* Header */}
                <Box sx={{
                    p: 3,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: alpha(theme.palette.primary.main, isDark ? 0.05 : 0.02),
                    borderBottom: `1px solid ${theme.palette.divider}`
                }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary' }}>
                        {t('permissions.new_package')}
                    </Typography>
                    <IconButton onClick={onClose} sx={{ color: 'text.primary' }}>
                        <X size={20} />
                    </IconButton>
                </Box>

                <Divider />

                {/* Content */}
                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
                    {/* Bundle Name */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
                        {t('permissions.package_name')} *
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder={t('permissions.package_name_placeholder')}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        sx={{
                            mb: 3,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                bgcolor: 'background.paper'
                            }
                        }}
                    />

                    {/* Bundle Description */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
                        {t('permissions.description')}
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder={t('permissions.description_placeholder')}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        sx={{
                            mb: 3,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                bgcolor: 'background.paper'
                            }
                        }}
                    />

                    {/* Permissions Selection */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: 'text.primary' }}>
                        {t('permissions.select_permissions')} * ({selectedPermissionIds.length} {t('permissions.selected')})
                    </Typography>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress size={32} />
                        </Box>
                    ) : groupedPermissions.length === 0 ? (
                        <Box sx={{
                            p: 3,
                            borderRadius: '16px',
                            bgcolor: alpha(theme.palette.warning.main, 0.05),
                            border: `1px dashed ${alpha(theme.palette.warning.main, 0.3)}`,
                            textAlign: 'center'
                        }}>
                            <AlertTriangle size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {t('permissions.no_permissions_available')}
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {groupedPermissions.map((moduleGroup) => (
                                <Accordion
                                    key={moduleGroup.moduleId}
                                    disabled={!moduleGroup.isModuleAssigned}
                                    defaultExpanded={moduleGroup.isModuleAssigned}
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
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {moduleGroup.permissions.map((permission) => {
                                                const isSelected = selectedPermissionIds.includes(permission.id);
                                                return (
                                                    <Box
                                                        key={permission.id}
                                                        onClick={() => handleTogglePermission(permission.id, moduleGroup.isModuleAssigned)}
                                                        sx={{
                                                            p: 1.5,
                                                            borderRadius: '8px',
                                                            cursor: moduleGroup.isModuleAssigned ? 'pointer' : 'not-allowed',
                                                            border: '1px solid',
                                                            borderColor: isSelected ? theme.palette.primary.main : theme.palette.divider,
                                                            bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                                                            opacity: moduleGroup.isModuleAssigned ? 1 : 0.5,
                                                            transition: 'all 0.2s ease',
                                                            '&:hover': moduleGroup.isModuleAssigned ? {
                                                                bgcolor: alpha(theme.palette.primary.main, 0.12),
                                                                transform: 'translateX(4px)'
                                                            } : {},
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between'
                                                        }}
                                                    >
                                                        <Box sx={{ flexGrow: 1 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
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
                                                            sx={{
                                                                color: theme.palette.primary.main,
                                                                '&.Mui-checked': { color: theme.palette.primary.main }
                                                            }}
                                                        />
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Box>
                    )}
                </Box>

                {/* Footer */}
                <Box sx={{
                    p: 3,
                    borderTop: `1px solid ${theme.palette.divider}`,
                    bgcolor: alpha(theme.palette.primary.main, isDark ? 0.02 : 0.01),
                    display: 'flex',
                    gap: 2
                }}>
                    <Button
                        fullWidth
                        onClick={onClose}
                        variant="outlined"
                        sx={{ borderRadius: '12px', fontWeight: 700, textTransform: 'none' }}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        fullWidth
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={!isValid || submitting}
                        sx={{
                            borderRadius: '12px',
                            fontWeight: 800,
                            textTransform: 'none',
                            bgcolor: isValid ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.5),
                            '&:hover': { bgcolor: theme.palette.primary.main, filter: 'brightness(0.9)' }
                        }}
                    >
                        {submitting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : t('common.create')}
                    </Button>
                </Box>
            </Box>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    severity={snackbar.severity} 
                    sx={{ width: '100%', borderRadius: '12px', fontWeight: 600 }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Drawer>
    );
};
