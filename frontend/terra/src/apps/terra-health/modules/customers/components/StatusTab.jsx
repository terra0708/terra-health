import React, { useMemo } from 'react';
import { Stack, TextField, MenuItem, FormControl, InputLabel, Select, OutlinedInput, Box, Chip, Typography } from '@mui/material';
import { useCustomerSettingsStore } from '../hooks/useCustomerSettingsStore';
import { useLookup } from '@common/hooks/useLookup';
import { Controller } from 'react-hook-form';

export const StatusTab = ({ register, control, t, lang, errors, watch }) => {
    const settings = useCustomerSettingsStore();
    const { getLocalized } = useLookup();

    // Watch categories for cascading services
    const selectedCategories = watch('categories') || [];

    // Filtered data (exclude system items)
    const availableCategories = useMemo(() =>
        settings.categories.filter(c => !c.isSystem && c.value !== 'system' && c.label_en !== 'system'),
        [settings.categories]);

    const availableServices = useMemo(() => {
        let services = settings.services.filter(s => !s.isSystem && s.value !== 'system' && s.name_en !== 'system');
        if (selectedCategories.length > 0) {
            // Find category IDs for selected category names (matches what's stored in 'categories' field)
            const selectedCatIds = availableCategories
                .filter(c => selectedCategories.includes(c.label_tr) || selectedCategories.includes(c.label_en))
                .map(c => c.id);

            services = services.filter(s => selectedCatIds.includes(s.category));
        }
        return services;
    }, [settings.services, selectedCategories, availableCategories]);

    const availableStatuses = useMemo(() =>
        settings.statuses.filter(s => !s.isSystem && s.value !== 'system' && s.label_en !== 'system'),
        [settings.statuses]);

    const availableSources = useMemo(() =>
        settings.sources.filter(s => !s.isSystem && s.value !== 'system' && s.label_en !== 'system'),
        [settings.sources]);

    const availableTags = useMemo(() =>
        settings.tags.filter(s => !s.isSystem && s.value !== 'system' && s.label_en !== 'system'),
        [settings.tags]);

    return (
        <Stack spacing={3}>
            {/* Consultant Selection */}
            <Controller
                name="consultantId"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        select
                        fullWidth
                        label={t('customers.consultant')}
                        InputProps={{ sx: { borderRadius: '16px' } }}
                        value={field.value || ''}
                    >
                        <MenuItem value=""><em>{t('customers.drawer.no_assignment')}</em></MenuItem>
                        {settings.consultants.map((user) => (
                            <MenuItem key={user.id} value={user.id}>
                                {user.name} ({user.email})
                            </MenuItem>
                        ))}
                    </TextField>
                )}
            />

            {/* Multiple Categories */}
            <Controller
                name="categories"
                control={control}
                render={({ field }) => (
                    <FormControl fullWidth>
                        <InputLabel>{t('customers.category')}</InputLabel>
                        <Select
                            multiple
                            {...field}
                            input={<OutlinedInput label={t('customers.category')} sx={{ borderRadius: '16px' }} />}
                            value={field.value || []}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((val) => (
                                        <Chip key={val} label={val} size="small" sx={{ borderRadius: '8px', bgcolor: 'primary.light', color: 'primary.contrastText' }} />
                                    ))}
                                </Box>
                            )}
                        >
                            {availableCategories.map((c) => (
                                <MenuItem key={c.id} value={lang === 'tr' ? c.label_tr : c.label_en}>
                                    {getLocalized(c)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
            />

            {/* Multiple Services (Cascading) */}
            <Controller
                name="services"
                control={control}
                render={({ field }) => (
                    <FormControl fullWidth>
                        <InputLabel>{t('customers.services')}</InputLabel>
                        <Select
                            multiple
                            {...field}
                            input={<OutlinedInput label={t('customers.services')} sx={{ borderRadius: '16px' }} />}
                            value={field.value || []}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((val) => (
                                        <Chip key={val} label={val} size="small" sx={{ borderRadius: '8px' }} />
                                    ))}
                                </Box>
                            )}
                        >
                            {availableServices.length === 0 ? (
                                <MenuItem disabled>
                                    <Typography variant="body2">{t('customers.drawer.no_services_found')}</Typography>
                                </MenuItem>
                            ) : (
                                availableServices.map((s) => (
                                    <MenuItem key={s.id} value={lang === 'tr' ? s.name_tr : s.name_en}>
                                        {getLocalized(s, 'service')}
                                    </MenuItem>
                                ))
                            )}
                        </Select>
                    </FormControl>
                )}
            />

            {/* Status & Source Row */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            select
                            fullWidth
                            label={t('common.status')}
                            sx={{ flex: 1, minWidth: { xs: '100%', sm: '45%' } }}
                            InputProps={{ sx: { borderRadius: '16px' } }}
                            value={field.value || availableStatuses[0]?.value || ''}
                            error={!!errors.status}
                            helperText={errors.status && t(errors.status.message)}
                        >
                            {availableStatuses.map((s) => <MenuItem key={s.id} value={s.value}>{getLocalized(s)}</MenuItem>)}
                        </TextField>
                    )}
                />

                <Controller
                    name="source"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            select
                            fullWidth
                            label={t('customers.source')}
                            sx={{ flex: 1, minWidth: { xs: '100%', sm: '45%' } }}
                            InputProps={{ sx: { borderRadius: '16px' } }}
                            value={field.value || availableSources[0]?.value || ''}
                            error={!!errors.source}
                            helperText={errors.source && t(errors.source.message)}
                        >
                            {availableSources.map((s) => <MenuItem key={s.id} value={s.value}>{getLocalized(s)}</MenuItem>)}
                        </TextField>
                    )}
                />
            </Box>

            {/* Multiple Tags */}
            <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                    <FormControl fullWidth>
                        <InputLabel>{t('customers.tags')}</InputLabel>
                        <Select
                            multiple
                            {...field}
                            input={<OutlinedInput label={t('customers.tags')} sx={{ borderRadius: '16px' }} />}
                            value={field.value || []}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((val) => (
                                        <Chip key={val} label={val} size="small" variant="outlined" sx={{ borderRadius: '8px' }} />
                                    ))}
                                </Box>
                            )}
                        >
                            {availableTags.map((t) => (
                                <MenuItem key={t.id} value={lang === 'tr' ? t.label_tr : t.label_en}>
                                    {getLocalized(t)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
            />
        </Stack>
    );
};
