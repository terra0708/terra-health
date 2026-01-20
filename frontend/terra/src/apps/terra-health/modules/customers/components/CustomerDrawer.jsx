import React, { useEffect } from 'react';
import {
    Drawer, Box, Typography, IconButton, Stack, Button,
    alpha, useTheme, Tabs, Tab, useMediaQuery, Snackbar, Alert
} from '@mui/material';
import { X, User, Bell, Activity, FileText, CreditCard } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useClientStore } from '@shared/modules/clients';
import { usePatientDetailsStore } from '../hooks/usePatientDetailsStore';
import { useReminderStore } from '@shared/modules/reminders';
import { useCustomerSettingsStore } from '../hooks/useCustomerSettingsStore';
import { customerSchema } from '../data/schema';
import { PersonalInfoTab } from './PersonalInfoTab';
import { StatusTab } from './StatusTab';
import { RemindersTab } from './RemindersTab';
import { FilesTab } from './FilesTab';
import { PaymentsTab } from './PaymentsTab';
import { useNotificationStore } from '@modules/notifications/hooks/useNotificationStore';

export const CustomerDrawer = ({ open, onClose, customer, t }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { i18n } = useTranslation();
    const settings = useCustomerSettingsStore();
    const { addClient, updateClient, setIndustryType } = useClientStore();
    const { addPatientDetails, updatePatientDetails, getPatientDetailsByClientId } = usePatientDetailsStore();
    const { addReminder, deleteRemindersByRelation } = useReminderStore();
    const [tabValue, setTabValue] = React.useState(0);
    const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            name: '', phone: '', email: '', country: 'TR',
            registrationDate: new Date().toISOString().split('T')[0],
            status: 'new', source: 'manual', services: [], tags: [],
            notes: [], files: [], payments: [],
            reminder: { active: false, notes: [] } // For form internal use
        }
    });

    useEffect(() => {
        if (open) {
            if (customer) {
                // Fetch reminders from central store for this customer
                const centralReminders = useReminderStore.getState().reminders
                    .filter(r => r.relationId === customer.id);

                // Customer object is already merged (from useCustomers hook)
                reset({
                    ...customer,
                    country: customer.country || 'TR',
                    status: customer.status || settings.statuses[0]?.value || 'new',
                    source: customer.source || settings.sources[0]?.value || 'manual',
                    consultantId: customer.consultantId || '',
                    category: customer.category || '',
                    notes: customer.notes || [],
                    files: customer.files || [],
                    payments: customer.payments || [],
                    reminder: {
                        active: centralReminders.length > 0,
                        notes: centralReminders
                    }
                });
            } else {
                reset({
                    name: '', phone: '', email: '', country: 'TR',
                    registrationDate: new Date().toISOString().split('T')[0],
                    status: settings.statuses[0]?.value || 'new',
                    source: settings.sources[0]?.value || 'manual',
                    services: [], tags: [], notes: [],
                    files: [], payments: [],
                    reminder: { active: false, notes: [] }
                });
            }
            setTabValue(0);
        }
    }, [customer, open, reset, settings]);

    const onSubmit = (data) => {
        // Handle Mentions
        const allNotes = [...data.notes, ...(data.reminder?.notes || []), ...data.payments];
        const mentionRegex = /@(\w+)/g;
        allNotes.forEach(note => {
            let match;
            while ((match = mentionRegex.exec(note.text || note.note || '')) !== null) {
                useNotificationStore.getState().addNotification({
                    title: 'Senden Bahsedildi',
                    message: `${data.name} hakkındaki bir notta bahsedildin.`,
                    type: 'system', priority: 'medium', link: '/customers'
                });
            }
        });

        // Separate Reminders from Customer Data
        const { reminder, ...customerData } = data;
        const reminderNotes = reminder?.notes || [];

        // Split data into base client and patient details
        const {
            // Base client fields
            name, phone, email, country, source, registrationDate, assignedTo,
            // Patient details fields
            services, tags, status, consultantId, category, notes, files, payments,
            city, job, medicalHistory, operationType, passportNumber
        } = customerData;

        const baseClient = {
            name,
            phone,
            email: email || '',
            country,
            source,
            registrationDate,
            assignedTo: assignedTo || consultantId || null,
            industryType: 'HEALTH'
        };

        const patientDetails = {
            services: services || [],
            tags: tags || [],
            status: status || 'new',
            consultantId: consultantId || assignedTo || null,
            category: category || '',
            notes: notes || [],
            files: files || [],
            payments: payments || [],
            city: city || '',
            job: job || '',
            medicalHistory: medicalHistory || '',
            operationType: operationType || '',
            passportNumber: passportNumber || ''
        };

        if (customer) {
            // Update existing
            const clientId = customer.id;
            
            // Update base client
            updateClient(clientId, baseClient);
            setIndustryType(clientId, 'HEALTH');
            
            // Update patient details
            updatePatientDetails(clientId, patientDetails);

            // Sync Reminders
            deleteRemindersByRelation(clientId);
            reminderNotes.forEach(rn => {
                addReminder({ ...rn, relationId: clientId, categoryId: 'customer' });
            });

            setSnackbar({ open: true, message: t('common.success_update', 'Güncellendi'), severity: 'success' });
        } else {
            // New Customer
            const newClient = addClient(baseClient);
            const newId = newClient?.id || Date.now();
            
            // Set industry type
            setIndustryType(newId, 'HEALTH');
            
            // Add patient details
            addPatientDetails(newId, patientDetails);

            // Add reminders
            reminderNotes.forEach(rn => {
                addReminder({ ...rn, relationId: newId, categoryId: 'customer' });
            });

            useNotificationStore.getState().addNotification({
                title: t('notifications.new_leads'),
                message: `${data.name} yeni müşteri kaydı.`,
                type: 'new_lead', priority: 'high', link: '/customers'
            });
            setSnackbar({ open: true, message: t('common.success_save'), severity: 'success' });
        }
        setTimeout(onClose, 800);
    };

    const tabs = [
        { label: t('customers.personal_info'), icon: <User size={18} />, color: theme.palette.primary.main, component: PersonalInfoTab },
        { label: t('customers.status_info'), icon: <Activity size={18} />, color: '#10b981', component: StatusTab },
        { label: t('customers.reminder_info'), icon: <Bell size={18} />, color: '#f59e0b', component: RemindersTab },
        { label: t('customers.files_info'), icon: <FileText size={18} />, color: '#3b82f6', component: FilesTab },
        { label: t('customers.payments'), icon: <CreditCard size={18} />, color: '#8b5cf6', component: PaymentsTab },
    ];

    const ActiveTabComponent = tabs[tabValue].component;

    return (
        <Drawer
            anchor="right" open={open} onClose={onClose}
            sx={{ zIndex: theme.zIndex.drawer + 2, '& .MuiBackdrop-root': { backdropFilter: 'blur(4px)' } }}
            PaperProps={{ sx: { width: { xs: '100%', sm: 800, md: 850 }, bgcolor: 'background.default', overflow: 'hidden' } }}
        >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: alpha(theme.palette.primary.main, 0.02), borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'primary.main', color: 'white', display: 'flex' }}><User size={24} /></Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 900 }}>{customer ? t('customers.edit_customer') : t('customers.add_customer')}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>{customer ? `ID: #${customer.id}` : t('customers.form_subtitle')}</Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={onClose}><X size={20} /></IconButton>
                </Box>

                <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    <Box sx={{ width: { xs: 70, sm: 240 }, borderRight: `1px solid ${theme.palette.divider}`, py: 3, bgcolor: alpha(theme.palette.primary.main, 0.01) }}>
                        <Tabs orientation="vertical" value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ '& .MuiTabs-indicator': { left: 0, width: 4, bgcolor: tabs[tabValue].color } }}>
                            {tabs.map((tab, i) => (
                                <Tab
                                    key={i} icon={tab.icon} iconPosition={isMobile ? "top" : "start"}
                                    label={!isMobile && tab.label}
                                    sx={{
                                        minHeight: 64, textAlign: 'left', justifyContent: 'flex-start', borderRadius: '12px', mx: 1, mb: 0.5,
                                        '&.Mui-selected': { color: tabs[tabValue].color, bgcolor: alpha(tabs[tabValue].color, 0.08) }
                                    }}
                                />
                            ))}
                        </Tabs>
                    </Box>

                    <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 3, md: 5 }, bgcolor: 'background.paper' }}>
                        <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                            <ActiveTabComponent register={register} control={control} t={t} i18n={i18n} lang={i18n.language} errors={errors} />

                            <Box sx={{ mt: 6, display: 'flex', gap: 2 }}>
                                <Button fullWidth variant="outlined" onClick={onClose} sx={{ borderRadius: '12px', py: 1.5, fontWeight: 800 }}>{t('common.cancel')}</Button>
                                <Button fullWidth variant="contained" onClick={handleSubmit(onSubmit)} sx={{ borderRadius: '12px', py: 1.5, fontWeight: 800 }}>{t('common.save')}</Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ borderRadius: '12px', fontWeight: 600 }}>{snackbar.message}</Alert>
            </Snackbar>
        </Drawer>
    );
};
