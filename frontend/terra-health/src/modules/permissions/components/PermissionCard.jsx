import React from 'react';
import { Box, Typography, Paper, Checkbox, alpha } from '@mui/material';
import { useTranslation } from 'react-i18next';

export const PermissionCard = ({ perm, selected, color, onClick }) => {
    const { i18n } = useTranslation();
    const lang = i18n.language;

    return (
        <Paper
            elevation={0}
            onClick={onClick}
            sx={{
                p: 2, borderRadius: '16px', border: '1.5px solid',
                borderColor: selected ? color : 'divider',
                bgcolor: selected ? alpha(color, 0.03) : 'transparent',
                cursor: 'pointer', transition: 'all 0.2s ease',
                '&:hover': { borderColor: selected ? color : alpha('#000', 0.1), transform: 'translateY(-2px)' }
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Checkbox checked={selected} sx={{ p: 0, '&.Mui-checked': { color: color } }} />
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: selected ? 'text.primary' : 'text.secondary' }}>
                        {lang === 'tr' ? perm.name_tr : (perm.name_en || perm.name_tr)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', lineHeight: 1.2, display: 'block', mt: 0.5 }}>
                        {lang === 'tr' ? perm.description_tr : (perm.description_en || perm.description_tr)}
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
};
