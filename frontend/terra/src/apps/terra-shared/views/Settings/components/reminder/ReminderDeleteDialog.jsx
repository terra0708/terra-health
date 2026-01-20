import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    alpha,
    useTheme
} from '@mui/material';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Dialog for confirming reminder item deletion
 */
export const ReminderDeleteDialog = ({
    open,
    onClose,
    onConfirm
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            PaperProps={{ sx: { borderRadius: '28px', maxWidth: 480, p: 1 } }}
            disableEnforceFocus={false}
            disableAutoFocus={false}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, fontWeight: 900, pt: 3 }}>
                <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.error.main, 0.1), borderRadius: '16px', color: 'error.main' }}>
                    <AlertTriangle size={28} />
                </Box>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>{t('common.delete')}</Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Typography>{t('common.delete_confirm_text', 'Bu öğeyi silmek istediğinizden emin misiniz?')}</Typography>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('common.cancel')}</Button>
                <Button onClick={onConfirm} variant="contained" color="error" sx={{ borderRadius: '14px', fontWeight: 900 }}>{t('common.delete')}</Button>
            </DialogActions>
        </Dialog>
    );
};
