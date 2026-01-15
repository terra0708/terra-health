import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, Box, Typography, IconButton,
    Grid, Chip, alpha, useTheme, Divider, Stack
} from '@mui/material';
import {
    X, User, Phone, Globe, Link as LinkIcon, Calendar,
    Tag as TagIcon, Briefcase, Activity, Clock
} from 'lucide-react';
import { useCustomerSettingsStore } from '../hooks/useCustomerSettingsStore';
import { formatLocaleDate, ALL_COUNTRIES } from '../data/countries';
import { useTranslation } from 'react-i18next';

export const CustomerDetailsDialog = ({ open, onClose, customer }) => {
    const theme = useTheme();
    const { t, i18n } = useTranslation();
    const settings = useCustomerSettingsStore();
    const lang = i18n.language;

    if (!customer) return null;

    const country = ALL_COUNTRIES.find(c => c.code === customer.country);

    const getLocalizedLabel = (def, type) => {
        if (!def) return '-';
        if (type === 'service') return lang === 'tr' ? def.name_tr : (def.name_en || def.name_tr);
        return lang === 'tr' ? def.label_tr : (def.label_en || def.label_tr);
    };

    const InfoRow = ({ icon: Icon, label, value, color }) => (
        <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
            <Box sx={{
                width: 40, height: 40, borderRadius: '12px',
                bgcolor: alpha(color || theme.palette.primary.main, 0.1),
                color: color || theme.palette.primary.main,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
            }}>
                <Icon size={20} />
            </Box>
            <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 0.2 }}>
                    {label.toUpperCase()}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {value || '-'}
                </Typography>
            </Box>
        </Box>
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: '24px', p: 1 }
            }}
        >
            <DialogTitle sx={{ p: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                    {t('customers.customer_details')}
                </Typography>
                <IconButton onClick={onClose} sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), color: 'error.main' }}>
                    <X size={20} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3, pt: 1 }}>
                <Stack spacing={4}>
                    {/* Header Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.03), borderRadius: '20px' }}>
                        <Box sx={{ fontSize: '3rem' }}>{country?.flag || '🏳️'}</Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>{customer.name}</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                {country?.name} • {customer.phone}
                            </Typography>
                        </Box>
                    </Box>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <InfoRow icon={User} label={t('common.name')} value={customer.name} />
                            <InfoRow icon={Phone} label={t('customers.phone')} value={customer.phone} />
                            <InfoRow icon={Globe} label={t('customers.country')} value={`${country?.name} (${customer.country})`} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <InfoRow
                                icon={Activity}
                                label={t('common.status')}
                                value={getLocalizedLabel(settings.statuses.find(s => s.value === customer.status))}
                                color={settings.statuses.find(s => s.value === customer.status)?.color}
                            />
                            <InfoRow
                                icon={LinkIcon}
                                label={t('customers.source')}
                                value={getLocalizedLabel(settings.sources.find(s => s.value === customer.source))}
                                color={settings.sources.find(s => s.value === customer.source)?.color}
                            />
                            <InfoRow icon={Calendar} label={t('customers.registration_date')} value={formatLocaleDate(customer.registrationDate, lang)} />
                        </Grid>
                    </Grid>

                    <Divider />

                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Briefcase size={18} /> {t('customers.services')}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {customer.services?.map((sName, i) => {
                                const def = settings.services.find(s => s.name_tr === sName || s.name_en === sName || s.name === sName);
                                const color = def?.color || theme.palette.secondary.main;
                                return (
                                    <Chip
                                        key={i}
                                        label={getLocalizedLabel(def, 'service') || sName}
                                        sx={{ fontWeight: 700, bgcolor: alpha(color, 0.1), color: color, border: `1px solid ${alpha(color, 0.2)}` }}
                                    />
                                );
                            })}
                        </Box>
                    </Box>

                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TagIcon size={18} /> {t('customers.tags')}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {customer.tags?.map((tName, i) => {
                                const def = settings.tags.find(t => t.label_tr === tName || t.label_en === tName || t.label === tName);
                                const color = def?.color || theme.palette.text.secondary;
                                return (
                                    <Chip
                                        key={i}
                                        label={getLocalizedLabel(def) || tName}
                                        sx={{ fontWeight: 700, bgcolor: alpha(color, 0.1), color: color, borderRadius: '8px' }}
                                    />
                                );
                            })}
                        </Box>
                    </Box>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};
