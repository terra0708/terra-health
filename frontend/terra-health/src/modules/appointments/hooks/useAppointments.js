import { useAppointmentStore } from './useAppointmentStore';

export const useAppointments = () => {
    const store = useAppointmentStore();
    return {
        appointments: store.appointments,
        addAppointment: store.addAppointment,
        updateAppointment: store.updateAppointment,
        deleteAppointment: store.deleteAppointment,
        getAppointmentsByDoctor: store.getAppointmentsByDoctor
    };
};
