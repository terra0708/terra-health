import React, { useState, useEffect } from 'react';
import {
    Stack,
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    alpha,
    useTheme,
    Paper,
    Divider
} from '@mui/material';
import { Bell, Plus, Calendar, Clock, X, Check } from 'lucide-react';
import { useController } from 'react-hook-form';
import { ReminderCard, useReminderSettingsStore, useReminderStore } from '@shared/modules/reminders';

export const RemindersTab = ({ control, t, i18n, customerId }) => {
    const theme = useTheme();
    const { field: notesField } = useController({ name: 'reminder.notes', control });
    const { field: activeField } = useController({ name: 'reminder.active', control });
    const { categories, subCategories, statuses } = useReminderSettingsStore();
    const addReminder = useReminderStore(state => state.addReminder);
    const updateReminder = useReminderStore(state => state.updateReminder);
    const deleteReminder = useReminderStore(state => state.deleteReminder);
    
    // Get reminders count and IDs for this customer (stable dependencies)
    const remindersCount = useReminderStore(state => 
        state.reminders.filter(r => 
            r.relationId === customerId && 
            (r.categoryId === 'customer' || r.categoryId === 'static_category_customer' || r.type === 'customer')
        ).length
    );
    
    const reminderIds = useReminderStore(state => 
        state.reminders
            .filter(r => 
                r.relationId === customerId && 
                (r.categoryId === 'customer' || r.categoryId === 'static_category_customer' || r.type === 'customer')
            )
            .map(r => r.id)
            .sort()
            .join(',')
    );
    
    // Sync central store reminders to form when customerId changes or reminders update
    useEffect(() => {
        if (!customerId) {
            notesField.onChange([]);
            activeField.onChange(false);
            return;
        }

        // Always fetch fresh reminders from central store
        const centralReminders = useReminderStore.getState().reminders.filter(r => 
            r.relationId === customerId && 
            (r.categoryId === 'customer' || r.categoryId === 'static_category_customer' || r.type === 'customer')
        );

        // Always sync from central store to form - this ensures form always reflects latest state
        notesField.onChange(centralReminders);
        activeField.onChange(centralReminders.length > 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customerId, remindersCount, reminderIds]);

    const [isAdding, setIsAdding] = useState(false);
    const [newReminder, setNewReminder] = useState({
        title: '',
        note: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        statusId: 'pending'
    });

    const handleAdd = () => {
        if (!newReminder.title.trim()) return;

        const selectedStatus = statuses.find(s => s.id === newReminder.statusId);

        const reminderToAdd = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            ...newReminder,
            isCompleted: selectedStatus ? selectedStatus.isCompleted : false,
            categoryId: 'customer',
            type: 'customer',
            relationId: customerId || null,
            createdAt: new Date().toISOString()
        };

        // Add to form
        notesField.onChange([reminderToAdd, ...(notesField.value || [])]);
        if (!activeField.value) activeField.onChange(true);

        // Also add to central store if customerId exists
        if (customerId) {
            addReminder(reminderToAdd);
        }

        setIsAdding(false);
        setNewReminder({
            title: '',
            note: '',
            date: new Date().toISOString().split('T')[0],
            time: '09:00',
            statusId: 'pending'
        });
    };

    const handleUpdate = (id, updates) => {
        const current = Array.isArray(notesField.value) ? notesField.value : [];
        const updated = current.map(n => n.id === id ? { ...n, ...updates } : n);
        notesField.onChange(updated);
        
        // Also update in central store
        if (customerId) {
            updateReminder(id, updates);
        }
    };

    const handleDelete = (reminder) => {
        const current = Array.isArray(notesField.value) ? notesField.value : [];
        const remaining = current.filter(n => n.id !== reminder.id);
        notesField.onChange(remaining);
        if (remaining.length === 0) activeField.onChange(false);
        
        // Also delete from central store
        if (customerId) {
            deleteReminder(reminder.id);
        }
    };

    const handleChangeStatus = (reminder, newStatusId) => {
        const newStatus = statuses.find(s => s.id === newStatusId);
        handleUpdate(reminder.id, {
            statusId: newStatusId,
            isCompleted: newStatus ? newStatus.isCompleted : false
        });
    };

    const handleEdit = (reminder) => {
        // This will be handled by the parent component or we can add edit functionality here
        // For now, we'll just update the reminder in both form and store
        // In a full implementation, you might want to open an edit dialog
        console.log('Edit reminder:', reminder);
    };

    return (
        <Stack spacing={3}>
            {/* Header Area */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1.5, color: '#f59e0b' }}>
                    <Box sx={{ p: 1, borderRadius: '10px', bgcolor: alpha('#f59e0b', 0.1), display: 'flex' }}>
                        <Bell size={20} />
                    </Box>
                    {t('customers.scheduled_reminders')}
                </Typography>
                {!isAdding && (
                    <Button
                        startIcon={<Plus size={18} />}
                        onClick={() => setIsAdding(true)}
                        variant="outlined"
                        size="small"
                        sx={{ borderRadius: '10px', fontWeight: 800 }}
                    >
                        {t('common.add', 'Ekle')}
                    </Button>
                )}
            </Box>

            {/* Quick Add Form */}
            {isAdding && (
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', border: `2px solid ${theme.palette.primary.main}`, bgcolor: alpha(theme.palette.primary.main, 0.01) }}>
                    <Stack spacing={2}>
                        <TextField
                            fullWidth size="small" label={t('common.title')}
                            value={newReminder.title} onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                            autoFocus
                        />
                        <TextField
                            fullWidth multiline rows={2} size="small" label={t('common.note')}
                            value={newReminder.note} onChange={(e) => setNewReminder({ ...newReminder, note: e.target.value })}
                        />
                        <Stack direction="row" spacing={2}>
                            <TextField
                                type="date" size="small" fullWidth label={t('common.date')}
                                value={newReminder.date} onChange={(e) => setNewReminder({ ...newReminder, date: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                type="time" size="small" fullWidth label={t('common.time')}
                                value={newReminder.time} onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Stack>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" onClick={() => setIsAdding(false)} startIcon={<X size={16} />}>{t('common.cancel')}</Button>
                            <Button size="small" onClick={handleAdd} variant="contained" startIcon={<Check size={16} />}>{t('common.save')}</Button>
                        </Stack>
                    </Stack>
                </Paper>
            )}

            <Divider />

            {/* Reminders List */}
            <Stack spacing={1.5}>
                {notesField.value?.length > 0 ? (
                    notesField.value.map((rem) => (
                        <ReminderCard
                            key={rem.id}
                            reminder={rem}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onChangeStatus={handleChangeStatus}
                            t={t}
                            i18n={i18n}
                            categories={categories}
                            subCategories={subCategories}
                            statuses={statuses}
                            hideCustomerInfo={true}
                            compact={true}
                        />
                    ))
                ) : (
                    <Box sx={{ py: 6, textAlign: 'center', opacity: 0.3 }}>
                        <Bell size={48} style={{ marginBottom: 16 }} />
                        <Typography variant="body2" fontWeight={800}>{t('customers.no_reminders')}</Typography>
                    </Box>
                )}
            </Stack>
        </Stack>
    );
};
