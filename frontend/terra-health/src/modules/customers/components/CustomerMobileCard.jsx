import React from 'react';
import { Box, Paper, Typography, Chip, IconButton, alpha, Stack, Button } from '@mui/material';
import { Edit3, Trash2, Calendar, Phone, Tag, Info, UserCheck } from 'lucide-react';
import { countryFlags } from '../data/mockData';
import { useCustomerSettingsStore } from '../hooks/useCustomerSettingsStore';
import { useTranslation } from 'react-i18next';
import { MOCK_USERS } from '../../users';

export const CustomerMobileCard = ({ customer, t, theme, onEdit, onInfo, getStatusChip }) => {
    const { i18n } = useTranslation();
    const settings = useCustomerSettingsStore();
    const lang = i18n.language;

    const getSourceLabel = (source) => {
        const sourceVal = typeof source === 'object' ? source?.type : source;
        const foundSource = settings.sources.find(s => s.value === sourceVal);
        if (!foundSource) return sourceVal || '-';
        return lang === 'tr' ? foundSource.label_tr : (foundSource.label_en || foundSource.label_tr);
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.5, mb: 2, borderRadius: '20px', border: `1px solid ${theme.palette.divider}`,
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
                    <Box sx={{ fontSize: '2rem', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', bgcolor: alpha(theme.palette.primary.main, 0.06) }}>
                        {countryFlags[customer.country] || customer.country}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.3, unicodeBidi: 'plaintext', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {customer.name}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {customer.tags && customer.tags.map((tagLabel, idx) => {
                                const tag = settings.tags.find(t => t.label_tr === tagLabel || t.label_en === tagLabel);
                                const finalLabel = tag ? (lang === 'tr' ? tag.label_tr : (tag.label_en || tag.label_tr)) : tagLabel;
                                return (
                                    <Chip
                                        key={idx} label={finalLabel} size="small"
                                        sx={{ bgcolor: tag ? alpha(tag.color, 0.1) : alpha(theme.palette.divider, 0.1), color: tag?.color || theme.palette.text.secondary, fontWeight: 800, fontSize: '0.6rem', height: 18 }}
                                    />
                                );
                            })}
                        </Box>
                    </Box>
                </Box>
                {getStatusChip(customer.status)}
            </Box>

            <Stack spacing={1.5} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone size={14} strokeWidth={2.5} color={theme.palette.text.secondary} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{customer.phone || '-'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Calendar size={14} strokeWidth={2.5} color={theme.palette.text.secondary} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{customer.registrationDate}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tag size={14} strokeWidth={2.5} color={theme.palette.text.secondary} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{getSourceLabel(customer.source)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <UserCheck size={14} strokeWidth={2.5} color={theme.palette.text.secondary} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {MOCK_USERS.find(u => u.id === customer.consultantId)?.name || '-'}
                    </Typography>
                </Box>
            </Stack>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2 }}>
                {customer.services.map((service, idx) => {
                    const def = settings.services.find(s => s.name_tr === service || s.name_en === service);
                    const finalLabel = def ? (lang === 'tr' ? def.name_tr : (def.name_en || def.name_tr)) : service;
                    const sColor = def?.color || theme.palette.secondary.main;
                    return (
                        <Chip
                            key={idx} label={finalLabel} size="small"
                            sx={{ bgcolor: alpha(sColor, 0.08), color: sColor, fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${alpha(sColor, 0.15)}` }}
                        />
                    );
                })}
            </Box>

            <Box sx={{ display: 'flex', gap: 1, pt: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
                <IconButton onClick={() => onInfo(customer)} sx={{ bgcolor: alpha(theme.palette.info.main, 0.06), color: 'info.main', borderRadius: '10px' }}>
                    <Info size={18} />
                </IconButton>
                <Button fullWidth onClick={() => onEdit(customer)} size="small" startIcon={<Edit3 size={16} />} sx={{ borderRadius: '10px', fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.06), flex: 1 }}>
                    {t('common.edit')}
                </Button>
                <IconButton size="small" sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.06), borderRadius: '10px', px: 2 }}>
                    <Trash2 size={16} />
                </IconButton>
            </Box>
        </Paper>
    );
};
