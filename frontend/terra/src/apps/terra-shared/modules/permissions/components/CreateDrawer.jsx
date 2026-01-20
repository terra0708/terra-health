import React from 'react';
import { Box, Typography, IconButton, Button, TextField, Drawer, Divider, alpha } from '@mui/material';
import { X } from 'lucide-react';
import { COLORS } from '../data/mockData';

export const CreateDrawer = ({ open, onClose, onSave, type, formData, setFormData, theme, t, isMobile }) => {
    const isDark = theme.palette.mode === 'dark';
    return (
        <Drawer
            anchor={isMobile ? "bottom" : "right"}
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: isMobile ? '100%' : 400,
                    height: isMobile ? 'auto' : '100%',
                    borderRadius: isMobile ? '24px 24px 0 0' : '24px 0 0 24px',
                    overflow: 'hidden',
                    bgcolor: 'background.paper'
                }
            }}
        >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
                <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: alpha(theme.palette.primary.main, isDark ? 0.05 : 0.02) }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary' }}>{type === 'package' ? t('permissions.new_package') : t('permissions.new_role')}</Typography>
                    <IconButton onClick={(e) => { onClose(); e.currentTarget.blur(); }} sx={{ color: 'text.primary' }}><X /></IconButton>
                </Box>
                <Divider />
                <Box sx={{ p: 3, flexGrow: 1, maxHeight: isMobile ? '60vh' : 'none', overflowY: 'auto' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>{type === 'package' ? t('permissions.package_name') : t('permissions.role_name')} (TR)</Typography>
                    <TextField fullWidth placeholder={type === 'package' ? "Örn: Finans Paketi" : "Örn: Başhekim"} value={formData.name_tr} onChange={(e) => setFormData({ ...formData, name_tr: e.target.value })} sx={drawerFieldStyles} />

                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 2, mb: 1, color: 'text.primary' }}>{type === 'package' ? t('permissions.package_name') : t('permissions.role_name')} (EN)</Typography>
                    <TextField fullWidth placeholder={type === 'package' ? "Ex: Finance Package" : "Ex: Chief Physician"} value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} sx={drawerFieldStyles} />

                    {type === 'role' && (
                        <>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 3, mb: 1, color: 'text.primary' }}>{t('permissions.description')} (TR)</Typography>
                            <TextField fullWidth multiline rows={2} placeholder="Bu rolün görev tanımı..." value={formData.description_tr} onChange={(e) => setFormData({ ...formData, description_tr: e.target.value })} sx={drawerFieldStyles} />

                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 2, mb: 1, color: 'text.primary' }}>{t('permissions.description')} (EN)</Typography>
                            <TextField fullWidth multiline rows={2} placeholder="Job description for this role..." value={formData.description_en} onChange={(e) => setFormData({ ...formData, description_en: e.target.value })} sx={drawerFieldStyles} />
                        </>
                    )}

                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 3, mb: 2, color: 'text.primary' }}>{t('permissions.visual_color')}</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                        {COLORS.map((c) => (
                            <Box
                                key={c} onClick={() => setFormData({ ...formData, color: c })}
                                sx={{
                                    width: 36, height: 36, borderRadius: '50%', bgcolor: c, cursor: 'pointer',
                                    border: `3px solid ${formData.color === c ? alpha(c, 0.3) : 'transparent'}`,
                                    outline: formData.color === c ? `2px solid ${c}` : 'none',
                                    transition: 'all 0.2s ease', '&:hover': { transform: 'scale(1.1)' }
                                }}
                            />
                        ))}
                    </Box>
                </Box>
                <Box sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 2, bgcolor: 'background.paper' }}>
                    <Button fullWidth variant="outlined" onClick={(e) => { onClose(); e.currentTarget.blur(); }} sx={{ borderRadius: '12px', py: 1.5, color: 'text.primary', borderColor: 'divider' }}>{t('common.cancel')}</Button>
                    <Button fullWidth variant="contained" onClick={onSave} sx={{ borderRadius: '12px', py: 1.5, fontWeight: 800, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)` }}>
                        {type === 'package' ? t('permissions.add_package') : t('permissions.add_role')}
                    </Button>
                </Box>
            </Box>
        </Drawer>
    )
};

const drawerFieldStyles = {
    mb: 2,
    '& .MuiOutlinedInput-root': {
        borderRadius: '12px',
        bgcolor: (theme) => theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.5) : '#f8fafc',
        '& fieldset': { borderColor: (theme) => alpha(theme.palette.divider, 0.6) },
        '&.Mui-focused fieldset': { borderColor: 'primary.main' },
        '& input, & textarea': { color: 'text.primary' }
    }
};
