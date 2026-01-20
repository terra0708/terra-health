import React, { useEffect } from 'react';
import { useNotificationStore } from './hooks/useNotificationStore';
import { useTranslation } from 'react-i18next';

/**
 * Generic Notification Manager Component
 * 
 * Bu bileşen arka planda çalışarak geciken entity'leri ve hatırlatıcıları kontrol eder.
 * Customers'a bağımlı değildir, resolver pattern kullanarak generic çalışır.
 * 
 * @param {Object} props
 * @param {Object} props.escalationResolver - Escalation kontrolü için resolver
 * @param {Function} props.escalationResolver.getEntities - Entity listesini döndürür: () => [{ id, name, registrationDate, status }]
 * @param {Function} props.escalationResolver.checkEscalation - Entity'nin escalation gerektirip gerektirmediğini kontrol eder: (entity) => boolean
 * @param {Function} props.escalationResolver.getEscalationLink - Entity için link döndürür: (entityId) => string
 * @param {Object} props.reminderResolver - Reminder kontrolü için resolver
 * @param {Function} props.reminderResolver.getReminders - Reminder listesini döndürür: () => [{ id, relationId, date, time, title, note, isCompleted }]
 * @param {Function} props.reminderResolver.getReminderLink - Reminder için link döndürür: (reminderId) => string
 */
const NotificationManager = ({ 
    escalationResolver = null,
    reminderResolver = null 
}) => {
    const { t } = useTranslation();
    const { addNotification, notifications } = useNotificationStore();

    useEffect(() => {
        useNotificationStore.getState().init();

        // Gecikme Uyarıları (Escalation) - Her 5 dakikada bir kontrol et
        let escalationInterval = null;
        if (escalationResolver && escalationResolver.getEntities && escalationResolver.checkEscalation) {
            escalationInterval = setInterval(() => {
                const now = new Date();
                const entities = escalationResolver.getEntities() || [];

                entities.forEach(entity => {
                    if (escalationResolver.checkEscalation(entity)) {
                        const regDate = new Date(entity.registrationDate || entity.createdAt);
                        const diffHours = (now - regDate) / (1000 * 60 * 60);

                        // 2 saatten fazladır bekleyen ve bildirimi henüz atılmamış entity'ler
                        const hasEscalationNotif = notifications.some(n =>
                            n.type === 'escalation' && n.message && n.message.includes(entity.name)
                        );

                        if (diffHours > 2 && !hasEscalationNotif) {
                            const link = escalationResolver.getEscalationLink 
                                ? escalationResolver.getEscalationLink(entity.id)
                                : '/clients';
                            
                            addNotification({
                                title: t('notifications.escalation_title', 'Acil: Geciken Lead'),
                                message: t('notifications.escalation_message', '{{name}} isimli müşteri ile 2 saattir iletişime geçilmedi!', { name: entity.name }),
                                type: 'escalation',
                                priority: 'high',
                                link
                            });
                        }
                    }
                });
            }, 5 * 60 * 1000);
        }

        // Hatırlatıcı (Reminder) Otomasyonu - Her 30 saniyede bir kontrol et
        let reminderInterval = null;
        if (reminderResolver && reminderResolver.getReminders) {
            reminderInterval = setInterval(() => {
                const now = new Date();
                const nowStr = now.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm" formatı

                const reminders = reminderResolver.getReminders() || [];
                reminders.forEach(reminder => {
                    // Reminder'ın zamanı geldi mi kontrol et
                    const reminderDateTime = reminder.date && reminder.time 
                        ? `${reminder.date}T${reminder.time}`
                        : null;
                    
                    if (!reminder.isCompleted && reminderDateTime && reminderDateTime <= nowStr) {
                        // Eğer bu hatırlatıcı için henüz bildirim oluşturulmadıysa
                        const reminderId = `reminder_${reminder.id}`;
                        const hasNotif = notifications.some(n => n.id && n.id.startsWith(reminderId));

                        if (!hasNotif) {
                            const link = reminderResolver.getReminderLink 
                                ? reminderResolver.getReminderLink(reminder.id)
                                : '/reminders';
                            
                            addNotification({
                                id: `${reminderId}_${Date.now()}`,
                                title: t('notifications.reminder_title', 'Hatırlatıcı: {{title}}', { title: reminder.title || reminder.note }),
                                message: reminder.note || reminder.title || '',
                                type: 'appointment',
                                priority: 'high',
                                link
                            });
                        }
                    }
                });
            }, 30 * 1000); // 30 saniyede bir kontrol
        }

        return () => {
            if (escalationInterval) clearInterval(escalationInterval);
            if (reminderInterval) clearInterval(reminderInterval);
        };
    }, [escalationResolver, reminderResolver, notifications, addNotification, t]);

    return null; // Görsel bir öğesi yok, sadece lojik çalıştırır
};

export default NotificationManager;
