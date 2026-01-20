import React from 'react';
import { Stack, TextField, Box, MenuItem, Typography } from '@mui/material';
import { User, Phone, Mail, Calendar } from 'lucide-react';
import { ALL_COUNTRIES } from '../data/countries';
import { EditableList } from '@common/ui/EditableList';
import { useTranslation } from 'react-i18next';
import { Controller, useController } from 'react-hook-form';

export const PersonalInfoTab = ({ register, control, t, i18n, errors }) => {
    const { field: notesField } = useController({ name: 'notes', control });

    const handleAddNote = (newNote) => {
        const currentNotes = Array.isArray(notesField.value) ? notesField.value : [];
        notesField.onChange([{ id: Date.now(), ...newNote }, ...currentNotes]);
    };

    const handleUpdateNote = (id, updates) => {
        const currentNotes = Array.isArray(notesField.value) ? notesField.value : [];
        notesField.onChange(currentNotes.map(n => n.id === id ? { ...n, ...updates } : n));
    };

    const handleDeleteNote = (id) => {
        const currentNotes = Array.isArray(notesField.value) ? notesField.value : [];
        notesField.onChange(currentNotes.filter(n => n.id !== id));
    };

    return (
        <Stack spacing={3}>
            {/* Using raw controller for better integration with shared fields if needed, 
                but standard register is enough for simple inputs. 
                Errors are passed from parent. */}

            <TextField
                {...register('name')}
                fullWidth
                label={t('common.name')}
                error={!!errors.name}
                helperText={errors.name && t(errors.name.message)}
                InputProps={{
                    sx: { borderRadius: '16px' },
                    startAdornment: <User size={18} style={{ marginRight: 12, opacity: 0.5 }} />
                }}
            />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            select
                            label={t('customers.country')}
                            sx={{ width: { xs: '100%', sm: '160px' } }}
                            InputProps={{ sx: { borderRadius: '16px' } }}
                            value={field.value || 'TR'}
                        >
                            {ALL_COUNTRIES.map((c) => <MenuItem key={c.code} value={c.code}>{c.flag} {c.code}</MenuItem>)}
                        </TextField>
                    )}
                />

                <TextField
                    {...register('phone')}
                    fullWidth
                    label={t('customers.phone')}
                    error={!!errors.phone}
                    helperText={errors.phone && t(errors.phone.message)}
                    sx={{ flex: 1, minWidth: { xs: '100%', sm: '200px' } }}
                    InputProps={{
                        sx: { borderRadius: '16px' },
                        startAdornment: <Phone size={18} style={{ marginRight: 12, opacity: 0.5 }} />
                    }}
                />
            </Box>

            <TextField
                {...register('email')}
                fullWidth
                label={t('customers.email')}
                error={!!errors.email}
                helperText={errors.email && t(errors.email.message)}
                InputProps={{
                    sx: { borderRadius: '16px' },
                    startAdornment: <Mail size={18} style={{ marginRight: 12, opacity: 0.5 }} />
                }}
            />

            <TextField
                {...register('registrationDate')}
                fullWidth
                type="date"
                label={t('customers.registration_date')}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                    sx: { borderRadius: '16px' },
                    startAdornment: <Calendar size={18} style={{ marginRight: 12, opacity: 0.5 }} />
                }}
            />

            <Box>
                <EditableList
                    title={t('customers.notes')}
                    items={notesField.value}
                    onAdd={handleAddNote}
                    onUpdate={handleUpdateNote}
                    onDelete={handleDeleteNote}
                    placeholder={t('customers.drawer.note_placeholder')}
                    emptyText={t('customers.no_notes', 'Henüz not yok')}
                    color="primary.main"
                />
            </Box>
        </Stack>
    );
};
