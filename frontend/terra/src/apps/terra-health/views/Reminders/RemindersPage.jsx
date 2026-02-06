import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import RemindersPageBase from '@shared/views/Reminders/RemindersPage';
import { CustomerDetailsDialog } from '@terra-health/modules/customers';
import { useCustomers } from '@terra-health/modules/customers';
import { useReminderStore } from '@shared/modules/reminders';
import { ModulePageWrapper } from '@common/ui';
import { usePerformance } from '@common/hooks';

/**
 * Health-specific Reminders Page Wrapper
 * 
 * Bu component generic RemindersPage'i wrap eder ve health-specific
 * bağımlılıkları (CustomerDetailsDialog, customers) inject eder.
 */
const RemindersPage = () => {
    usePerformance('RemindersPage');
    const { t } = useTranslation(['terra-health', 'translation']);
    const { customers } = useCustomers();

    // Migration helper function - No longer needed for mock data, but kept if you still have legacy manual records in customers
    const syncFromCustomerStore = useCallback((customers) => {
        const currentReminders = useReminderStore.getState().reminders;
        const newFromCustomers = [];

        customers.forEach(customer => {
            if (customer.reminder?.notes?.length > 0) {
                customer.reminder.notes.forEach(note => {
                    if (!currentReminders.find(r => r.id === note.id)) {
                        newFromCustomers.push({
                            ...note,
                            relationId: customer.id,
                            categoryId: 'customer',
                            updatedAt: new Date().toISOString()
                        });
                    }
                });
            }
        });

        if (newFromCustomers.length > 0) {
            useReminderStore.setState({ reminders: [...currentReminders, ...newFromCustomers] });
            return true;
        }
        return false;
    }, []);

    // Customers resolver - useCallback ile memoize et
    const customersResolver = useCallback((id) => {
        return customers.find(c => c.id === id) || null;
    }, [customers]);

    // Migration config - Removed syncWithMockData
    const migrationConfig = useMemo(() => ({
        customers,
        syncFromCustomerStore
    }), [customers, syncFromCustomerStore]);

    return (
        <ModulePageWrapper moduleName="Reminders" aria-label="Reminders Management">
            <RemindersPageBase
                CustomerDetailsDialog={CustomerDetailsDialog}
                customersResolver={customersResolver}
                migrationConfig={migrationConfig}
                customers={customers}
                t={t}
            />
        </ModulePageWrapper>
    );
};

export default RemindersPage;
