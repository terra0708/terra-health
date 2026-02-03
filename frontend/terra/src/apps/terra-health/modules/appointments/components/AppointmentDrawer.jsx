import React, { useState, useEffect } from 'react';
import {
    Drawer, Box, Typography, IconButton, TextField, Button,
    Grid, MenuItem, useTheme, alpha
} from '@mui/material';
import { X, Calendar, Clock, User, FileText, CheckCircle2, Trash2 } from 'lucide-react';
import { APPOINTMENT_TYPES, APPOINTMENT_STATUSES } from '../data/mockData';
import { useCustomers } from '../../customers';
import { useTranslation } from 'react-i18next';

const fieldStyles = {
    '& .MuiOutlinedInput-root': { borderRadius: '12px' },
    '& .MuiInputLabel-root': {
        fontWeight: 800,
        color: 'text.primary',
        opacity: 1,
        fontSize: '0.9rem'
    }
};

import { Autocomplete } from '@mui/material';

export const AppointmentDrawer = ({ open, onClose, onSave, onDelete, appointment, doctor, doctors = [], onDoctorChange }) => {
    const theme = useTheme();
    const { t, i18n } = useTranslation(['terra-health', 'translation']);
    const { customers } = useCustomers();

    // Initial State
    const [formData, setFormData] = useState({
        doctorId: '',
        patientId: '',
        patientName: '', // Fallback for manual entry or display
        start: '',
        startTime: '',
        end: '',
        endTime: '',
        type: 'exam',
        status: 'scheduled',
        notes: ''
    });

    useEffect(() => {
        if (open && appointment) {
            const startDate = new Date(appointment.start);
            const endDate = new Date(appointment.end);

            setFormData({
                doctorId: appointment.doctorId || doctor?.id || '',
                patientId: appointment.patientId || '',
                patientName: appointment.patientName || '',
                start: startDate.toISOString().split('T')[0],
                startTime: startDate.toTimeString().slice(0, 5),
                end: endDate.toISOString().split('T')[0],
                endTime: endDate.toTimeString().slice(0, 5),
                type: appointment.type || 'exam',
                status: appointment.status || 'scheduled',
                notes: appointment.notes || ''
            });
        } else if (open && !appointment) {
            // New Appointment Defaults
            const now = new Date();
            const nowString = now.toISOString().split('T')[0];
            // Round to next hour
            now.setMinutes(0);
            now.setHours(now.getHours() + 1);
            const timeString = now.toTimeString().slice(0, 5);

            setFormData({
                doctorId: doctor?.id || '',
                patientId: '',
                patientName: '',
                start: nowString,
                startTime: timeString,
                end: nowString,
                endTime: timeString, // Ideally +30 mins
                type: 'exam',
                status: 'scheduled',
                notes: ''
            });
        }
    }, [open, appointment, doctor]);

    const handleSave = () => {
        const startDateTime = new Date(`${formData.start}T${formData.startTime}`);
        const endDateTime = new Date(`${formData.end}T${formData.endTime || formData.startTime}`);

        const customer = customers.find(c => c.id === formData.patientId);

        const payload = {
            ...appointment, // ID if exists
            doctorId: formData.doctorId,
            patientId: formData.patientId,
            patientName: customer ? customer.name : formData.patientName,
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
            type: formData.type,
            status: formData.status,
            notes: formData.notes
        };

        onSave(payload);
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            sx={{ zIndex: theme.zIndex.drawer + 2 }}
            PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, borderRadius: '24px 0 0 24px', p: 0, overflow: 'hidden' } }}
        >
            <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {appointment?.id ? t('appointments.edit_appointment') : t('appointments.new_appointment')}
                </Typography>
                <IconButton onClick={onClose} sx={{ bgcolor: 'background.paper', border: `1px solid ${theme.palette.divider}` }}><X size={20} /></IconButton>
            </Box>

            <Box sx={{ p: 3, overflowY: 'auto', maxHeight: 'calc(100vh - 140px)' }}>
                {/* DOCTOR SELECTION */}
                <Box sx={{ mb: 3 }}>
                    <Autocomplete
                        options={doctors}
                        getOptionLabel={(option) => option.name || ''}
                        value={doctors.find(d => d.id === formData.doctorId) || null}
                        onChange={(_, newValue) => {
                            const newId = newValue ? newValue.id : '';
                            setFormData({ ...formData, doctorId: newId });
                            if (onDoctorChange) onDoctorChange(newId);
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={t('appointments.doctor', 'Doctor')}
                                sx={fieldStyles}
                                InputLabelProps={{ shrink: true }}
                            />
                        )}
                        renderOption={(props, option) => {
                            const { key, ...otherProps } = props;
                            return (
                                <Box component="li" key={key} {...otherProps} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{
                                        width: 32, height: 32, borderRadius: '50%',
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        color: theme.palette.primary.main,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: '0.8rem'
                                    }}>
                                        {option.name.charAt(0)}
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{option.name}</Typography>
                                </Box>
                            );
                        }}
                    />
                </Box>

                {/* PATIENT SELECTION */}
                <Box sx={{ mb: 3 }}>
                    <Autocomplete
                        options={customers}
                        getOptionLabel={(option) => option.name || ''}
                        value={customers.find(c => c.id === formData.patientId) || null}
                        onChange={(_, newValue) => {
                            setFormData({
                                ...formData,
                                patientId: newValue ? newValue.id : '',
                                patientName: newValue ? newValue.name : ''
                            });
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={t('customers.customer')}
                                sx={fieldStyles}
                                InputProps={{
                                    ...params.InputProps,
                                    startAdornment: (
                                        <>
                                            <User size={18} style={{ marginRight: 8, opacity: 0.7 }} />
                                            {params.InputProps.startAdornment}
                                        </>
                                    )
                                }}
                                InputLabelProps={{ shrink: true }}
                            />
                        )}
                        renderOption={(props, option) => {
                            const { key, ...otherProps } = props;
                            return (
                                <Box component="li" key={key} {...otherProps} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{
                                        width: 32, height: 32, borderRadius: '50%',
                                        bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                        color: theme.palette.secondary.main,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: '0.8rem'
                                    }}>
                                        {option.name.charAt(0)}
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{option.name}</Typography>
                                        {option.phone && <Typography variant="caption" color="text.secondary">{option.phone}</Typography>}
                                    </Box>
                                </Box>
                            );
                        }}
                    />
                </Box>

                {/* DATE TIME */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12}>
                        <TextField
                            type="date"
                            label={t('common.date')}
                            fullWidth
                            value={formData.start}
                            onChange={(e) => setFormData({ ...formData, start: e.target.value, end: e.target.value })}
                            sx={fieldStyles}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            type="time"
                            label={t('common.start_time')}
                            fullWidth
                            value={formData.startTime}
                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            sx={fieldStyles}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ lang: i18n.language.startsWith('tr') ? 'tr-TR' : 'en-US' }}
                            helperText={!i18n.language.startsWith('tr') && formData.startTime ?
                                new Date(`2000-01-01T${formData.startTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                                : ''}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            type="time"
                            label={t('common.end_time')}
                            fullWidth
                            value={formData.endTime}
                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            sx={fieldStyles}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ lang: i18n.language.startsWith('tr') ? 'tr-TR' : 'en-US' }}
                            helperText={!i18n.language.startsWith('tr') && formData.endTime ?
                                new Date(`2000-01-01T${formData.endTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                                : ''}
                        />
                    </Grid>
                </Grid>

                {/* TYPE & STATUS */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                        <TextField
                            select
                            fullWidth
                            label={t('common.type')}
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            sx={fieldStyles}
                            InputLabelProps={{ shrink: true }}
                        >
                            {APPOINTMENT_TYPES.map(type => (
                                <MenuItem key={type.id} value={type.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: type.color }} />
                                        {i18n.language === 'tr' ? type.label_tr : type.label_en || type.label_tr}
                                    </Box>
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            select
                            fullWidth
                            label={t('common.status')}
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            sx={fieldStyles}
                            InputLabelProps={{ shrink: true }}
                        >
                            {APPOINTMENT_STATUSES.map(status => (
                                <MenuItem key={status.id} value={status.id}>
                                    {i18n.language === 'tr' ? status.label_tr : status.label_en || status.label_tr}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                </Grid>

                {/* NOTES */}
                <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label={t('common.notes')}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    sx={fieldStyles}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ startAdornment: <FileText size={18} style={{ marginRight: 8, marginTop: 4, opacity: 0.7 }} /> }}
                />
            </Box>

            <Box sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                {appointment?.id && (
                    <Button
                        variant="outlined" color="error"
                        onClick={() => onDelete(appointment.id)}
                        startIcon={<Trash2 size={18} />}
                        sx={{ borderRadius: '12px', fontWeight: 700 }}
                    >
                        {t('common.delete')}
                    </Button>
                )}
                <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
                    <Button onClick={onClose} variant="text" sx={{ borderRadius: '12px', fontWeight: 600, color: 'text.secondary' }}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        startIcon={<CheckCircle2 size={18} />}
                        sx={{
                            borderRadius: '12px', px: 4, py: 1.2, fontWeight: 700,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                        }}
                    >
                        {t('common.save')}
                    </Button>
                </Box>
            </Box>
        </Drawer>
    );
};
