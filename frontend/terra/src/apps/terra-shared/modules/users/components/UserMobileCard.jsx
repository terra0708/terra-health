import React from 'react';
import { Box, Typography, Paper, Grid, Avatar, Button, IconButton, Divider, alpha, Chip } from '@mui/material';
import { Phone, Calendar, Edit3, Trash2, Shield } from 'lucide-react';

export const UserMobileCard = ({ user, t, theme, onEdit, onAssignBundles, getRoleChip }) => {
    const isDark = theme.palette.mode === 'dark';

    if (!user) return null;

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const isAdmin = user.roles?.some(role => role === 'ROLE_ADMIN' || role === 'ROLE_SUPER_ADMIN');

    return (
        <Paper elevation={0} sx={{
            p: 2, mb: 2, borderRadius: '20px', border: `1px solid ${theme.palette.divider}`,
            background: isDark ? alpha(theme.palette.background.paper, 0.4) : '#ffffff'
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{
                        width: 50, height: 50, borderRadius: '14px',
                        bgcolor: isAdmin ? theme.palette.error.main : theme.palette.primary.main,
                        fontWeight: 800
                    }}>
                        {user.firstName?.[0]}{user.lastName?.[0]}
                    </Avatar>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{fullName}</Typography>
                            {isAdmin && (
                                <Chip
                                    label="Yönetici"
                                    size="small"
                                    color="error"
                                    sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900, borderRadius: '6px' }}
                                />
                            )}
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{user.email}</Typography>
                    </Box>
                </Box>
            </Box>

            <Divider sx={{ mb: 2, opacity: 0.5 }} />

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, display: 'block', mb: 0.5 }}>{t('users.table.contact') || 'İLETİŞİM'}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>{user.phoneNumber || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, display: 'block', mb: 0.5 }}>{t('users.table.bundles') || 'YETKİ PAKETİ'}</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {user.bundleNames?.slice(0, 2).map(b => (
                            <Chip key={b} label={b} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', borderRadius: '6px' }} />
                        ))}
                    </Box>
                </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 1 }}>
                {onAssignBundles && (
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Shield size={16} />}
                        onClick={() => onAssignBundles(user)}
                        sx={{ borderRadius: '12px', fontWeight: 700, textTransform: 'none', fontSize: '0.875rem' }}
                    >
                        {t('users.assign_bundles') || 'Assign Bundles'}
                    </Button>
                )}
                {onEdit && (
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Edit3 size={16} />}
                        onClick={() => onEdit(user)}
                        sx={{ borderRadius: '12px', fontWeight: 700, textTransform: 'none', fontSize: '0.875rem' }}
                    >
                        {t('common.edit')}
                    </Button>
                )}
            </Box>
        </Paper>
    );
};
