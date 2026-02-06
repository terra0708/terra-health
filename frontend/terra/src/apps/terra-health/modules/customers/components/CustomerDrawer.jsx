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
import { useReminderStore } from '@shared/modules/reminders';
import { useCustomerSettingsStore } from '../hooks/useCustomerSettingsStore';
import { customerSchema } from '../data/schema';
import { PersonalInfoTab } from './PersonalInfoTab';
import { StatusTab } from './StatusTab';
import { RemindersTab } from './RemindersTab';
import { FilesTab } from './FilesTab';
import { PaymentsTab } from './PaymentsTab';
import { useNotificationStore } from '@modules/notifications/hooks/useNotificationStore';

export const CustomerDrawer = ({ open, onClose, customer, client, t: tProp }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { t: tInternal, i18n } = useTranslation(['terra-health', 'translation']);
    const t = tProp || tInternal;
    const activeCustomer = customer || client;
    const settings = useCustomerSettingsStore();
    const { addClient, updateClient } = useClientStore();
    const { syncCustomerReminders } = useReminderStore();
    const [tabValue, setTabValue] = React.useState(0);
    const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });

    const {
        register,
        control,
        handleSubmit,
        reset,
        watch,
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
            settings.fetchAll().catch(() => { });
        }
    }, [open]);

    useEffect(() => {
        const initForm = async () => {
            if (!open) return;

            if (activeCustomer) {
                // Fetch fresh reminders from backend to ensure synchronization
                let centralReminders = [];
                try {
                    centralReminders = await useReminderStore.getState().fetchRemindersByCustomer(activeCustomer.id);
                    // Filter reminders belonging to this customer
                    centralReminders = centralReminders.filter(r =>
                        r.relationType === 'customer' || r.relationId === activeCustomer.id
                    );
                } catch (err) {
                    console.error("Failed to sync reminders for drawer:", err);
                    // Fallback to what's already in state
                    centralReminders = useReminderStore.getState().reminders.filter(r => r.relationId === activeCustomer.id);
                }

                reset({
                    ...activeCustomer,
                    country: activeCustomer.country || 'TR',
                    status: activeCustomer.status || settings.statuses[0]?.value || 'new',
                    source: activeCustomer.source || settings.sources[0]?.value || 'manual',
                    consultantId: activeCustomer.consultantId || '',
                    categories: activeCustomer.categories || [],
                    notes: activeCustomer.notes || [],
                    files: activeCustomer.files || [],
                    payments: activeCustomer.payments || [],
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
                    city: '', job: '', medicalHistory: '', operationType: '', passportNumber: '',
                    reminder: { active: false, notes: [] }
                });
            }
            setTabValue(0);
        };

        initForm();
    }, [activeCustomer, open, reset, settings]);

    const onInvalid = (formErrors) => {
        console.error('Customer Form Validation Errors:', formErrors);

        // Find which tab the first error belongs to and switch to it
        const firstErrorPath = Object.keys(formErrors)[0];

        // Tab mapping
        const personalInfoFields = ['name', 'phone', 'email', 'country', 'city', 'job', 'passportNumber', 'operationType', 'medicalHistory', 'registrationDate'];
        const statusFields = ['consultantId', 'categories', 'services', 'status', 'source'];

        if (personalInfoFields.includes(firstErrorPath)) {
            setTabValue(0);
        } else if (statusFields.includes(firstErrorPath)) {
            setTabValue(1);
        }

        setSnackbar({
            open: true,
            message: t('common.validation_error', 'Lütfen eksik veya hatalı alanları kontrol ediniz'),
            severity: 'warning'
        });
    };

    const onSubmit = (data) => {
        // Handle Mentions
        const allNotes = [...(data.notes || []), ...(data.reminder?.notes || []), ...(data.payments || [])];
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

        // Unified Customer Data for Backend
        const payload = {
            ...customerData,
            registrationDate: customerData.registrationDate ?
                (customerData.registrationDate.length === 10 ?
                    `${customerData.registrationDate}T00:00:00` :
                    customerData.registrationDate.substring(0, 19)) :
                new Date().toISOString().substring(0, 19),
            consultantId: customerData.consultantId || null,
            leadId: customerData.leadId || null,
            industryType: 'HEALTH'
        };

        if (activeCustomer) {
            // Update existing
            const clientId = activeCustomer.id;

            updateClient(clientId, payload).then(async () => {
                // Sync Reminders (Intelligent sync instead of wipe-recreate)
                await syncCustomerReminders(clientId, reminderNotes);
                setSnackbar({ open: true, message: t('common.success_update', 'Güncellendi'), severity: 'success' });
                onClose();
            }).catch(err => {
                console.error('Update failed:', err);
                setSnackbar({ open: true, message: err.message || t('common.error'), severity: 'error' });
            });
        } else {
            // New Customer
            addClient(payload).then(async (newCustomer) => {
                const newId = newCustomer?.id;

                // Add reminders (Sync also works for new customers)
                if (newId) {
                    await syncCustomerReminders(newId, reminderNotes);
                }

                // Add notification
                useNotificationStore.getState().addNotification({
                    title: t('notifications.new_leads'),
                    message: `${data.name} yeni müşteri kaydı.`,
                    type: 'system',
                    priority: 'high',
                    link: '/customers'
                });

                setSnackbar({ open: true, message: t('common.success_add', 'Eklendi'), severity: 'success' });
                onClose();
            }).catch(err => {
                console.error('Save failed:', err);
                setSnackbar({ open: true, message: err.message || t('common.error'), severity: 'error' });
            });
        }
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
                            <ActiveTabComponent
                                register={register}
                                control={control}
                                t={t}
                                i18n={i18n}
                                lang={i18n.language}
                                errors={errors}
                                customerId={activeCustomer?.id}
                                watch={watch}
                                customerName={watch('name')}
                            />

                            <Box sx={{ mt: 6, display: 'flex', gap: 2 }}>
                                <Button fullWidth variant="outlined" onClick={onClose} sx={{ borderRadius: '12px', py: 1.5, fontWeight: 800 }}>{t('common.cancel')}</Button>
                                <Button fullWidth variant="contained" onClick={handleSubmit(onSubmit, onInvalid)} sx={{ borderRadius: '12px', py: 1.5, fontWeight: 800 }}>{t('common.save')}</Button>
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
