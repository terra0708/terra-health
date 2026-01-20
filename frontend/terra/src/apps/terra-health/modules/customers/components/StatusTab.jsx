import React from 'react';
import { Stack, TextField, MenuItem, FormControl, InputLabel, Select, OutlinedInput, Box, Chip } from '@mui/material';
import { MOCK_USERS } from '@shared/modules/users';
import { useCustomerSettingsStore } from '../hooks/useCustomerSettingsStore';
import { useLookup } from '@common/hooks/useLookup';
import { Controller } from 'react-hook-form';

export const StatusTab = ({ register, control, t, lang, errors }) => {
    const settings = useCustomerSettingsStore();
    const { getLocalized } = useLookup();

    return (
        <Stack spacing={3}>
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
                        {MOCK_USERS.filter(u => u.role === 'consultant').map((u) => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
                    </TextField>
                )}
            />

            <Controller
                name="category"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        select
                        fullWidth
                        label={t('customers.category')}
                        InputProps={{ sx: { borderRadius: '16px' } }}
                        value={field.value || ''}
                    >
                        {settings.categories.map((c) => <MenuItem key={c.id} value={c.label_tr}>{getLocalized(c)}</MenuItem>)}
                    </TextField>
                )}
            />

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
                            {settings.services.map((s) => <MenuItem key={s.id} value={s.name_tr}>{getLocalized(s, 'service')}</MenuItem>)}
                        </Select>
                    </FormControl>
                )}
            />

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
                            value={field.value || settings.statuses[0]?.value || ''}
                        >
                            {settings.statuses.map((s) => <MenuItem key={s.id} value={s.value}>{getLocalized(s)}</MenuItem>)}
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
                            value={field.value || settings.sources[0]?.value || ''}
                        >
                            {settings.sources.map((s) => <MenuItem key={s.id} value={s.value}>{getLocalized(s)}</MenuItem>)}
                        </TextField>
                    )}
                />
            </Box>
        </Stack>
    );
};
