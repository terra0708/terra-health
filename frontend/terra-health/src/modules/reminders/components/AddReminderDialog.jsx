import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Stack, TextField,
    MenuItem, Box, Autocomplete, Button, Alert, useTheme, alpha
} from '@mui/material';
import { AlertTriangle, Tag, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AddReminderDialog = ({ open, onClose, onAdd, customers, categories, subCategories, statuses, editingReminder }) => {
    const { t, i18n } = useTranslation();
    const theme = useTheme();

    const defaultStatus = statuses.find(s => s.id === 'pending') || statuses[0];

    const [formData, setFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        note: '',
        categoryId: 'personal',
        subCategoryId: '',
        statusId: defaultStatus?.id || '',
        customerId: null,
        customerName: ''
    });

    useEffect(() => {
        if (open) {
            if (editingReminder) {
                setFormData({
                    title: editingReminder.title || editingReminder.text,
                    date: editingReminder.date,
                    time: editingReminder.time,
                    note: editingReminder.note,
                    categoryId: editingReminder.categoryId || 'personal',
                    subCategoryId: editingReminder.subCategoryId || '',
                    statusId: editingReminder.statusId || defaultStatus?.id,
                    customerId: editingReminder.customer?.id || null,
                    customerName: editingReminder.customer?.name || ''
                });
            } else {
                setFormData({
                    title: '',
                    date: new Date().toISOString().split('T')[0],
                    time: '09:00',
                    note: '',
                    categoryId: 'personal',
                    subCategoryId: '',
                    statusId: defaultStatus?.id || '',
                    customerId: null,
                    customerName: ''
                });
            }
        }
    }, [open, editingReminder, defaultStatus]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        if (!formData.title) return;
        if (formData.categoryId === 'customer' && !formData.customerId) {
            alert(t('reminders.select_customer_error', 'Lütfen bir müşteri seçiniz'));
            return;
        }

        const selectedStatus = statuses.find(s => s.id === formData.statusId);

        onAdd({
            ...formData,
            id: editingReminder?.id,
            type: editingReminder?.type,
            isCompleted: selectedStatus ? selectedStatus.isCompleted : false
        });
        onClose();
    };

    const getDisplayName = (item) => i18n.language === 'tr' ? item.label_tr : (item.label_en || item.label_tr);
    const availableSubCategories = subCategories.filter(s => s.categoryId === formData.categoryId);
    const selectedCategory = categories.find(c => c.id === formData.categoryId);

    return (
        <Dialog
            open={open} onClose={onClose}
            PaperProps={{ sx: { borderRadius: 3, width: '100%', maxWidth: 500 } }}
        >
            <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem' }}>
                {editingReminder ? t('common.edit') : t('reminders.add_new')}
            </DialogTitle>
            <DialogContent>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    {editingReminder && editingReminder.type === 'customer' && (
                        <Alert severity="info" icon={<AlertTriangle size={20} />} sx={{ borderRadius: 2 }}>
                            {t('reminders.editing_customer_record')}
                        </Alert>
                    )}

                    <TextField
                        select fullWidth label={t('common.category')}
                        value={formData.categoryId}
                        onChange={(e) => { handleChange('categoryId', e.target.value); handleChange('subCategoryId', ''); }}
                        variant="outlined"
                        disabled={!!editingReminder && editingReminder.type === 'customer'}
                    >
                        {categories.map((cat) => (
                            <MenuItem key={cat.id} value={cat.id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: cat.color }} />
                                    {getDisplayName(cat)}
                                </Box>
                            </MenuItem>
                        ))}
                    </TextField>

                    {availableSubCategories.length > 0 && (
                        <TextField
                            select fullWidth label={t('common.sub_category')}
                            value={formData.subCategoryId}
                            onChange={(e) => handleChange('subCategoryId', e.target.value)}
                            variant="outlined"
                        >
                            <MenuItem value=""><em>{t('common.none')}</em></MenuItem>
                            {availableSubCategories.map((sub) => (
                                <MenuItem key={sub.id} value={sub.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Tag size={14} color={sub.color} />
                                        {getDisplayName(sub)}
                                    </Box>
                                </MenuItem>
                            ))}
                        </TextField>
                    )}

                    <TextField
                        select fullWidth label={t('common.status')}
                        value={formData.statusId}
                        onChange={(e) => handleChange('statusId', e.target.value)}
                        variant="outlined"
                    >
                        {statuses.map((stat) => (
                            <MenuItem key={stat.id} value={stat.id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Activity size={14} color={stat.color} />
                                    {getDisplayName(stat)}
                                </Box>
                            </MenuItem>
                        ))}
                    </TextField>

                    {formData.categoryId === 'customer' && (
                        <Autocomplete
                            options={customers}
                            getOptionLabel={(option) => option.name}
                            value={customers.find(c => c.id === formData.customerId) || null}
                            onChange={(event, newValue) => {
                                handleChange('customerId', newValue ? newValue.id : null);
                                handleChange('customerName', newValue ? newValue.name : '');
                                if (newValue && !editingReminder) {
                                    handleChange('title', `${t('reminders.meeting_with')}: ${newValue.name}`);
                                }
                            }}
                            renderInput={(params) => <TextField {...params} label={t('customers.customer')} variant="outlined" placeholder={t('common.search')} />}
                            disabled={!!(editingReminder && editingReminder.type === 'customer')}
                        />
                    )}

                    <TextField
                        fullWidth label={t('common.title')}
                        value={formData.title} onChange={(e) => handleChange('title', e.target.value)}
                        variant="outlined" InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                        fullWidth multiline rows={3} label={t('common.note')}
                        value={formData.note} onChange={(e) => handleChange('note', e.target.value)}
                        variant="outlined" InputLabelProps={{ shrink: true }}
                    />

                    <Stack direction="row" spacing={2}>
                        <TextField
                            fullWidth type="date" label={t('common.date')}
                            value={formData.date} onChange={(e) => handleChange('date', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            fullWidth type="time" label={t('common.time')}
                            value={formData.time} onChange={(e) => handleChange('time', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} sx={{ fontWeight: 600, color: 'text.secondary', borderRadius: 2 }}>{t('common.cancel')}</Button>
                <Button
                    onClick={handleSubmit} variant="contained" disabled={!formData.title}
                    sx={{
                        fontWeight: 700, px: 4, py: 1, borderRadius: 2,
                        bgcolor: selectedCategory?.color || theme.palette.primary.main,
                        '&:hover': { bgcolor: alpha(selectedCategory?.color || theme.palette.primary.main, 0.8) }
                    }}
                >
                    {t('common.save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddReminderDialog;
