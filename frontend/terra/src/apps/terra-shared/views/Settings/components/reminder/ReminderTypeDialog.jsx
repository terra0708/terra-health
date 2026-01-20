import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    Box,
    Typography,
    alpha,
    useTheme
} from '@mui/material';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CustomColorPicker } from '../shared/CustomColorPicker';
import { availableIcons } from '../../../../modules/reminders/utils/iconUtils.jsx';

/**
 * Dialog for adding/editing reminder parameter types (categories)
 */
export const ReminderTypeDialog = ({
    open,
    onClose,
    selectedParamType,
    newParamType,
    setNewParamType,
    onSave
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { borderRadius: '28px', width: '100%', maxWidth: 480 } }}
            disableEnforceFocus={false}
            disableAutoFocus={false}
        >
            <DialogTitle sx={{ fontWeight: 900, px: 4, pt: 4, pb: 1 }}>
                {selectedParamType 
                    ? t('settings.edit_reminder_type', 'Hatırlatıcı Türü Düzenle')
                    : t('settings.add_reminder_type', 'Yeni Hatırlatıcı Türü Ekle')
                }
            </DialogTitle>
            <DialogContent sx={{ px: 4, pb: 2 }}>
                <Stack spacing={3} sx={{ mt: 2 }}>
                    <TextField
                        fullWidth
                        label={t('settings.category_name', 'Kategori Adı') + ' (TR)'}
                        value={newParamType.label_tr}
                        onChange={(e) => setNewParamType({ ...newParamType, label_tr: e.target.value })}
                        InputProps={{
                            startAdornment: <Languages size={18} style={{ marginRight: 12, opacity: 0.5 }} />,
                            sx: { borderRadius: '16px', fontWeight: 700 }
                        }}
                    />
                    <TextField
                        fullWidth
                        label={t('settings.category_name', 'Kategori Adı') + ' (EN)'}
                        value={newParamType.label_en}
                        onChange={(e) => setNewParamType({ ...newParamType, label_en: e.target.value })}
                        InputProps={{
                            startAdornment: <Languages size={18} style={{ marginRight: 12, opacity: 0.5 }} />,
                            sx: { borderRadius: '16px', fontWeight: 700 }
                        }}
                    />
                    {/* İkon Seçimi - Görsel Grid */}
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary' }}>
                            {t('common.icon', 'İkon')}
                        </Typography>
                        <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: { 
                                xs: 'repeat(5, 1fr)', 
                                sm: 'repeat(6, 1fr)', 
                                md: 'repeat(6, 1fr)' 
                            },
                            gap: 0.75,
                            p: 1.5,
                            bgcolor: alpha(theme.palette.background.default, 0.5),
                            borderRadius: '16px',
                            border: `1px solid ${theme.palette.divider}`,
                            maxHeight: 300,
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            {availableIcons.map((icon) => {
                                const IconComponent = icon.component;
                                const isSelected = newParamType.icon === icon.name;
                                return (
                                    <Box
                                        key={icon.name}
                                        onClick={() => setNewParamType({ ...newParamType, icon: icon.name })}
                                        sx={{
                                            p: 1,
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            minWidth: 0,
                                            bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                                            border: isSelected ? `2px solid ${theme.palette.primary.main}` : `2px solid transparent`,
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                                                transform: 'scale(1.05)'
                                            }
                                        }}
                                    >
                                        <IconComponent 
                                            size={20} 
                                            color={isSelected ? theme.palette.primary.main : theme.palette.text.secondary}
                                        />
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                    <CustomColorPicker
                        value={newParamType.color}
                        onChange={(color) => setNewParamType({ ...newParamType, color })}
                        label={t('common.color', 'Renk')}
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 4, pt: 0, gap: 2 }}>
                <Button
                    fullWidth
                    onClick={onClose}
                    sx={{ fontWeight: 800, borderRadius: '14px', py: 1.5, color: 'text.secondary' }}
                >
                    {t('common.cancel', 'İptal')}
                </Button>
                <Button
                    fullWidth
                    onClick={onSave}
                    variant="contained"
                    disabled={!newParamType.label_tr}
                    sx={{
                        borderRadius: '14px',
                        py: 1.5,
                        fontWeight: 900,
                        boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.2)}`
                    }}
                >
                    {t('common.save', 'Kaydet')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
