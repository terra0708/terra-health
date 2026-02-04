import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Stack, TextField,
    MenuItem, Box, Autocomplete, Button, Alert, useTheme, alpha
} from '@mui/material';
import { AlertTriangle, Tag, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useReminderSettingsStore } from '../hooks/useReminderSettingsStore';

const AddReminderDialog = ({
    open, onClose, onAdd, customers = [],
    categories, subCategories, statuses, editingReminder,
    initialCategoryId, initialCustomerId
}) => {
    const { t, i18n } = useTranslation();
    const theme = useTheme();

    const { getCustomerCategory, getDefaultStatus } = useReminderSettingsStore();
    const defaultStatus = getDefaultStatus() || statuses[0];
    const hasCustomers = customers && customers.length > 0;

    // Find customer category from backend data
    const customerCategory = getCustomerCategory();
    const canUseCustomerCategory = hasCustomers && !!customerCategory;

    const [formData, setFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        note: '',
        categoryId: '',
        subCategoryId: '',
        statusId: '',
        customerId: null,
        customerName: ''
    });

    // Set initial category and status when loaded
    useEffect(() => {
        if (open && !editingReminder && categories.length > 0 && !formData.categoryId) {
            let targetCategoryId;

            if (initialCategoryId) {
                targetCategoryId = initialCategoryId;
            } else {
                const customerCategory = categories.find(c => c.labelEn === 'Customer');
                targetCategoryId = customerCategory ? customerCategory.id : categories[0].id;
            }

            setFormData(prev => ({
                ...prev,
                categoryId: targetCategoryId,
                customerId: initialCustomerId || null,
                statusId: defaultStatus?.id || (statuses.length > 0 ? statuses[0].id : '')
            }));
        }
    }, [open, editingReminder, categories, defaultStatus, statuses, initialCategoryId, initialCustomerId]);

    useEffect(() => {
        if (open) {
            if (editingReminder) {
                setFormData({
                    title: editingReminder.title,
                    date: editingReminder.date,
                    time: editingReminder.time || '09:00',
                    note: editingReminder.note,
                    categoryId: editingReminder.categoryId,
                    subCategoryId: editingReminder.subCategoryId,
                    statusId: editingReminder.statusId,
                    customerId: editingReminder.relationId || null,
                    customerName: editingReminder.customer?.name || ''
                });
            } else {
                setFormData({
                    title: '',
                    date: new Date().toISOString().split('T')[0],
                    time: '09:00',
                    note: '',
                    categoryId: '',
                    subCategoryId: '',
                    statusId: defaultStatus?.id || (statuses.length > 0 ? statuses[0].id : ''),
                    customerId: null,
                    customerName: ''
                });
            }
        }
    }, [open, editingReminder, defaultStatus, statuses]);

    // Locked/Initial Context
    const lockedCategoryId = initialCategoryId || (editingReminder?.categoryId);
    const lockedCustomerId = initialCustomerId || (editingReminder?.relationId);

    // Determine if current category is customer category
    const isCustomerCategory = customerCategory && formData.categoryId === customerCategory.id;

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        if (!formData.title) return;

        const isCustomer = customerCategory && formData.categoryId === customerCategory.id;

        if (isCustomer && !formData.subCategoryId) {
            alert(t('reminders.select_subcategory_error', 'Lütfen bir alt kategori seçiniz'));
            return;
        }
        if (isCustomer && !formData.customerId && hasCustomers && !lockedCustomerId) {
            alert(t('reminders.select_customer_error', 'Lütfen bir müşteri seçiniz'));
            return;
        }

        const selectedStatus = statuses.find(s => s.id === formData.statusId);

        onAdd({
            ...formData,
            id: editingReminder?.id,
            isCompleted: selectedStatus ? selectedStatus.isCompleted : false,
            relationId: formData.customerId,
            relationType: isCustomer ? 'customer' : null
        });
        onClose();
    };

    const getDisplayName = (item) => item ? (i18n.language === 'tr' ? item.labelTr || item.label_tr : (item.labelEn || item.label_en || item.labelTr || item.label_tr)) : '';

    // Get subcategories for currently selected category
    const availableSubCategories = subCategories.filter(s => s.categoryId === formData.categoryId);

    const selectedCategory = categories.find(c => c.id === formData.categoryId);
    const availableCategories = categories;

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
                    {editingReminder && editingReminder.customer && (
                        <Alert severity="info" icon={<AlertTriangle size={20} />} sx={{ borderRadius: 2 }}>
                            {t('reminders.editing_customer_record', 'Bu müşteri ile ilişkili bir kayıttır')}
                        </Alert>
                    )}

                    <TextField
                        select fullWidth label={t('common.category')}
                        value={formData.categoryId}
                        onChange={(e) => {
                            handleChange('categoryId', e.target.value);
                            handleChange('subCategoryId', '');
                            if (!lockedCustomerId) {
                                handleChange('customerId', null);
                                handleChange('customerName', '');
                            }
                        }}
                        variant="outlined"
                        disabled={!!lockedCategoryId || !!(editingReminder && editingReminder.relationId)}
                    >
                        {availableCategories.map((cat) => (
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

                    {/* Show customer list only if customer category is selected AND subcategory is selected */}
                    {isCustomerCategory && formData.subCategoryId && (
                        <Autocomplete
                            options={customers}
                            getOptionLabel={(option) => option.name}
                            value={customers.find(c => c.id === formData.customerId) || null}
                            onChange={(event, newValue) => {
                                handleChange('customerId', newValue ? newValue.id : null);
                                handleChange('customerName', newValue ? newValue.name : '');
                                if (newValue && !editingReminder) {
                                    handleChange('title', `${t('reminders.meeting_with', 'Görüşme')}: ${newValue.name}`);
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t('customers.customer')}
                                    variant="outlined"
                                    placeholder={t('common.search')}
                                    error={isCustomerCategory && !formData.customerId && !lockedCustomerId}
                                />
                            )}
                            disabled={!!(editingReminder && editingReminder.relationId)}
                            noOptionsText={t('common.no_data', 'Veri bulunamadı')}
                        />
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

                    <TextField
                        fullWidth label={t('common.title')}
                        value={formData.title} onChange={(e) => handleChange('title', e.target.value)}
                        variant="outlined" InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                        fullWidth multiline rows={3} label={t('common.note', 'Not')}
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
