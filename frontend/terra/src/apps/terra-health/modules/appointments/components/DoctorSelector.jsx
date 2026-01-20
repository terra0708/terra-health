import React from 'react';
import { Box, Typography, Avatar, useTheme, alpha, Autocomplete, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Stethoscope, Search } from 'lucide-react';

export const DoctorSelector = ({ doctors, selectedDoctorId, onSelect }) => {
    const { t } = useTranslation();
    const theme = useTheme();

    const selectedDoctor = doctors.find(d => d.id === selectedDoctorId) || null;

    return (
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
                p: 1.5,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: '12px',
                color: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Stethoscope size={24} />
            </Box>
            <Autocomplete
                options={doctors}
                getOptionLabel={(option) => option.name || ''}
                value={selectedDoctor}
                onChange={(_, newValue) => {
                    if (newValue) onSelect(newValue.id);
                }}
                sx={{
                    flex: 1,
                    maxWidth: 400,
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '16px',
                        bgcolor: 'background.paper',
                    }
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={t('appointments.doctor', 'Doctor')}
                        placeholder={t('common.search')}
                        InputProps={{
                            ...params.InputProps,
                            startAdornment: selectedDoctor ? (
                                <Avatar
                                    src={selectedDoctor.avatar}
                                    sx={{ width: 24, height: 24, mr: 1 }}
                                />
                            ) : null
                        }}
                    />
                )}
                renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    return (
                        <Box component="li" key={key} {...otherProps} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: '10px !important' }}>
                            <Avatar src={option.avatar} sx={{ width: 32, height: 32 }} />
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{option.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{t('users.roles.doctor')}</Typography>
                            </Box>
                        </Box>
                    );
                }}
            />
            <Box sx={{ ml: 'auto', textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                    {t('appointments.active_view')}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {selectedDoctor?.name || '---'}
                </Typography>
            </Box>
        </Box>
    );
};
