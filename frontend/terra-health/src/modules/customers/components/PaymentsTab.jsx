import React from 'react';
import { Stack } from '@mui/material';
import { CreditCard } from 'lucide-react';
import { EditableList } from '@common/ui/EditableList';
import { useController } from 'react-hook-form';

export const PaymentsTab = ({ control, t }) => {
    const { field: paymentsField } = useController({ name: 'payments', control });

    const handleAdd = (newPay) => {
        paymentsField.onChange([{ id: Date.now(), ...newPay }, ...paymentsField.value]);
    };

    const handleUpdate = (id, updates) => {
        paymentsField.onChange(paymentsField.value.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const handleDelete = (id) => {
        paymentsField.onChange(paymentsField.value.filter(p => p.id !== id));
    };

    return (
        <Stack spacing={3}>
            <EditableList
                title={t('customers.payments')}
                items={paymentsField.value}
                onAdd={handleAdd}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                placeholder={t('customers.drawer.payment_note_placeholder')}
                emptyText={t('customers.no_payments')}
                color="#8b5cf6"
                icon={CreditCard}
            />
        </Stack>
    );
};
