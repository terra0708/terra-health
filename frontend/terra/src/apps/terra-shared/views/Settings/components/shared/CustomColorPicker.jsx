import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, alpha, useTheme } from '@mui/material';
import { Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const COLOR_PALETTE = ['#a259ff', '#00d2ff', '#10b981', '#f59e0b', '#ef4444', '#f472b6', '#3b82f6', '#6b7280', '#fbbf24', '#8b5cf6', '#06b6d4', '#f97316'];

/**
 * Optimized Color Picker Component
 * @param {string} value - Current color value
 * @param {Function} onChange - Callback when color changes
 * @param {string} label - Label for the color picker
 */
export const CustomColorPicker = ({ value, onChange, label }) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const [localColor, setLocalColor] = useState(value);

    useEffect(() => {
        setLocalColor(value);
    }, [value]);

    const handlePickerChange = (e) => {
        const newColor = e.target.value;
        setLocalColor(newColor);
        onChange(newColor);
    };

    return (
        <Box sx={{ mt: 2, p: 2, borderRadius: '20px', border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.default, 0.4) }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Palette size={18} style={{ color: theme.palette.primary.main }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{label}</Typography>
            </Box>
            <Grid container spacing={1.5} alignItems="center">
                {COLOR_PALETTE.map((c) => (
                    <Grid item key={c}>
                        <Box
                            onClick={() => onChange(c)}
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: '12px',
                                bgcolor: c,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '3px solid transparent',
                                borderColor: value === c ? theme.palette.text.primary : 'transparent',
                                boxShadow: value === c ? `0 0 12px ${alpha(c, 0.5)}` : 'none',
                                transform: value === c ? 'scale(1.1)' : 'scale(1)',
                                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                '&:hover': { transform: 'scale(1.15)' }
                            }}
                        >
                            {value === c && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'white' }} />}
                        </Box>
                    </Grid>
                ))}
            </Grid>
            <Box sx={{ mt: 3, pt: 2, borderTop: `1px dashed ${theme.palette.divider}` }}>
                <Typography variant="caption" sx={{ fontWeight: 800, mb: 1, display: 'block', color: 'text.secondary' }}>
                    {t('customers.custom_color_picker', 'Özel Renk Seçici')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        component="input"
                        type="color"
                        value={localColor || '#a259ff'}
                        onChange={handlePickerChange}
                        sx={{
                            width: 60,
                            height: 40,
                            p: 0,
                            border: '2px solid',
                            borderColor: 'divider',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            '&::-webkit-color-swatch-wrapper': { p: 0 },
                            '&::-webkit-color-swatch': { border: 'none', borderRadius: '10px' }
                        }}
                    />
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, opacity: 0.7 }}>
                        {localColor?.toUpperCase()}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};
