import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    alpha,
    useTheme
} from '@mui/material';
import { Plus, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CustomColorPicker } from '../shared/CustomColorPicker';

/**
 * Dialog for adding/editing customer items
 */
export const CustomerEditDialog = ({
    open,
    onClose,
    editMode,
    currentItem,
    setCurrentItem,
    activeTab,
    settings,
    i18n,
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
            PaperProps={{ sx: { borderRadius: '28px', width: '100%', maxWidth: 480, overflow: 'visible' } }}
            disableEnforceFocus={false}
            disableAutoFocus={false}
            disableRestoreFocus={true}
        >
            <DialogTitle sx={{ fontWeight: 900, px: 4, pt: 4, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {editMode ? t('common.edit') : t('common.add_new')}
                <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
                    <Plus style={{ transform: 'rotate(45deg)' }} />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ px: 4, pb: 2 }}>
                <Stack spacing={3} sx={{ mt: 2 }}>
                    {/* System item warning */}
                    {currentItem?.isSystem && (
                        <Box sx={{ p: 2, borderRadius: '12px', bgcolor: alpha(theme.palette.warning.main, 0.1), border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}` }}>
                            <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 700 }}>
                                {t('customers.system_item_warning', 'Bu sistem öğesidir ve düzenlenemez')}
                            </Typography>
                        </Box>
                    )}

                    {/* TR Name */}
                    <TextField
                        fullWidth
                        label={(activeTab?.label || t('customers.parameter', 'Parametre')) + ' (TR)'}
                        value={currentItem?.label_tr || currentItem?.name_tr || ''}
                        onChange={(e) => {
                            if (activeTab?.type === 'service') {
                                setCurrentItem({ ...currentItem, name_tr: e.target.value });
                            } else {
                                setCurrentItem({ ...currentItem, label_tr: e.target.value });
                            }
                        }}
                        disabled={currentItem?.isSystem}
                        InputProps={{
                            startAdornment: <Languages size={18} style={{ marginRight: 12, opacity: 0.5 }} />,
                            sx: { borderRadius: '16px', fontWeight: 700 }
                        }}
                    />
                    {/* EN Name */}
                    <TextField
                        fullWidth
                        label={(activeTab?.label || t('customers.parameter', 'Parametre')) + ' (EN)'}
                        value={currentItem?.label_en || currentItem?.name_en || ''}
                        onChange={(e) => {
                            if (activeTab?.type === 'service') {
                                setCurrentItem({ ...currentItem, name_en: e.target.value });
                            } else {
                                setCurrentItem({ ...currentItem, label_en: e.target.value });
                            }
                        }}
                        disabled={currentItem?.isSystem}
                        InputProps={{
                            startAdornment: <Languages size={18} style={{ marginRight: 12, opacity: 0.5 }} />,
                            sx: { borderRadius: '16px', fontWeight: 700 }
                        }}
                    />

                    {/* Service için kategori seçimi - ID bazlı */}
                    {activeTab?.type === 'service' && (
                        <FormControl fullWidth>
                            <InputLabel id="service-cat-label" sx={{ fontWeight: 600 }}>{t('customers.service_category')}</InputLabel>
                            <Select
                                labelId="service-cat-label"
                                value={currentItem?.category || ''}
                                label={t('customers.service_category')}
                                onChange={(e) => setCurrentItem({ ...currentItem, category: e.target.value })}
                                disabled={currentItem?.isSystem}
                                sx={{ borderRadius: '16px', fontWeight: 700 }}
                            >
                                <MenuItem value=""><em>{t('common.select')}</em></MenuItem>
                                {settings.categories?.map(c => (
                                    <MenuItem key={c.id} value={c.id} sx={{ fontWeight: 700 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color }} />
                                            {i18n.language === 'tr' ? c.label_tr : c.label_en}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    <CustomColorPicker
                        value={currentItem?.color}
                        onChange={handleColorChange}
                        label={t('customers.select_color')}
                        disabled={currentItem?.isSystem}
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 4, pt: 0, gap: 2 }}>
                <Button
                    fullWidth
                    onClick={onClose}
                    sx={{ fontWeight: 800, borderRadius: '14px', py: 1.5, color: 'text.secondary' }}
                >
                    {t('common.cancel')}
                </Button>
                <Button
                    fullWidth
                    onClick={onSave}
                    variant="contained"
                    disabled={
                        activeTab?.type === 'service'
                            ? !(currentItem?.name_tr || currentItem?.name_en) || !currentItem?.category
                            : !(currentItem?.label_tr || currentItem?.label_en)
                    }
                    sx={{
                        borderRadius: '14px',
                        py: 1.5,
                        fontWeight: 900,
                        boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.2)}`
                    }}
                >
                    {t('common.save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
