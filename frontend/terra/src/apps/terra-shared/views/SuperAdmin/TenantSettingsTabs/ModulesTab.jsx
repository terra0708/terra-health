import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Chip, Stack, CircularProgress, Button, Alert, Divider,
    Card, CardContent, Grid, useTheme, alpha, Checkbox
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { LoadingSpinner } from '@common/ui';
import { useTenantModules, useAvailableModules, useSetTenantModules } from '@shared/modules/super-admin';
import { Save, X } from 'lucide-react';

/**
 * Modules Tab - Manage tenant modules (editable)
 * Professional card-based UI with modern design
 */
const ModulesTab = ({ tenant }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const { data: modules = [], isLoading } = useTenantModules(tenant?.id);
    const { data: availableModules = [], isLoading: modulesLoading } = useAvailableModules();
    const setTenantModules = useSetTenantModules();

    const [selectedModules, setSelectedModules] = useState([]);
    const [hasChanges, setHasChanges] = useState(false);

    // CRITICAL: System Tenant should only show MODULE_SUPERADMIN
    const isSystemTenant = tenant?.schemaName === 'public' || tenant?.name === 'SYSTEM';
    
    // Filter available modules for System Tenant
    const filteredModules = isSystemTenant 
        ? availableModules.filter(module => {
            const moduleName = typeof module === 'string' ? module : (module.name || module);
            return moduleName === 'MODULE_SUPERADMIN';
        })
        : availableModules;

    // Initialize selected modules when data loads
    useEffect(() => {
        if (modules && modules.length > 0) {
            setSelectedModules([...modules]);
        }
    }, [modules]);

    const handleModuleToggle = (moduleName) => {
        setSelectedModules((prev) => {
            if (prev.includes(moduleName)) {
                const newSelection = prev.filter((m) => m !== moduleName);
                setHasChanges(JSON.stringify(newSelection.sort()) !== JSON.stringify((modules || []).sort()));
                return newSelection;
            } else {
                const newSelection = [...prev, moduleName];
                setHasChanges(JSON.stringify(newSelection.sort()) !== JSON.stringify((modules || []).sort()));
                return newSelection;
            }
        });
    };

    const handleSave = async () => {
        try {
            await setTenantModules.mutateAsync({
                tenantId: tenant.id,
                moduleNames: selectedModules,
            });
            setHasChanges(false);
        } catch (error) {
            console.error('Failed to update tenant modules:', error);
        }
    };

    const handleReset = () => {
        setSelectedModules([...modules]);
        setHasChanges(false);
    };

    if (isLoading || modulesLoading) {
        return <LoadingSpinner />;
    }

    // Format module name for display (remove MODULE_ prefix)
    const formatModuleName = (moduleName) => {
        return moduleName.replace('MODULE_', '').replace(/_/g, ' ');
    };

    // Get module icon (placeholder - can be enhanced with actual icons)
    const getModuleIcon = (moduleName) => {
        const iconMap = {
            'MODULE_DASHBOARD': '📊',
            'MODULE_APPOINTMENTS': '📅',
            'MODULE_CUSTOMERS': '👥',
            'MODULE_REMINDERS': '🔔',
            'MODULE_STATISTICS': '📈',
            'MODULE_NOTIFICATIONS': '🔔',
            'MODULE_MARKETING': '📢',
            'MODULE_SETTINGS': '⚙️',
            'MODULE_SUPERADMIN': '👑',
        };
        return iconMap[moduleName] || '📦';
    };

    return (
        <Box>
            {/* Header with action buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                        {t('super_admin.tenants.assigned_modules', 'Assigned Modules')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t('super_admin.tenants.modules_description', 'Select modules to enable for this tenant')}
                    </Typography>
                </Box>
                {hasChanges && (
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button 
                            variant="outlined" 
                            size="medium"
                            startIcon={<X size={18} />}
                            onClick={handleReset}
                            sx={{ minWidth: 100 }}
                        >
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button
                            variant="contained"
                            size="medium"
                            startIcon={setTenantModules.isPending ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
                            onClick={handleSave}
                            disabled={setTenantModules.isPending}
                            sx={{ minWidth: 120 }}
                        >
                            {setTenantModules.isPending ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                        </Button>
                    </Box>
                )}
            </Box>

            {/* Alerts */}
            {setTenantModules.isError && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setTenantModules.reset()}>
                    {t('super_admin.tenants.update_modules_error', 'Failed to update modules. Please try again.')}
                </Alert>
            )}

            {setTenantModules.isSuccess && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setTenantModules.reset()}>
                    {t('super_admin.tenants.modules_updated', 'Modules updated successfully.')}
                </Alert>
            )}

            {/* Module Cards Grid */}
            {filteredModules && filteredModules.length > 0 ? (
                <Grid container spacing={2}>
                    {filteredModules.map((module) => {
                        const moduleName = typeof module === 'string' ? module : (module.name || module);
                        const moduleDescription = typeof module === 'object' && module.description 
                            ? module.description 
                            : formatModuleName(moduleName);
                        const isChecked = selectedModules.includes(moduleName);
                        const displayName = formatModuleName(moduleName);

                        return (
                            <Grid item xs={12} sm={6} md={4} key={moduleName}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease-in-out',
                                        border: `2px solid ${isChecked ? theme.palette.primary.main : 'transparent'}`,
                                        backgroundColor: isChecked 
                                            ? alpha(theme.palette.primary.main, 0.05)
                                            : theme.palette.mode === 'dark' 
                                                ? alpha(theme.palette.background.paper, 0.5)
                                                : theme.palette.background.paper,
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: theme.shadows[4],
                                            borderColor: isChecked 
                                                ? theme.palette.primary.main 
                                                : theme.palette.divider,
                                        },
                                    }}
                                    onClick={() => handleModuleToggle(moduleName)}
                                >
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                            {/* Checkbox */}
                                            <Checkbox
                                                checked={isChecked}
                                                onChange={() => handleModuleToggle(moduleName)}
                                                onClick={(e) => e.stopPropagation()}
                                                sx={{
                                                    p: 0,
                                                    color: isChecked ? theme.palette.primary.main : theme.palette.text.secondary,
                                                    '&.Mui-checked': {
                                                        color: theme.palette.primary.main,
                                                    },
                                                    '& .MuiSvgIcon-root': {
                                                        fontSize: 24,
                                                    },
                                                }}
                                            />
                                            
                                            {/* Content */}
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                    <Typography variant="h6" component="span" sx={{ fontSize: '1.2rem' }}>
                                                        {getModuleIcon(moduleName)}
                                                    </Typography>
                                                    <Typography 
                                                        variant="subtitle1" 
                                                        fontWeight={600}
                                                        sx={{
                                                            color: isChecked ? theme.palette.primary.main : 'inherit',
                                                        }}
                                                    >
                                                        {displayName}
                                                    </Typography>
                                                </Box>
                                                <Typography 
                                                    variant="body2" 
                                                    color="text.secondary"
                                                    sx={{ 
                                                        fontSize: '0.85rem',
                                                        lineHeight: 1.4,
                                                    }}
                                                >
                                                    {moduleDescription}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            ) : (
                <Box sx={{ 
                    textAlign: 'center', 
                    py: 8,
                    px: 2,
                }}>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                        {t('super_admin.tenants.no_available_modules', 'No available modules')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t('super_admin.tenants.no_modules_description', 'There are no modules available to assign.')}
                    </Typography>
                </Box>
            )}

            {/* Selected Modules Summary */}
            {selectedModules.length > 0 && (
                <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                        {t('super_admin.tenants.selected_summary', 'Selected Modules')} 
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            ({selectedModules.length} / {filteredModules.length})
                        </Typography>
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {selectedModules.map((module) => (
                            <Chip
                                key={module}
                                label={formatModuleName(module)}
                                color="primary"
                                variant="filled"
                                size="medium"
                                sx={{
                                    fontWeight: 500,
                                    '& .MuiChip-label': {
                                        px: 1.5,
                                    },
                                }}
                            />
                        ))}
                    </Stack>
                </Box>
            )}
        </Box>
    );
};

export default ModulesTab;
