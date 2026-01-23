import React, { useState, useMemo } from 'react';
import { Box, Paper, useTheme, Button, Typography, Snackbar, Alert, alpha } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { useUsers } from '@shared/modules/users';
import {
    useAppointments,
    DoctorSelector,
    AppointmentCalendar,
    AppointmentDrawer
} from '@terra-health/modules/appointments';
import { useCustomerStore } from '@terra-health/modules/customers/hooks/useCustomerStore';
import { ModulePageWrapper } from '@common/ui';
import { usePerformance } from '@common/hooks';

const AppointmentsPage = () => {
    usePerformance('AppointmentsPage');
    const { t } = useTranslation();
    const theme = useTheme();

    // --- DATA ---
    const { store: userStore } = useUsers(); // Creating direct access or ensuring users are loaded
    // Filter doctors. useUsers hook returns `users` inside store
    const doctors = useMemo(() => {
        return userStore.users.filter(u => u.role === 'doctor');
    }, [userStore.users]);

    const { appointments, addAppointment, updateAppointment, deleteAppointment } = useAppointments();
    const { customers } = useCustomerStore();

    // --- STATE ---
    const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id || null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null); // null = new
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Ensure selectedDoctorId is valid if doctors load later
    React.useEffect(() => {
        if (!selectedDoctorId && doctors.length > 0) {
            setSelectedDoctorId(doctors[0].id);
        }
    }, [doctors, selectedDoctorId]);

    const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

    // --- FILTERED EVENTS ---
    const calendarEvents = useMemo(() => {
        if (!selectedDoctorId) return [];
        return appointments
            .filter(appt => appt.doctorId === selectedDoctorId)
            .map(appt => {
                const customer = customers.find(c => c.id === appt.patientId);
                const displayName = customer ? customer.name : appt.patientName;

                return {
                    id: appt.id.toString(),
                    title: displayName,
                    start: appt.start,
                    end: appt.end,
                    extendedProps: {
                        type: appt.type,
                        status: appt.status,
                        patientId: appt.patientId,
                        patientName: displayName,
                        notes: appt.notes
                    }
                };
            });
    }, [appointments, selectedDoctorId, customers]);

    // --- HANDLERS ---
    const handleSelect = (selectionInfo) => {
        // Create new appointment at selected range
        const start = selectionInfo.start;
        const end = selectionInfo.end;

        // FullCalendar selection might return midnight-to-midnight for day view, but for timeGrid it returns time range.
        // If it's allDay, we might want to set specific hours?
        // But usually timeGrid selection is precise.

        setSelectedAppointment({
            start: start.toISOString(),
            end: end.toISOString(),
            doctorId: selectedDoctorId // Pre-select current doctor
        });
        setDrawerOpen(true);
    };

    const handleEventClick = (info) => {
        const apptId = parseInt(info.event.id, 10);
        const appt = appointments.find(a => a.id === apptId);
        if (appt) {
            setSelectedAppointment(appt);
            setDrawerOpen(true);
        }
    };

    const handleSave = (apptData) => {
        // Overlap Check
        const start = new Date(apptData.start);
        const end = new Date(apptData.end);

        const hasConflict = appointments.some(existing => {
            // Check same doctor
            if (existing.doctorId !== apptData.doctorId) return false;
            // Skip self (for edits)
            if (apptData.id && existing.id === apptData.id) return false;
            // Ignore cancelled
            if (existing.status === 'cancelled') return false;

            const existingStart = new Date(existing.start);
            const existingEnd = new Date(existing.end);

            // Logic: (StartA < EndB) and (EndA > StartB)
            return start < existingEnd && end > existingStart;
        });

        if (hasConflict) {
            setSnackbar({ open: true, message: t('appointments.conflict_error'), severity: 'error' });
            return;
        }

        if (apptData.id) {
            updateAppointment(apptData.id, apptData);
            setSnackbar({ open: true, message: t('common.success_update'), severity: 'success' });
        } else {
            addAppointment(apptData);
            setSnackbar({ open: true, message: t('common.success_save'), severity: 'success' });
        }
        setDrawerOpen(false);
    };

    const handleDelete = (id) => {
        if (window.confirm(t('common.delete_confirm'))) {
            deleteAppointment(id);
            setSnackbar({ open: true, message: t('common.success_delete'), severity: 'success' });
            setDrawerOpen(false);
        }
    };

    return (
        <ModulePageWrapper moduleName="Appointments" aria-label="Appointments Management">
        <Box sx={{ height: 'calc(100vh - 32px)', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.6s ease', overflow: 'hidden', pb: 2 }}>
            {/* TOP BAR */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.03em' }}>{t('menu.appointments')}</Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={() => { setSelectedAppointment(null); setDrawerOpen(true); }}
                    disabled={!selectedDoctorId}
                    sx={{
                        borderRadius: '16px', px: 3, py: 1.2, fontWeight: 800,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.25)}`
                    }}
                >
                    {t('appointments.new_appointment')}
                </Button>
            </Box>

            {/* DOCTOR SELECTOR */}
            <DoctorSelector
                doctors={doctors}
                selectedDoctorId={selectedDoctorId}
                onSelect={setSelectedDoctorId}
            />

            {/* CALENDAR */}
            <Paper elevation={0} sx={{ flex: 1, borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, overflow: 'hidden', p: 0, '& .fc': { height: '100%' } }}>
                {selectedDoctorId ? (
                    <AppointmentCalendar
                        events={calendarEvents}
                        onSelect={handleSelect}
                        onEventClick={handleEventClick}
                        clearSelection={!drawerOpen}
                    />
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <Typography variant="h6" color="text.secondary">{t('appointments.select_doctor_msg')}</Typography>
                    </Box>
                )}
            </Paper>

            <AppointmentDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSave={handleSave}
                onDelete={handleDelete}
                appointment={selectedAppointment}
                doctor={selectedDoctor}
                doctors={doctors}
                onDoctorChange={setSelectedDoctorId}
                t={t}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', borderRadius: '12px', fontWeight: 600 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </Box>
        </ModulePageWrapper>
    );
};

export default AppointmentsPage;
