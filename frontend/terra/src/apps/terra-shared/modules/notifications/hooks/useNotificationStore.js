import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Ses dosyası (Base64 kısa bir ping sesi)
const PING_SOUND_BASE64 = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPA...'; // Kısaltılmış temsil, gerçekte kısa bir bip sesi

export const useNotificationStore = create(
    persist(
        (set, get) => ({
            notifications: [],
            permissionStatus: 'default',
            soundEnabled: true,
            browserPushEnabled: false,

            // Başlatma ve izin kontrolü
            init: () => {
                if ('Notification' in window) {
                    set({ permissionStatus: Notification.permission });
                }
            },

            requestPermission: async () => {
                if (!('Notification' in window)) return;
                const permission = await Notification.requestPermission();
                set({ permissionStatus: permission, browserPushEnabled: permission === 'granted' });
                return permission;
            },

            addNotification: (notification) => {
                const id = Math.random().toString(36).substr(2, 9);
                const newNotif = {
                    id,
                    isRead: false,
                    createdAt: new Date().toISOString(),
                    ...notification
                };

                set((state) => ({
                    notifications: [newNotif, ...state.notifications]
                }));

                // 5. Sesli Uyarı ve Görsel Efekt Tetikleyici
                if (get().soundEnabled) {
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
                    audio.play().catch(e => console.log('Ses çalınamadı:', e));
                }

                // 2. Tarayıcı Push Bildirimi
                if (get().browserPushEnabled && Notification.permission === 'granted' && document.hidden) {
                    new Notification(notification.title, {
                        body: notification.message,
                        icon: '/favicon.ico'
                    });
                }

                // Header animasyonu için event fırlat
                window.dispatchEvent(new CustomEvent('new-notification', { detail: id }));
            },

            markAsRead: (id) => set((state) => ({
                notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
            })),

            markAllAsRead: () => set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, isRead: true }))
            })),

            clearAll: () => set({ notifications: [] }),

            setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
            setBrowserPushEnabled: (enabled) => set({ browserPushEnabled: enabled }),

            getUnreadCount: () => get().notifications.filter(n => !n.isRead).length
        }),
        {
            name: 'terra-notification-storage',
        }
    )
);
