import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    Paper,
    Switch,
    FormControlLabel,
    Box,
    Typography,
    alpha,
    useTheme
} from '@mui/material';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CustomColorPicker } from '../shared/CustomColorPicker';

/**
 * Dialog for adding/editing reminder items
 */
export const ReminderEditDialog = ({
    open,
    onClose,
    editMode,
    currentItem,
    setCurrentItem,
    activeTab,
    onSave
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const handleColorChange = (color) => {
        setCurrentItem(prev => ({ ...prev, color }));
    };

    return (
        <Dialog 
            open={open && !!activeTab} 
            onClose={onClose} 
            PaperProps={{ sx: { borderRadius: '28px', width: '100%', maxWidth: 480 } }}
            disableEnforceFocus={false}
            disableAutoFocus={false}
        >
            <DialogTitle sx={{ fontWeight: 900, px: 4, pt: 4 }}>{editMode ? t('common.edit') : t('common.add_new')}</DialogTitle>
            <DialogContent sx={{ px: 4, pb: 2 }}>
                <Stack spacing={3} sx={{ mt: 2 }}>
                    <TextField
                        fullWidth 
                        label="Adı (TR)" 
                        value={currentItem?.label_tr || ''}
                        onChange={(e) => setCurrentItem({ ...currentItem, label_tr: e.target.value })}
                        InputProps={{ 
                            startAdornment: <Languages size={18} style={{ marginRight: 12, opacity: 0.5 }} />, 
                            sx: { borderRadius: '16px', fontWeight: 700 } 
                        }}
                    />
                    <TextField
                        fullWidth 
                        label="Name (EN)" 
                        value={currentItem?.label_en || ''}
                        onChange={(e) => setCurrentItem({ ...currentItem, label_en: e.target.value })}
                        InputProps={{ 
                            startAdornment: <Languages size={18} style={{ marginRight: 12, opacity: 0.5 }} />, 
                            sx: { borderRadius: '16px', fontWeight: 700 } 
                        }}
                    />

                    {/* Sadece "Durum" kategorisi için isCompleted switch */}
                    {(activeTab?.paramTypeId === 'static_category_status' || activeTab?.label_tr === 'Durum' || activeTab?.label_en === 'Status') && (
                        <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: '16px', border: `1px solid ${theme.palette.divider}` }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={currentItem?.isCompleted || false}
                                        onChange={(e) => setCurrentItem({ ...currentItem, isCompleted: e.target.checked })}
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={800}>{t('settings.mark_as_completed', 'İşlemi Bitirir')}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {t('settings.mark_as_completed_desc', 'Bu durum seçildiğinde hatırlatıcı bitmiş olarak işaretlenir. Olumlu veya olumsuz olabilir.')}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </Paper>
                    )}

                    <CustomColorPicker value={currentItem?.color} onChange={handleColorChange} label={t('common.color')} />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 4, pt: 0 }}>
                <Button onClick={onClose} sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('common.cancel')}</Button>
                <Button onClick={onSave} variant="contained" disabled={!currentItem?.label_tr} sx={{ borderRadius: '14px', fontWeight: 900, boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.2)}` }}>{t('common.save')}</Button>
            </DialogActions>
        </Dialog>
    );
};
