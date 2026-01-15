import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MOCK_USERS } from '../data/mockData';

export const useUserStore = create(
    persist(
        (set, get) => ({
            users: MOCK_USERS, // Initial state from mock data

            // REPAIR DATA: Ensure data consistency (useful after schema changes)
            repairData: () => {
                const { users } = get();
                // Example repair logic if needed in future (e.g. missing fields)
                // For now, if users is empty, maybe re-seed?
                if (!users || users.length === 0) {
                    set({ users: MOCK_USERS });
                }
            },

            addUser: (user) => set((state) => {
                const newId = Math.max(...state.users.map(u => u.id), 0) + 1;
                const newUser = {
                    ...user,
                    id: newId,
                    joined: new Date().toLocaleDateString('tr-TR'), // Set join date to now
                    left: '-',
                    avatar: `https://i.pravatar.cc/150?u=${newId}` // Random avatar
                };
                return { users: [...state.users, newUser] };
            }),

            updateUser: (id, updatedFields) => set((state) => ({
                users: state.users.map((user) =>
                    user.id === id ? { ...user, ...updatedFields } : user
                ),
            })),

            deleteUser: (id) => set((state) => ({
                users: state.users.filter((user) => user.id !== id),
            })),
        }),
        {
            name: 'terra-users-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
