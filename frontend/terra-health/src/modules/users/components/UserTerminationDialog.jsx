import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Box,
    Button,
    TextField,
    useTheme,
    alpha
} from '@mui/material';
import { AlertTriangle, Calendar, UserX } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const UserTerminationDialog = ({ open, onClose, onConfirm, user }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const [exitDate, setExitDate] = useState(new Date().toISOString().split('T')[0]);
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (!exitDate) {
            alert(t('common.required_field'));
            return;
        }
        onConfirm({ userId: user.id, exitDate, reason });
        onClose();
    };

    if (!user) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    borderRadius: '24px',
                    width: '100%',
                    maxWidth: 450,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                    p: 1
                }
            }}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4, px: 3 }}>
                <Box sx={{
                    width: 72, height: 72, borderRadius: '50%',
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.main,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3
                }}>
                    <UserX size={36} strokeWidth={2} />
                </Box>

                <Typography variant="h5" align="center" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
                    {t('common.termination_dialog_title')}
                </Typography>

                <Typography variant="body2" align="center" sx={{ color: 'text.secondary', fontWeight: 500, mb: 4, maxWidth: '90%' }}>
                    <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>{user.name}</Box>
                    {' - '}
                    {t('common.termination_dialog_desc')}
                </Typography>

                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2.5, mb: 4 }}>
                    <TextField
                        label={t('common.exit_date')}
                        type="date"
                        value={exitDate}
                        onChange={(e) => setExitDate(e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                            sx: { borderRadius: '14px' },
                            startAdornment: <Box sx={{ mr: 1, color: 'text.secondary', display: 'flex' }}><Calendar size={18} /></Box>
                        }}
                    />
                    <TextField
                        label={t('common.exit_reason')}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        fullWidth
                        multiline
                        rows={2}
                        InputProps={{ sx: { borderRadius: '14px' } }}
                    />
                </Box>
            </Box>

            <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'center', gap: 1.5 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{ borderRadius: '14px', px: 3, fontWeight: 700, textTransform: 'none', borderColor: 'divider', color: 'text.primary' }}
                >
                    {t('common.cancel')}
                </Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    color="warning"
                    sx={{ borderRadius: '14px', px: 4, fontWeight: 800, textTransform: 'none', boxShadow: '0 8px 20px rgba(237, 108, 2, 0.25)' }}
                >
                    {t('common.confirm_termination')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
