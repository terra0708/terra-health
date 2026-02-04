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
import { Languages, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CustomColorPicker } from '../shared/CustomColorPicker';

/**
 * Dialog for adding/editing reminder items (Category, Subcategory, Status)
 */
export const ReminderEditDialog = ({
    open,
    onClose,
    editMode,
    currentItem,
    setCurrentItem,
    itemType, // 'category', 'subcategory', 'status'
    onSave
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const handleColorChange = (color) => {
        setCurrentItem(prev => ({ ...prev, color }));
    };

    const title = editMode ? t('common.edit') : t('common.add_new');

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { borderRadius: '28px', width: '100%', maxWidth: 480 } }}
        >
            <DialogTitle sx={{ fontWeight: 900, px: 4, pt: 4 }}>
                {title} - {t(`common.${itemType}`)}
            </DialogTitle>
            <DialogContent sx={{ px: 4, pb: 2 }}>
                <Stack spacing={3} sx={{ mt: 2 }}>
                    <TextField
                        fullWidth
                        label={t('common.label_tr', 'Adı (TR)')}
                        value={currentItem?.labelTr || ''}
                        onChange={(e) => setCurrentItem({ ...currentItem, labelTr: e.target.value })}
                        InputProps={{
                            startAdornment: <Languages size={18} style={{ marginRight: 12, opacity: 0.5 }} />,
                            sx: { borderRadius: '16px', fontWeight: 700 }
                        }}
                    />
                    <TextField
                        fullWidth
                        label={t('common.label_en', 'Name (EN)')}
                        value={currentItem?.labelEn || ''}
                        onChange={(e) => setCurrentItem({ ...currentItem, labelEn: e.target.value })}
                        InputProps={{
                            startAdornment: <Languages size={18} style={{ marginRight: 12, opacity: 0.5 }} />,
                            sx: { borderRadius: '16px', fontWeight: 700 }
                        }}
                    />

                    {itemType !== 'category' && itemType !== 'status' && (
                        <TextField
                            fullWidth
                            label={t('common.value', 'Değer / Kod')}
                            value={currentItem?.value || ''}
                            onChange={(e) => setCurrentItem({ ...currentItem, value: e.target.value })}
                            placeholder="e.g. pending, completed, followup"
                            InputProps={{
                                startAdornment: <Settings size={18} style={{ marginRight: 12, opacity: 0.5 }} />,
                                sx: { borderRadius: '16px', fontWeight: 700 }
                            }}
                            helperText={t('settings.value_helper', 'Sistem içi mantıksal değer')}
                        />
                    )}

                    {itemType === 'status' && (
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
                                        <Typography variant="subtitle2" fontWeight={800}>{t('settings.completes_process', 'İşlem Tamamlar')}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {t('settings.mark_as_completed_desc', 'Bu durum seçildiğinde hatırlatıcı bitmiş olarak işaretlenir.')}
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
                <Button onClick={onClose} sx={{ fontWeight: 800, color: 'text.secondary', borderRadius: '14px' }}>{t('common.cancel')}</Button>
                <Button
                    onClick={onSave}
                    variant="contained"
                    disabled={!currentItem?.labelTr}
                    sx={{ borderRadius: '14px', fontWeight: 900, boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.2)}` }}
                >
                    {t('common.save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
