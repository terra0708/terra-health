import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, Box, Typography, IconButton,
    Grid, Chip, alpha, useTheme, Divider, Stack, Tabs, Tab, Paper, List, ListItem, ListItemText, ListItemIcon, TablePagination
} from '@mui/material';
import {
    X, User, Phone, Globe, Link as LinkIcon, Calendar, Mail,
    Tag as TagIcon, Briefcase, Activity, Clock, FileText, Bell, CreditCard,
    File, Download, ExternalLink, CheckCircle2, ChevronRight, MapPin, IdCard, Stethoscope
} from 'lucide-react';
import { formatLocaleDate, ALL_COUNTRIES } from '../data/countries';
import { useTranslation } from 'react-i18next';
import { UserCheck } from 'lucide-react';
import { useLookup } from '@common/hooks/useLookup';
import { ReminderCard, useReminderSettingsStore, useReminderStore } from '@shared/modules/reminders';
import { useFileStore } from '@shared/modules/files';
import { Trash2 } from 'lucide-react';
// CustomerDetailsDialog uses merged customer object from useCustomers hook
// No direct store import needed

export const CustomerDetailsDialog = ({ open, onClose, customer, client, t: tProp }) => {
    const theme = useTheme();
    const { t: tInternal, i18n } = useTranslation(['terra-health', 'translation']);
    const t = tProp || tInternal;
    const { getStatus, getSource, getService, getTag } = useLookup();
    const categories = useReminderSettingsStore(state => state.categories);
    const subCategories = useReminderSettingsStore(state => state.subCategories);
    const statuses = useReminderSettingsStore(state => state.statuses);
    const updateReminder = useReminderStore(state => state.updateReminder);
    const reminders = useReminderStore(state => state.reminders);

    // File store
    const files = useFileStore(state => state.files);
    const deleteFile = useFileStore(state => state.deleteFile);
    const fetchCustomerFiles = useFileStore(state => state.fetchCustomerFiles);

    // Support both 'customer' and 'client' prop names for compatibility
    const customerData = customer || client;

    const customerReminders = React.useMemo(() => {
        if (!customerData) return [];
        // Filter reminders that belong to this customer
        // Check both relationId and categoryId to ensure we catch all customer-related reminders
        return reminders.filter(r =>
            r.relationId === customerData.id &&
            (r.relationType === 'customer' || r.relationId === customerData.id)
        );
    }, [reminders, customerData?.id]);

    const [activeTab, setActiveTab] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const lang = i18n.language;

    // Reset pagination when tab changes or dialog opens
    useEffect(() => {
        setPage(0);
    }, [activeTab, open]);

    // Fetch fresh reminders and settings when customer changes or dialog opens
    useEffect(() => {
        if (open && customerData?.id) {
            useReminderStore.getState().fetchRemindersByCustomer(customerData.id);
            useReminderSettingsStore.getState().fetchSettings();
            fetchCustomerFiles(customerData.id);
        }
    }, [open, customerData?.id, fetchCustomerFiles]);

    if (!customerData) return null;

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const country = ALL_COUNTRIES.find(c => c.code === customerData.country);
    const consultantName = customerData.consultantName || customerData.consultant || null;


    const SectionTitle = ({ icon: Icon, title, count }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, mt: 1 }}>
            <Box sx={{ p: 1, borderRadius: '10px', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex' }}>
                <Icon size={18} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, flex: 1 }}>{title}</Typography>
            {count !== undefined && (
                <Chip label={count} size="small" sx={{ fontWeight: 900, bgcolor: 'divider', height: 20 }} />
            )}
        </Box>
    );

    const DetailItem = ({ label, value, icon: Icon, color }) => (
        <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                {Icon && <Icon size={14} style={{ color: color || theme.palette.text.secondary, opacity: 0.7 }} />}
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                    {label}
                </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700, pl: Icon ? 3 : 0 }}>
                {value || '-'}
            </Typography>
        </Box>
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: '28px', overflow: 'hidden', minHeight: '600px' }
            }}
        >
            <Box sx={{
                p: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.02) : alpha(theme.palette.primary.main, 0.02),
                borderBottom: `1px solid ${theme.palette.divider}`
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                        width: 54, height: 54, borderRadius: '16px',
                        bgcolor: 'primary.main', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.8rem', boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`
                    }}>
                        {customerData.name.charAt(0)}
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>{customerData.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                            ID: #{customerData.id} • {formatLocaleDate(customerData.registrationDate, lang)}
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), color: 'error.main', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) } }}>
                    <X size={20} />
                </IconButton>
            </Box>

            <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                sx={{
                    px: 3,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', minHeight: 48 },
                    '& .MuiTabs-indicator': { height: 3, borderRadius: '3px' }
                }}
            >
                <Tab label={t('customers.personal_info')} />
                <Tab label={t('customers.notes')} />
                <Tab label={t('customers.reminder_info')} />
                <Tab label={t('customers.files_info')} />
                <Tab label={t('customers.payments')} />
            </Tabs>

            <DialogContent sx={{ p: 4, display: 'flex', flexDirection: 'column' }}>
                {activeTab === 0 && (
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={6}>
                            <SectionTitle icon={User} title={t('customers.basic_info')} />
                            <DetailItem icon={Phone} label={t('customers.phone')} value={customerData.phone} color={theme.palette.primary.main} />
                            <DetailItem icon={Mail} label={t('customers.email')} value={customerData.email || '-'} color={theme.palette.info.main} />
                            <DetailItem icon={Globe} label={t('customers.country')} value={`${country?.flag} ${country?.name} (${customerData.country})`} />

                            <Box sx={{ mt: 4 }}>
                                <SectionTitle icon={Briefcase} title={t('customers.job')} />
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <DetailItem icon={MapPin} label={t('customers.city')} value={customerData.city} />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <DetailItem icon={Briefcase} label={t('customers.job')} value={customerData.job} />
                                    </Grid>
                                </Grid>
                            </Box>

                            <Box sx={{ mt: 2 }}>
                                <SectionTitle icon={FileText} title={t('customers.basic_info')} />
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <DetailItem icon={IdCard} label={t('customers.passport_number')} value={customerData.passportNumber} />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <DetailItem icon={Stethoscope} label={t('customers.operation_type')} value={customerData.operationType} />
                                    </Grid>
                                </Grid>
                                <DetailItem icon={Activity} label={t('customers.medical_history')} value={customerData.medicalHistory} />
                            </Box>

                            <Box sx={{ mt: 4 }}>
                                <SectionTitle icon={Briefcase} title={t('customers.services')} count={Array.isArray(customerData.services) ? customerData.services.length : 0} />
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {Array.isArray(customerData.services) && customerData.services.map((sName, i) => {
                                        const { label, color } = getService(sName);
                                        return (
                                            <Chip
                                                key={i}
                                                label={label}
                                                size="small"
                                                sx={{ fontWeight: 800, bgcolor: alpha(color, 0.08), color: color, border: `1px solid ${alpha(color, 0.2)}` }}
                                            />
                                        );
                                    })}
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <SectionTitle icon={Activity} title={t('customers.status_info')} />
                            <DetailItem
                                icon={Activity}
                                label={t('common.status')}
                                value={getStatus(customerData.status).label}
                                color={getStatus(customerData.status).color}
                            />
                            <DetailItem
                                icon={LinkIcon}
                                label={t('customers.source')}
                                value={getSource(typeof customerData.source === 'object' ? customerData.source?.type : customerData.source).label}
                                color={getSource(typeof customerData.source === 'object' ? customerData.source?.type : customerData.source).color}
                            />
                            <DetailItem
                                icon={UserCheck}
                                label={t('customers.consultant')}
                                value={consultantName || '-'}
                                color={theme.palette.secondary.main}
                            />

                            <Box sx={{ mt: 4 }}>
                                <SectionTitle icon={TagIcon} title={t('customers.tags')} count={Array.isArray(customerData.tags) ? customerData.tags.length : 0} />
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {Array.isArray(customerData.tags) && customerData.tags.map((tName, i) => {
                                        const { label, color } = getTag(tName);
                                        return (
                                            <Chip
                                                key={i}
                                                label={label}
                                                size="small"
                                                sx={{ fontWeight: 800, bgcolor: alpha(color, 0.08), color: color, borderRadius: '6px' }}
                                            />
                                        );
                                    })}
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                )}

                {activeTab === 1 && (
                    <Stack spacing={3} sx={{ flex: 1 }}>
                        <SectionTitle icon={FileText} title={t('customers.notes')} count={Array.isArray(customerData.notes) ? customerData.notes.length : 0} />
                        <Box sx={{ flex: 1, minHeight: 0 }}>
                            {Array.isArray(customerData.notes) && customerData.notes.length > 0 ? (
                                <>
                                    <Stack spacing={2}>
                                        {customerData.notes
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((note) => (
                                                <Paper key={note.id} elevation={0} sx={{ p: 2.5, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.primary.main, 0.01) }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, whiteSpace: 'pre-wrap' }}>{note.text}</Typography>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>{note.date}</Typography>
                                                </Paper>
                                            ))}
                                    </Stack>
                                    <TablePagination
                                        component="div"
                                        count={customerData.notes.length}
                                        page={page}
                                        onPageChange={handleChangePage}
                                        rowsPerPage={rowsPerPage}
                                        onRowsPerPageChange={handleChangeRowsPerPage}
                                        labelRowsPerPage={t('common.rows_per_page')}
                                        rowsPerPageOptions={[5, 10, 25]}
                                    />
                                </>
                            ) : (
                                <Box sx={{ py: 8, textAlign: 'center', opacity: 0.3 }}>
                                    <FileText size={48} style={{ marginBottom: 16 }} />
                                    <Typography variant="body2" fontWeight={800}>{t('customers.no_notes')}</Typography>
                                </Box>
                            )}
                        </Box>
                    </Stack>
                )}

                {activeTab === 2 && (
                    <Stack spacing={3} sx={{ flex: 1 }}>
                        <SectionTitle icon={Bell} title={t('customers.scheduled_reminders')} count={customerReminders.length} />
                        <Box sx={{ flex: 1, minHeight: 0 }}>
                            {customerReminders.length > 0 ? (
                                <>
                                    <Stack spacing={2}>
                                        {customerReminders
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((rem) => (
                                                <ReminderCard
                                                    key={rem.id}
                                                    reminder={{ ...rem, customer: customerData }}
                                                    onChangeStatus={(reminder, newStatusId) => {
                                                        const newStatus = statuses.find(s => s.id === newStatusId);
                                                        updateReminder(rem.id, {
                                                            statusId: newStatusId,
                                                            isCompleted: newStatus ? newStatus.isCompleted : false
                                                        });
                                                    }}
                                                    t={t}
                                                    i18n={i18n}
                                                    categories={categories}
                                                    subCategories={subCategories}
                                                    statuses={statuses}
                                                    hideCustomerInfo={true}
                                                    compact={true}
                                                />
                                            ))}
                                    </Stack>
                                    <TablePagination
                                        component="div"
                                        count={customerReminders.length}
                                        page={page}
                                        onPageChange={handleChangePage}
                                        rowsPerPage={rowsPerPage}
                                        onRowsPerPageChange={handleChangeRowsPerPage}
                                        labelRowsPerPage={t('common.rows_per_page')}
                                        rowsPerPageOptions={[5, 10, 25]}
                                    />
                                </>
                            ) : (
                                <Box sx={{ py: 8, textAlign: 'center', opacity: 0.3 }}>
                                    <Bell size={48} style={{ marginBottom: 16 }} />
                                    <Typography variant="body2" fontWeight={800}>{t('customers.no_reminders')}</Typography>
                                </Box>
                            )}
                        </Box>
                    </Stack>
                )}

                {activeTab === 3 && (
                    <Stack spacing={3} sx={{ flex: 1 }}>
                        <SectionTitle icon={File} title={t('customers.files_info')} count={files.length} />

                        <Box sx={{ flex: 1, minHeight: 0 }}>
                            {files.length > 0 ? (
                                <>
                                    <Stack spacing={2}>
                                        {files
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((file) => (
                                                <Paper
                                                    key={file.id}
                                                    elevation={0}
                                                    sx={{
                                                        p: 2.5,
                                                        borderRadius: '16px',
                                                        border: `1px solid ${theme.palette.divider}`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 2,
                                                        transition: 'all 0.2s',
                                                        '&:hover': {
                                                            bgcolor: alpha(theme.palette.primary.main, 0.02),
                                                            borderColor: alpha(theme.palette.primary.main, 0.3),
                                                            transform: 'translateY(-2px)',
                                                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`
                                                        }
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: 48,
                                                            height: 48,
                                                            borderRadius: '12px',
                                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                            color: 'primary.main',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        <FileText size={24} />
                                                    </Box>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                fontWeight: 800,
                                                                mb: 0.5,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {file.originalFilename}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                            {file.category && (
                                                                <Chip
                                                                    label={file.category.labelTr || file.category.labelEn}
                                                                    size="small"
                                                                    sx={{
                                                                        height: 20,
                                                                        fontSize: '0.7rem',
                                                                        fontWeight: 700,
                                                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                                        color: 'primary.main'
                                                                    }}
                                                                />
                                                            )}
                                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                                {(file.fileSize / 1024).toFixed(1)} KB
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                                •
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                                {formatLocaleDate(file.uploadedAt, lang)}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                window.open(`/api/v1/health/customers/${customerData.id}/files/${file.id}/download`, '_blank');
                                                            }}
                                                            sx={{
                                                                bgcolor: alpha(theme.palette.info.main, 0.1),
                                                                color: 'info.main',
                                                                '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.2) }
                                                            }}
                                                        >
                                                            <Download size={18} />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={async () => {
                                                                if (window.confirm(t('files.confirm_delete'))) {
                                                                    await deleteFile(file.id);
                                                                }
                                                            }}
                                                            sx={{
                                                                bgcolor: alpha(theme.palette.error.main, 0.1),
                                                                color: 'error.main',
                                                                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                                                            }}
                                                        >
                                                            <Trash2 size={18} />
                                                        </IconButton>
                                                    </Box>
                                                </Paper>
                                            ))}
                                    </Stack>
                                    <TablePagination
                                        component="div"
                                        count={files.length}
                                        page={page}
                                        onPageChange={handleChangePage}
                                        rowsPerPage={rowsPerPage}
                                        onRowsPerPageChange={handleChangeRowsPerPage}
                                        labelRowsPerPage={t('common.rows_per_page')}
                                        rowsPerPageOptions={[5, 10, 25]}
                                    />
                                </>
                            ) : (
                                <Box sx={{ py: 8, textAlign: 'center', opacity: 0.3 }}>
                                    <File size={48} style={{ marginBottom: 16 }} />
                                    <Typography variant="body2" fontWeight={800}>{t('customers.no_files')}</Typography>
                                </Box>
                            )}
                        </Box>
                    </Stack>
                )}

                {activeTab === 4 && (
                    <Stack spacing={3} sx={{ flex: 1 }}>
                        <SectionTitle icon={CreditCard} title={t('customers.payments')} count={Array.isArray(customerData.payments) ? customerData.payments.length : 0} />
                        <Box sx={{ flex: 1, minHeight: 0 }}>
                            {Array.isArray(customerData.payments) && customerData.payments.length > 0 ? (
                                <>
                                    <Stack spacing={2}>
                                        {customerData.payments
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((pay) => (
                                                <Paper key={pay.id} elevation={0} sx={{ p: 2.5, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.success.main, 0.02) }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>{pay.text}</Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.6 }}>
                                                        <Calendar size={14} />
                                                        <Typography variant="caption" sx={{ fontWeight: 800 }}>{pay.date}</Typography>
                                                    </Box>
                                                </Paper>
                                            ))}
                                    </Stack>
                                    <TablePagination
                                        component="div"
                                        count={customerData.payments.length}
                                        page={page}
                                        onPageChange={handleChangePage}
                                        rowsPerPage={rowsPerPage}
                                        onRowsPerPageChange={handleChangeRowsPerPage}
                                        labelRowsPerPage={t('common.rows_per_page')}
                                        rowsPerPageOptions={[5, 10, 25]}
                                    />
                                </>
                            ) : (
                                <Box sx={{ py: 8, textAlign: 'center', opacity: 0.3 }}>
                                    <CreditCard size={48} style={{ marginBottom: 16 }} />
                                    <Typography variant="body2" fontWeight={800}>{t('customers.no_payments')}</Typography>
                                </Box>
                            )}
                        </Box>
                    </Stack>
                )}
            </DialogContent>
        </Dialog>
    );
};
