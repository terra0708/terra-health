import React, { useState, useEffect } from 'react';
import {
    Drawer, Box, Typography, TextField, Button, IconButton, Stack,
    MenuItem, FormControl, InputLabel, Select, OutlinedInput, Chip,
    alpha, useTheme, Divider
} from '@mui/material';
import { X, Save, User, Phone } from 'lucide-react';
import { useCustomerSettingsStore } from '../hooks/useCustomerSettingsStore';
import { useCustomerStore } from '../hooks/useCustomerStore';
import { ALL_COUNTRIES } from '../data/countries';
import { useTranslation } from 'react-i18next';

export const CustomerDrawer = ({ open, onClose, customer, t }) => {
    const theme = useTheme();
    const { i18n } = useTranslation();
    const settings = useCustomerSettingsStore();
    const { addCustomer, updateCustomer } = useCustomerStore();
    const lang = i18n.language;

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        country: 'TR',
        source: '',
        status: 'active',
        services: [],
        tags: []
    });

    useEffect(() => {
        if (customer) {
            setFormData(customer);
        } else {
            setFormData({
                name: '', phone: '', country: 'TR',
                source: settings.sources[0]?.value || '',
                status: settings.statuses[0]?.value || 'active',
                services: [], tags: []
            });
        }
    }, [customer, open, settings]);

    const handleChange = (field) => (e) => {
        setFormData({ ...formData, [field]: e.target.value });
    };

    const handleSave = () => {
        if (customer) {
            updateCustomer(customer.id, formData);
        } else {
            addCustomer(formData);
        }
        onClose();
    };

    const getLocalizedLabel = (item) => {
        return lang === 'tr' ? item.label_tr || item.name_tr : (item.label_en || item.name_en || item.label_tr || item.name_tr);
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { width: { xs: '100%', sm: 450 }, borderLeft: 'none', boxShadow: '-10px 0 40px rgba(0,0,0,0.1)' } }}
        >
            <Box sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>
                        {customer ? t('customers.edit_customer') : t('customers.add_customer')}
                    </Typography>
                    <IconButton onClick={onClose} sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), color: 'error.main' }}>
                        <X size={20} />
                    </IconButton>
                </Box>

                <Stack spacing={3}>
                    <Box>
                        <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', mb: 2, display: 'block' }}>
                            {t('customers.basic_info')}
                        </Typography>
                        <Stack spacing={2.5}>
                            <TextField
                                fullWidth label={t('common.name')}
                                value={formData.name} onChange={handleChange('name')}
                                InputProps={{ startAdornment: <User size={18} style={{ marginRight: 12, opacity: 0.5 }} /> }}
                            />

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    select label={t('customers.country')}
                                    value={formData.country} onChange={handleChange('country')}
                                    sx={{ width: '130px' }}
                                >
                                    {ALL_COUNTRIES.map((c) => (
                                        <MenuItem key={c.code} value={c.code}>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <span>{c.flag}</span>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{c.code}</Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    fullWidth label={t('customers.phone')}
                                    value={formData.phone} onChange={handleChange('phone')}
                                    InputProps={{ startAdornment: <Phone size={18} style={{ marginRight: 12, opacity: 0.5 }} /> }}
                                />
                            </Box>
                        </Stack>
                    </Box>

                    <Divider />

                    <Box>
                        <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', mb: 2, display: 'block' }}>
                            {t('customers.assignment_info')}
                        </Typography>
                        <Stack spacing={2.5}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    select fullWidth label={t('customers.source')}
                                    value={formData.source} onChange={handleChange('source')}
                                >
                                    {settings.sources.map((s) => (
                                        <MenuItem key={s.id} value={s.value}>{getLocalizedLabel(s)}</MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    select fullWidth label={t('common.status')}
                                    value={formData.status} onChange={handleChange('status')}
                                >
                                    {settings.statuses.map((s) => (
                                        <MenuItem key={s.id} value={s.value}>{getLocalizedLabel(s)}</MenuItem>
                                    ))}
                                </TextField>
                            </Box>
                        </Stack>
                    </Box>

                    <Divider />

                    <Box>
                        <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', mb: 2, display: 'block' }}>
                            {t('customers.services_and_tags')}
                        </Typography>
                        <Stack spacing={2.5}>
                            <FormControl fullWidth>
                                <InputLabel>{t('customers.services')}</InputLabel>
                                <Select
                                    multiple value={formData.services} onChange={handleChange('services')}
                                    input={<OutlinedInput label={t('customers.services')} />}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((val) => {
                                                const s = settings.services.find(x => x.name_tr === val || x.name_en === val);
                                                const sColor = s?.color || theme.palette.primary.main;
                                                return <Chip key={val} label={s ? getLocalizedLabel(s) : val} size="small" sx={{ bgcolor: alpha(sColor, 0.1), color: sColor }} />;
                                            })}
                                        </Box>
                                    )}
                                >
                                    {settings.services.map((s) => <MenuItem key={s.id} value={s.name_tr}>{getLocalizedLabel(s)}</MenuItem>)}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel>{t('customers.tags')}</InputLabel>
                                <Select
                                    multiple value={formData.tags} onChange={handleChange('tags')}
                                    input={<OutlinedInput label={t('customers.tags')} />}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((val) => {
                                                const tag = settings.tags.find(x => x.label_tr === val || x.label_en === val);
                                                const tColor = tag?.color || theme.palette.text.secondary;
                                                return <Chip key={val} label={tag ? getLocalizedLabel(tag) : val} size="small" sx={{ bgcolor: alpha(tColor, 0.1), color: tColor }} />;
                                            })}
                                        </Box>
                                    )}
                                >
                                    {settings.tags.map((t) => <MenuItem key={t.id} value={t.label_tr}>{getLocalizedLabel(t)}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Box>

                    <Button
                        fullWidth size="large" variant="contained" onClick={handleSave}
                        sx={{ borderRadius: '16px', py: 2, mt: 2, fontWeight: 900, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)` }}
                    >
                        {customer ? t('common.update') : t('common.save')}
                    </Button>
                </Stack>
            </Box>
        </Drawer>
    );
};
