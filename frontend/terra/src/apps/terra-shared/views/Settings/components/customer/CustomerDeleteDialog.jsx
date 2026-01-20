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
 * Dialog for confirming item deletion
 */
export const CustomerDeleteDialog = ({
    open,
    onClose,
    onConfirm,
    itemToDelete,
    getDisplayName
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { borderRadius: '28px', maxWidth: 480, p: 1 } }}
            slotProps={{
                backdrop: {
                    sx: { backgroundColor: 'rgba(0, 0, 0, 0.5)' }
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, fontWeight: 900, pt: 3 }}>
                <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.error.main, 0.1), borderRadius: '16px', color: 'error.main' }}>
                    <AlertTriangle size={28} />
                </Box>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>{t('common.delete')}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {itemToDelete && getDisplayName(itemToDelete)}
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary', lineHeight: 1.5 }}>
                    {t('common.delete_confirm_text', 'Bu öğeyi silmek istediğinizden emin misiniz?')}
                </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
                <Button
                    fullWidth
                    onClick={onClose}
                    sx={{ fontWeight: 800, color: 'text.secondary', py: 1.5, borderRadius: '14px' }}
                >
                    {t('common.cancel')}
                </Button>
                <Button
                    fullWidth
                    onClick={onConfirm}
                    variant="contained"
                    color="error"
                    sx={{ borderRadius: '14px', py: 1.5, fontWeight: 900, boxShadow: `0 8px 16px ${alpha(theme.palette.error.main, 0.2)}` }}
                >
                    {t('common.delete')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
