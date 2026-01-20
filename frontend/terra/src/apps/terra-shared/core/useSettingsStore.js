import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSettingsStore = create(
    persist(
        (set) => ({
            mode: 'light',
            language: 'tr',
            sidebarOpen: true,
            toggleMode: () => set((state) => ({ mode: state.mode === 'light' ? 'dark' : 'light' })),
            setLanguage: (lang) => set({ language: lang }),
            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        }),
        {
            name: 'terra-settings',
        }
    )
);

export default useSettingsStore;
