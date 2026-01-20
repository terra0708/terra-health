import React from 'react';
import { Box, Typography, Paper, Grid, Avatar, Button, IconButton, Divider, alpha } from '@mui/material';
import { Phone, Calendar, Edit3, Trash2 } from 'lucide-react';

export const UserMobileCard = ({ user, t, theme, onEdit, getRoleChip }) => {
    const isDark = theme.palette.mode === 'dark';
    return (
        <Paper elevation={0} sx={{
            p: 2, mb: 2, borderRadius: '20px', border: `1px solid ${theme.palette.divider}`,
            background: isDark ? alpha(theme.palette.background.paper, 0.4) : '#ffffff'
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={user.avatar} sx={{ width: 50, height: 50, borderRadius: '14px' }} />
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{user.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{user.email}</Typography>
                    </Box>
                </Box>
                <Box>{getRoleChip(user.role)}</Box>
            </Box>

            <Divider sx={{ mb: 2, opacity: 0.5 }} />

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, display: 'block', mb: 0.5 }}>{t('common.phone')}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Phone size={14} color={theme.palette.primary.main} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{user.phone}</Typography>
                    </Box>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, display: 'block', mb: 0.5 }}>{t('common.joining_date')}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Calendar size={14} color={theme.palette.primary.main} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{user.joined}</Typography>
                    </Box>
                </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                    fullWidth variant="outlined" startIcon={<Edit3 size={16} />}
                    onClick={(e) => { onEdit(user); e.currentTarget.blur(); }}
                    sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, py: 1 }}
                >
                    {t('common.edit')}
                </Button>
                <IconButton color="error" sx={{ bgcolor: alpha(theme.palette.error.main, 0.08), borderRadius: '12px' }}>
                    <Trash2 size={18} />
                </IconButton>
            </Box>
        </Paper>
    );
};
