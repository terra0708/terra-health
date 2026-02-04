import React, { useState, useEffect } from 'react';
import {
    Stack,
    Box,
    Typography,
    Button,
    alpha,
    useTheme,
} from '@mui/material';
import { Bell, Plus } from 'lucide-react';
import { useController } from 'react-hook-form';
import { ReminderCard, useReminderSettingsStore } from '@shared/modules/reminders';
import AddReminderDialog from '@shared/modules/reminders/components/AddReminderDialog';

export const RemindersTab = ({ control, t, i18n, customerId, customerName }) => {
    const theme = useTheme();
    const { field: notesField } = useController({ name: 'reminder.notes', control });
    const { field: activeField } = useController({ name: 'reminder.active', control });

    const { categories, subCategories, statuses, getCustomerCategory, fetchSettings } = useReminderSettingsStore();
    const customerCategory = getCustomerCategory();

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Fetch settings on mount
    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleAddOrUpdate = (reminderData) => {
        const currentReminders = notesField.value || [];

        // Ensure proper Relation ID is context-aware
        const cleanData = {
            ...reminderData,
            relationId: customerId || 'TEMP_NEW_CUSTOMER', // Placeholder for new customers
            relationType: 'customer',
            categoryId: reminderData.categoryId,
            subCategoryId: reminderData.subCategoryId,
            statusId: reminderData.statusId
        };

        if (editingItem) {
            // Update
            const updated = currentReminders.map(r => r.id === editingItem.id ? { ...cleanData, id: editingItem.id } : r);
            notesField.onChange(updated);
        } else {
            // Add New
            const newReminder = {
                ...cleanData,
                id: `temp-${Date.now()}`, // Temporary ID
                createdAt: new Date().toISOString()
            };
            notesField.onChange([...currentReminders, newReminder]);
        }

        activeField.onChange(true);
        setDialogOpen(false);
        setEditingItem(null);
    };

    const handleDelete = (reminder) => {
        if (window.confirm(t('reminders.delete_confirm'))) {
            const currentReminders = notesField.value || [];
            const updated = currentReminders.filter(r => r.id !== reminder.id);
            notesField.onChange(updated);
            if (updated.length === 0) activeField.onChange(false);
        }
    };

    const handleToggleComplete = (reminder) => {
        const currentReminders = notesField.value || [];
        const updated = currentReminders.map(r => {
            if (r.id === reminder.id) {
                // Toggle Logic: Find 'Completed' status or just toggle boolean?
                // Ideally, flip to 'Completed' status or back. 
                // For simplicity here, we toggle isCompleted boolean. 
                // A better approach would be to find the "Completed" status ID from settings.
                return { ...r, isCompleted: !r.isCompleted };
            }
            return r;
        });
        notesField.onChange(updated);
    };

    const openAddDialog = () => {
        setEditingItem(null);
        setDialogOpen(true);
    };

    const openEditDialog = (reminder) => {
        setEditingItem(reminder);
        setDialogOpen(true);
    };

    return (
        <Stack spacing={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 40, height: 40, borderRadius: '12px',
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Bell size={20} color={theme.palette.primary.main} />
                    </Box>
                    <Typography variant="h6" fontWeight={800}>{t('reminders.customer_reminders', 'Müşteri Hatırlatıcıları')}</Typography>
                </Box>
                <Button
                    variant="soft" size="small" startIcon={<Plus size={18} />}
                    onClick={openAddDialog}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                    {t('reminders.add_new')}
                </Button>
            </Box>

            <Stack spacing={2}>
                {notesField.value && notesField.value.length > 0 ? (
                    notesField.value.map((reminder) => (
                        <ReminderCard
                            key={reminder.id}
                            reminder={reminder}
                            onEdit={() => openEditDialog(reminder)}
                            onDelete={() => handleDelete(reminder)}
                            onToggleComplete={() => handleToggleComplete(reminder)}
                            t={t} i18n={i18n}
                            categories={categories}
                            statuses={statuses}
                        />
                    ))
                ) : (
                    <Box sx={{ py: 4, textAlign: 'center', opacity: 0.5 }}>
                        <Bell size={40} style={{ marginBottom: 8 }} />
                        <Typography variant="body2">{t('reminders.no_scheduled_reminders')}</Typography>
                    </Box>
                )}
            </Stack>

            {dialogOpen && (
                <AddReminderDialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    onAdd={handleAddOrUpdate}
                    categories={categories}
                    subCategories={subCategories}
                    statuses={statuses}
                    customers={customerId ? [{ id: customerId, name: customerName || 'Current Customer' }] : []}
                    editingReminder={editingItem}
                    initialCategoryId={customerCategory?.id}
                    initialCustomerId={customerId || 'TEMP_NEW_CUSTOMER'}
                />
            )}
        </Stack>
    );
};
