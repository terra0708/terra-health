import React from 'react';
import { Box, Paper, Typography, Chip, IconButton, alpha, useTheme, Stack } from '@mui/material';
import { Edit3, Trash2, Calendar, Phone, MapPin, Tag } from 'lucide-react';
import { countryFlags } from '../data/mockData';
import { useCustomerSettingsStore } from '../hooks/useCustomerSettingsStore';

export const CustomerMobileCard = ({ customer, t, theme, onEdit, getStatusChip }) => {
    const settings = useCustomerSettingsStore();

    const getSourceLabel = (source) => {
        if (typeof source === 'object' && source !== null) {
            if (source.type === 'ad' && source.campaign) return source.campaign;
            const foundSource = settings.sources.find(s => s.value === source.type);
            return foundSource ? foundSource.label : (source.type || '');
        }
        const foundSource = settings.sources.find(s => s.value === source);
        return foundSource ? foundSource.label : source;
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                mb: 2,
                borderRadius: '20px',
                border: `1px solid ${theme.palette.divider}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                    <Box
                        sx={{
                            fontSize: '2rem',
                            width: 48,
                            height: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '12px',
                            bgcolor: alpha(theme.palette.primary.main, 0.06),
                        }}
                    >
                        {countryFlags[customer.country]}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontWeight: 800,
                                color: 'text.primary',
                                mb: 0.3,
                                unicodeBidi: 'plaintext',
                                textAlign: 'left',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {customer.name}
                        </Typography>
                        <Stack spacing={0.5}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                {customer.consultant}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {customer.tags && customer.tags.map((tagLabel, idx) => {
                                    const tag = settings.tags.find(t => t.label === tagLabel);
                                    return (
                                        <Chip
                                            key={idx}
                                            label={tagLabel}
                                            size="small"
                                            sx={{
                                                bgcolor: tag ? alpha(tag.color, 0.1) : alpha(theme.palette.divider, 0.1),
                                                color: tag?.color || theme.palette.text.secondary,
                                                fontWeight: 800,
                                                fontSize: '0.6rem',
                                                height: 18
                                            }}
                                        />
                                    );
                                })}
                            </Box>
                        </Stack>
                    </Box>
                </Box>
                {getStatusChip(customer.status)}
            </Box>

            <Stack spacing={1.5} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone size={14} strokeWidth={2.5} color={theme.palette.text.secondary} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {customer.phone}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Calendar size={14} strokeWidth={2.5} color={theme.palette.text.secondary} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {customer.registrationDate}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tag size={14} strokeWidth={2.5} color={theme.palette.text.secondary} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {getSourceLabel(customer.source)}
                    </Typography>
                </Box>
            </Stack>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2 }}>
                {customer.services.map((service, idx) => (
                    <Chip
                        key={idx}
                        label={service}
                        size="small"
                        sx={{
                            bgcolor: alpha(theme.palette.secondary.main, 0.08),
                            color: theme.palette.secondary.main,
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`
                        }}
                    />
                ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 1, pt: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
                <IconButton
                    onClick={() => onEdit(customer)}
                    size="small"
                    sx={{
                        flex: 1,
                        color: 'primary.main',
                        bgcolor: alpha(theme.palette.primary.main, 0.06),
                        borderRadius: '10px',
                        py: 1
                    }}
                >
                    <Edit3 size={16} />
                    <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 700 }}>
                        {t('common.edit')}
                    </Typography>
                </IconButton>
                <IconButton
                    size="small"
                    sx={{
                        flex: 1,
                        color: 'error.main',
                        bgcolor: alpha(theme.palette.error.main, 0.06),
                        borderRadius: '10px',
                        py: 1
                    }}
                >
                    <Trash2 size={16} />
                    <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 700 }}>
                        {t('common.delete')}
                    </Typography>
                </IconButton>
            </Box>
        </Paper>
    );
};
