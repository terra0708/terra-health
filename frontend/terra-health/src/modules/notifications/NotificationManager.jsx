import React, { useEffect } from 'react';
import { useCustomerStore } from '@modules/customers/hooks/useCustomerStore';
import { useNotificationStore } from './hooks/useNotificationStore';
import { useTranslation } from 'react-i18next';

/**
 * Bu bileşen arka planda çalışarak geciken lead'leri ve randevu hatırlatıcılarını kontrol eder.
 */
const NotificationManager = () => {
    const { t } = useTranslation();
    const { addNotification, notifications } = useNotificationStore();
    const { customers } = useCustomerStore();

    useEffect(() => {
        useNotificationStore.getState().init();

        // Gecikme Uyarıları (Escalation) - Her 5 dakikada bir kontrol et
        const escalationInterval = setInterval(() => {
            const now = new Date();
            customers.forEach(customer => {
                if (customer.status === 'new' || customer.status === 'active') { // "Yeni" statüsünde kalmışsa
                    const regDate = new Date(customer.registrationDate);
                    const diffHours = (now - regDate) / (1000 * 60 * 60);

                    // 2 saatten fazladır bekleyen ve bildirimi henüz atılmamış leadler
                    const hasEscalationNotif = notifications.some(n =>
                        n.type === 'escalation' && n.message.includes(customer.name)
                    );

                    if (diffHours > 2 && !hasEscalationNotif) {
                        addNotification({
                            title: 'Acil: Geciken Lead',
                            message: `${customer.name} isimli müşteri ile 2 saattir iletişime geçilmedi!`,
                            type: 'escalation',
                            priority: 'high',
                            link: '/customers'
                        });
                    }
                }
            });
        }, 5 * 60 * 1000);

        // Hatırlatıcı (Reminder) Otomasyonu - Her dakikada bir kontrol et
        const reminderInterval = setInterval(() => {
            const now = new Date();
            const nowStr = now.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm" formatı

            customers.forEach(customer => {
                const reminders = customer.reminder?.notes || [];
                reminders.forEach(reminder => {
                    if (!reminder.completed && reminder.reminderTime && reminder.reminderTime <= nowStr) {
                        // Eğer bu hatırlatıcı için henüz bildirim oluşturulmadıysa
                        const reminderId = `reminder_${reminder.id}`;
                        const hasNotif = notifications.some(n => n.id.startsWith(reminderId));

                        if (!hasNotif) {
                            addNotification({
                                id: `${reminderId}_${Date.now()}`,
                                title: `Hatırlatıcı: ${customer.name}`,
                                message: reminder.text,
                                type: 'appointment',
                                priority: 'high',
                                link: '/customers'
                            });
                        }
                    }
                });
            });
        }, 30 * 1000); // 30 saniyede bir kontrol

        return () => {
            clearInterval(escalationInterval);
            clearInterval(reminderInterval);
        };
    }, [customers, notifications, addNotification, t]);

    return null; // Görsel bir öğesi yok, sadece lojik çalıştırır
};

export default NotificationManager;
