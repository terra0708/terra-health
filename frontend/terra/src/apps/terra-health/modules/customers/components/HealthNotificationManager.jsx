import React from 'react';
import NotificationManager from '@shared/modules/notifications/NotificationManager';
import { useClientStore } from '@shared/modules/clients';
import { usePatientDetailsStore } from '../hooks/usePatientDetailsStore';
import { useReminderStore } from '@shared/modules/reminders';

/**
 * Health-specific Notification Manager Wrapper
 * 
 * Bu component NotificationManager'ı wrap eder ve terra-health modülüne özgü
 * customers ve reminders resolver'larını sağlar.
 */
const HealthNotificationManager = () => {
    // Get health clients (industryType === 'HEALTH')
    const { clients } = useClientStore();
    const { patientDetails } = usePatientDetailsStore();
    const { reminders } = useReminderStore();
    
    // Merge clients with patient details for escalation check
    const customers = React.useMemo(() => {
        return clients
            .filter(c => c.industryType === 'HEALTH' || c.industryType === null)
            .map(client => {
                const details = patientDetails.find(p => p.clientId === client.id);
                return {
                    ...client,
                    status: details?.status || 'new',
                    name: client.name
                };
            });
    }, [clients, patientDetails]);

    // Escalation resolver: Customers için escalation kontrolü
    const escalationResolver = {
        getEntities: () => {
            return customers.map(c => ({
                id: c.id,
                name: c.name,
                registrationDate: c.registrationDate,
                status: c.status,
                createdAt: c.registrationDate
            }));
        },
        checkEscalation: (entity) => {
            // "Yeni" veya "İşlemde" statüsündeki müşteriler için escalation kontrolü yap
            return entity.status === 'new' || entity.status === 'process' || entity.status === 'contacted';
        },
        getEscalationLink: (entityId) => {
            return `/customers`;
        }
    };

    // Reminder resolver: Reminders için hatırlatıcı kontrolü
    const reminderResolver = {
        getReminders: () => {
            // Sadece customer ile ilişkili reminder'ları döndür
            return reminders
                .filter(r => r.categoryId === 'customer' && r.relationId)
                .map(r => ({
                    id: r.id,
                    relationId: r.relationId,
                    date: r.date,
                    time: r.time,
                    title: r.title,
                    note: r.note,
                    isCompleted: r.isCompleted
                }));
        },
        getReminderLink: (reminderId) => {
            return `/reminders`;
        }
    };

    return (
        <NotificationManager
            escalationResolver={escalationResolver}
            reminderResolver={reminderResolver}
        />
    );
};

export default HealthNotificationManager;
