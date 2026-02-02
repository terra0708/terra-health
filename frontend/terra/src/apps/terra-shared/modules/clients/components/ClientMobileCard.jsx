import React from 'react';
import { Box, Paper, Typography, Chip, IconButton, alpha, Stack, Button } from '@mui/material';
import { Edit3, Trash2, Calendar, Phone, Tag, Info, UserCheck } from 'lucide-react';
import { ALL_COUNTRIES } from '../data/countries';
import { useTranslation } from 'react-i18next';
import { useLookup } from '@shared/common/hooks/useLookup';

/**
 * Generic Client Mobile Card Component
 * 
 * Base client bilgilerini mobile görünümde gösterir. Domain-specific detaylar
 * (services, tags, status) props olarak geçilir.
 */
export const ClientMobileCard = ({ 
    client, 
    t, 
    theme, 
    onEdit, 
    onInfo, 
    getStatusChip,
    // Optional: Domain-specific fields
    showServices = false,
    showTags = false,
    getService = null,
    getTag = null
}) => {
    const { i18n } = useTranslation();
    const { getSource } = useLookup();
    const lang = i18n.language;

    const getSourceLabel = (source) => {
        return getSource(typeof source === 'object' ? source?.type : source).label;
    };

    const getCountryFlag = (code) => {
        const country = ALL_COUNTRIES.find(c => c.code === code);
        return country ? country.flag : code;
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
                        {getCountryFlag(client.country)}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.3, unicodeBidi: 'plaintext', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {client.name}
                        </Typography>
                        {showTags && getTag && client.tags && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {client.tags.map((tagLabel, idx) => {
                                    const { label, color } = getTag(tagLabel);
                                    return (
                                        <Chip
                                            key={idx} label={label} size="small"
                                            sx={{ bgcolor: alpha(color, 0.1), color: color, fontWeight: 800, fontSize: '0.6rem', height: 18 }}
                                        />
                                    );
                                })}
                            </Box>
                        )}
                    </Box>
                </Box>
                {getStatusChip && getStatusChip(client.status)}
            </Box>

            <Stack spacing={1.5} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone size={14} strokeWidth={2.5} color={theme.palette.text.secondary} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{client.phone || '-'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Calendar size={14} strokeWidth={2.5} color={theme.palette.text.secondary} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{client.registrationDate}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tag size={14} strokeWidth={2.5} color={theme.palette.text.secondary} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{getSourceLabel(client.source)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <UserCheck size={14} strokeWidth={2.5} color={theme.palette.text.secondary} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {/* TODO: backend consultant/owner name mapping can be wired here */}
                        {client.assignedToName || '-'}
                    </Typography>
                </Box>
            </Stack>

            {showServices && getService && client.services && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2 }}>
                    {client.services.map((service, idx) => {
                        const { label, color } = getService(service);
                        return (
                            <Chip
                                key={idx} label={label} size="small"
                                sx={{ bgcolor: alpha(color, 0.08), color: color, fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${alpha(color, 0.15)}` }}
                            />
                        );
                    })}
                </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1, pt: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
                <IconButton onClick={() => onInfo(client)} sx={{ bgcolor: alpha(theme.palette.info.main, 0.06), color: 'info.main', borderRadius: '10px' }}>
                    <Info size={18} />
                </IconButton>
                <Button fullWidth onClick={() => onEdit(client)} size="small" startIcon={<Edit3 size={16} />} sx={{ borderRadius: '10px', fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.06), flex: 1 }}>
                    {t('common.edit', 'Edit')}
                </Button>
                <IconButton size="small" sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.06), borderRadius: '10px', px: 2 }}>
                    <Trash2 size={16} />
                </IconButton>
            </Box>
        </Paper>
    );
};
