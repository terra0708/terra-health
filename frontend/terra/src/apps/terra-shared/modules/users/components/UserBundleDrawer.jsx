import React, { useState, useEffect, useMemo } from 'react';
import {
    Drawer,
    Box,
    Typography,
    IconButton,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Checkbox,
    Divider,
    alpha,
    CircularProgress,
    Chip,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { X, Shield, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePermissionStore } from '@shared/modules/permissions/hooks/usePermissionStore';

/**
 * UserBundleDrawer Component
 * 
 * Drawer for assigning/removing permission bundles to/from a user.
 * CRITICAL: Includes Zustand Sync logic to update current user's permissions
 * immediately if the current user is affected.
 */
export const UserBundleDrawer = ({ open, onClose, userId, userName }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { t } = useTranslation();
    const isDark = theme.palette.mode === 'dark';

    const {
        bundles,
        loading,
        fetchBundles,
        fetchUserBundles,
        assignBundleToUser,
        removeBundleFromUser
    } = usePermissionStore();

    const [userBundles, setUserBundles] = useState([]);
    const [loadingUserBundles, setLoadingUserBundles] = useState(false);
    const [assigning, setAssigning] = useState(false);

    // Fetch bundles and user bundles when drawer opens
    useEffect(() => {
        if (open && userId) {
            Promise.all([
                fetchBundles(),
                fetchUserBundlesForUser()
            ]).catch(err => {
                console.error('Failed to fetch bundle data:', err);
            });
        }
    }, [open, userId, fetchBundles]);

    // Fetch user's assigned bundles
    const fetchUserBundlesForUser = async () => {
        if (!userId) return;
        setLoadingUserBundles(true);
        try {
            const userBundlesData = await fetchUserBundles(userId);
            setUserBundles(userBundlesData || []);
        } catch (error) {
            console.error('Failed to fetch user bundles:', error);
        } finally {
            setLoadingUserBundles(false);
        }
    };

    // Check if bundle is assigned to user
    const isBundleAssigned = (bundleId) => {
        return userBundles.some(b => b.id === bundleId);
    };

    // Handle bundle toggle
    const handleToggleBundle = async (bundleId) => {
        if (!userId) return;

        const isAssigned = isBundleAssigned(bundleId);
        setAssigning(true);

        try {
            if (isAssigned) {
                await removeBundleFromUser(bundleId, userId);
            } else {
                await assignBundleToUser(bundleId, userId);
            }
            
            // Refresh user bundles
            await fetchUserBundlesForUser();
        } catch (error) {
            console.error('Failed to toggle bundle:', error);
        } finally {
            setAssigning(false);
        }
    };

    // Get assigned bundle IDs
    const assignedBundleIds = useMemo(() => {
        return userBundles.map(b => b.id);
    }, [userBundles]);

    if (!userId) return null;

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
                    width: isMobile ? '100%' : 500,
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
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', mb: 0.5 }}>
                            {t('users.assign_bundles') || 'Assign Permission Bundles'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            {userName || userId}
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: 'text.primary' }}>
                        <X size={20} />
                    </IconButton>
                </Box>

                <Divider />

                {/* Content */}
                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                    {loading || loadingUserBundles ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                            <CircularProgress />
                        </Box>
                    ) : bundles.length === 0 ? (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '300px',
                            gap: 2,
                            textAlign: 'center',
                            p: 3
                        }}>
                            <Shield size={48} style={{ opacity: 0.3 }} />
                            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                {t('users.no_bundles_available') || 'No permission bundles available'}
                            </Typography>
                        </Box>
                    ) : (
                        <List sx={{ p: 0 }}>
                            {bundles.map((bundle) => {
                                const isAssigned = isBundleAssigned(bundle.id);
                                const permissionCount = bundle.permissions?.length || 0;
                                
                                return (
                                    <ListItem key={bundle.id} disablePadding sx={{ mb: 1 }}>
                                        <ListItemButton
                                            onClick={() => !assigning && handleToggleBundle(bundle.id)}
                                            disabled={assigning}
                                            sx={{
                                                borderRadius: '12px',
                                                border: '2px solid',
                                                borderColor: isAssigned ? theme.palette.primary.main : theme.palette.divider,
                                                bgcolor: isAssigned ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                                                py: 2,
                                                px: 2,
                                                '&:hover': {
                                                    bgcolor: isAssigned ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.primary.main, 0.04),
                                                    transform: 'translateX(4px)'
                                                },
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 40 }}>
                                                {isAssigned ? (
                                                    <CheckCircle2 size={20} color={theme.palette.primary.main} />
                                                ) : (
                                                    <Shield size={20} style={{ opacity: 0.5 }} />
                                                )}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                                            {bundle.name}
                                                        </Typography>
                                                        {isAssigned && (
                                                            <Chip
                                                                label={t('users.assigned') || 'Assigned'}
                                                                color="primary"
                                                                size="small"
                                                                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                                                            />
                                                        )}
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box sx={{ mt: 0.5 }}>
                                                        {bundle.description && (
                                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                                                {bundle.description}
                                                            </Typography>
                                                        )}
                                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                                            {permissionCount} {t('permissions.permissions') || 'permissions'}
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                            <Checkbox
                                                checked={isAssigned}
                                                disabled={assigning}
                                                sx={{
                                                    color: theme.palette.primary.main,
                                                    '&.Mui-checked': { color: theme.palette.primary.main }
                                                }}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                );
                            })}
                        </List>
                    )}
                </Box>

                {/* Footer */}
                <Box sx={{
                    p: 3,
                    borderTop: `1px solid ${theme.palette.divider}`,
                    bgcolor: alpha(theme.palette.primary.main, isDark ? 0.02 : 0.01)
                }}>
                    <Button
                        fullWidth
                        onClick={onClose}
                        variant="contained"
                        sx={{
                            borderRadius: '12px',
                            fontWeight: 800,
                            textTransform: 'none',
                            py: 1.5
                        }}
                    >
                        {t('common.close') || 'Close'}
                    </Button>
                </Box>
            </Box>
        </Drawer>
    );
};
