import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MOCK_APPOINTMENTS } from '../data/mockData';

export const useAppointmentStore = create(
    persist(
        (set, get) => ({
            appointments: MOCK_APPOINTMENTS,

            addAppointment: (appointment) => set((state) => {
                const newId = Math.max(...state.appointments.map(a => a.id), 0) + 1;
                return { appointments: [...state.appointments, { id: newId, ...appointment }] };
            }),

            updateAppointment: (id, updatedFields) => set((state) => ({
                appointments: state.appointments.map((appt) =>
                    appt.id === id ? { ...appt, ...updatedFields } : appt
                ),
            })),

            deleteAppointment: (id) => set((state) => ({
                appointments: state.appointments.filter((appt) => appt.id !== id),
            })),

            getAppointmentsByDoctor: (doctorId) => {
                const { appointments } = get();
                return appointments.filter(a => a.doctorId === doctorId);
            }
        }),
        {
            name: 'terra-appointments-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
