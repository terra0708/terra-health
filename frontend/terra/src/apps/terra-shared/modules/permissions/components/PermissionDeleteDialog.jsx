import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Typography, Box, Alert, FormControl, InputLabel, Select,
    MenuItem, alpha, useTheme
} from '@mui/material';
import { AlertTriangle, Trash2, ArrowRight } from 'lucide-react';
import { MOCK_USERS } from '../../users/data/mockData';

export const PermissionDeleteDialog = ({ open, onClose, onConfirm, type, item, list, t }) => {
    const theme = useTheme();
    const [action, setAction] = useState('remove'); // 'remove' or 'migrate'
    const [targetId, setTargetId] = useState('');

    // Count affected users
    const affectedUsers = MOCK_USERS.filter(u => {
        if (type === 'package') return u.packages?.includes(item.id);

        // Match roles by ID or by common slugs/names used in mocks
        const roleId = item.id.toString();
        const roleNameTr = item.name_tr?.toLowerCase();
        const roleNameEn = item.name_en?.toLowerCase();
        const userRole = u.role?.toLowerCase();

        return userRole === roleId ||
            userRole === roleNameTr ||
            userRole === roleNameEn ||
            (roleNameTr === 'başhekim' && userRole === 'admin') || // Map mock admin to Chief Physician for demo
            (roleNameTr === 'uzman doktor' && userRole === 'doctor');
    });

    const handleConfirm = () => {
        onConfirm(action, targetId);
    };

    const isPackage = type === 'package';
    const itemName = item ? (item.name_tr || item.name_en) : '';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: { borderRadius: '24px', p: 1, maxWidth: '450px' }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
                <Box sx={{ p: 1, borderRadius: '12px', bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', display: 'flex' }}>
                    <AlertTriangle size={24} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>{t('permissions.delete_warning_title')}</Typography>
            </DialogTitle>

            <DialogContent>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, fontWeight: 500 }}>
                    {t('permissions.delete_warning_desc')} <strong>"{itemName}"</strong>
                </Typography>

                {affectedUsers.length > 0 && (
                    <Alert
                        severity="error"
                        icon={<AlertTriangle size={20} />}
                        sx={{ borderRadius: '16px', mb: 3, '& .MuiAlert-message': { width: '100%' } }}
                    >
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                            {t('permissions.users_affected_warning', { count: affectedUsers.length })}
                        </Typography>

                        <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1, textTransform: 'uppercase', fontSize: '0.65rem', opacity: 0.8 }}>
                                {t('permissions.migration_option_label')}
                            </Typography>

                            <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                                <Select
                                    value={action}
                                    onChange={(e) => setAction(e.target.value)}
                                    sx={{ borderRadius: '10px', fontWeight: 600, bgcolor: 'background.paper' }}
                                >
                                    <MenuItem value="remove" sx={{ fontWeight: 600 }}>{t('permissions.option_remove_only')}</MenuItem>
                                    <MenuItem value="migrate" sx={{ fontWeight: 600 }}>{t('permissions.option_migrate_to')}</MenuItem>
                                </Select>
                            </FormControl>

                            {action === 'migrate' && (
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ fontWeight: 600 }}>{t('permissions.select_migration_target')}</InputLabel>
                                    <Select
                                        value={targetId}
                                        label={t('permissions.select_migration_target')}
                                        onChange={(e) => setTargetId(e.target.value)}
                                        sx={{ borderRadius: '10px', fontWeight: 600, bgcolor: 'background.paper' }}
                                    >
                                        {list.filter(x => x.id !== item.id).map(x => (
                                            <MenuItem key={x.id} value={x.id} sx={{ fontWeight: 600 }}>
                                                {x.name_tr || x.name_en}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        </Box>
                    </Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1.5 }}>
                <Button
                    onClick={onClose}
                    fullWidth
                    sx={{ borderRadius: '12px', fontWeight: 700, textTransform: 'none', color: 'text.secondary' }}
                >
                    {t('common.cancel')}
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    fullWidth
                    disabled={action === 'migrate' && !targetId}
                    onClick={handleConfirm}
                    startIcon={<Trash2 size={18} />}
                    sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none', boxShadow: 'none' }}
                >
                    {t('common.delete')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
