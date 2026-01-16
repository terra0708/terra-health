import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, Box, Typography, IconButton,
    Grid, Chip, alpha, useTheme, Divider, Stack, Tabs, Tab, Paper, List, ListItem, ListItemText, ListItemIcon, TablePagination
} from '@mui/material';
import {
    X, User, Phone, Globe, Link as LinkIcon, Calendar, Mail,
    Tag as TagIcon, Briefcase, Activity, Clock, FileText, Bell, CreditCard,
    File, Download, ExternalLink, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useCustomerSettingsStore } from '../hooks/useCustomerSettingsStore';
import { formatLocaleDate, ALL_COUNTRIES } from '../data/countries';
import { useTranslation } from 'react-i18next';
import { MOCK_USERS } from '../../users';
import { UserCheck } from 'lucide-react';

export const CustomerDetailsDialog = ({ open, onClose, customer }) => {
    const theme = useTheme();
    const { t, i18n } = useTranslation();
    const settings = useCustomerSettingsStore();
    const [activeTab, setActiveTab] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const lang = i18n.language;

    // Reset pagination when tab changes or dialog opens
    useEffect(() => {
        setPage(0);
    }, [activeTab, open]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (!customer) return null;

    const country = ALL_COUNTRIES.find(c => c.code === customer.country);
    const consultant = MOCK_USERS.find(u => u.id === customer.consultantId);

    const getLocalizedLabel = (def, type) => {
        if (!def) return '-';
        if (type === 'service') return lang === 'tr' ? def.name_tr : (def.name_en || def.name_tr);
        return lang === 'tr' ? def.label_tr : (def.label_en || def.label_tr);
    };

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
                        {customer.name.charAt(0)}
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>{customer.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                            ID: #{customer.id} • {formatLocaleDate(customer.registrationDate, lang)}
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
                            <DetailItem icon={Phone} label={t('customers.phone')} value={customer.phone} color={theme.palette.primary.main} />
                            <DetailItem icon={Mail} label={t('customers.email')} value={customer.email || '-'} color={theme.palette.info.main} />
                            <DetailItem icon={Globe} label={t('customers.country')} value={`${country?.flag} ${country?.name} (${customer.country})`} />

                            <Box sx={{ mt: 4 }}>
                                <SectionTitle icon={Briefcase} title={t('customers.services')} count={customer.services?.length} />
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {customer.services?.map((sName, i) => {
                                        const def = settings.services.find(s => s.value === sName || s.name_tr === sName || s.name_en === sName || s.name === sName);
                                        const color = def?.color || theme.palette.secondary.main;
                                        return (
                                            <Chip
                                                key={i}
                                                label={getLocalizedLabel(def, 'service') || sName}
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
                                value={getLocalizedLabel(settings.statuses.find(s => s.value === customer.status))}
                                color={settings.statuses.find(s => s.value === customer.status)?.color}
                            />
                            <DetailItem
                                icon={LinkIcon}
                                label={t('customers.source')}
                                value={getLocalizedLabel(settings.sources.find(s => s.value === customer.source))}
                                color={settings.sources.find(s => s.value === customer.source)?.color}
                            />
                            <DetailItem
                                icon={UserCheck}
                                label={t('customers.consultant')}
                                value={consultant?.name || '-'}
                                color={theme.palette.secondary.main}
                            />

                            <Box sx={{ mt: 4 }}>
                                <SectionTitle icon={TagIcon} title={t('customers.tags')} count={customer.tags?.length} />
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {customer.tags?.map((tName, i) => {
                                        const def = settings.tags.find(t => t.value === tName || t.label_tr === tName || t.label_en === tName || t.label === tName);
                                        const color = def?.color || theme.palette.text.secondary;
                                        return (
                                            <Chip
                                                key={i}
                                                label={getLocalizedLabel(def) || tName}
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
                        <SectionTitle icon={FileText} title={t('customers.notes')} count={customer.notes?.length} />
                        <Box sx={{ flex: 1, minHeight: 0 }}>
                            {customer.notes?.length > 0 ? (
                                <>
                                    <Stack spacing={2}>
                                        {customer.notes
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
                                        count={customer.notes.length}
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
                        <SectionTitle icon={Bell} title={t('customers.scheduled_reminders')} count={customer.reminder?.notes?.length} />
                        <Box sx={{ flex: 1, minHeight: 0 }}>
                            {customer.reminder?.notes?.length > 0 ? (
                                <>
                                    <Stack spacing={2}>
                                        {customer.reminder.notes
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((rem) => (
                                                <Paper key={rem.id} elevation={0} sx={{ p: 2.5, borderRadius: '20px', border: `1px solid ${theme.palette.divider}`, bgcolor: rem.completed ? alpha(theme.palette.success.main, 0.02) : 'transparent' }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main' }}>
                                                            <Calendar size={16} />
                                                            <Typography variant="caption" sx={{ fontWeight: 900 }}>
                                                                {rem.reminderTime ? new Date(rem.reminderTime).toLocaleString(i18n.language) : rem.date}
                                                            </Typography>
                                                        </Box>
                                                        {rem.completed && <Chip icon={<CheckCircle2 size={12} />} label={t('customers.status.completed')} size="small" color="success" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }} />}
                                                    </Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>{rem.text}</Typography>
                                                </Paper>
                                            ))}
                                    </Stack>
                                    <TablePagination
                                        component="div"
                                        count={customer.reminder.notes.length}
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
                    <Stack spacing={2} sx={{ flex: 1 }}>
                        <SectionTitle icon={File} title={t('customers.files_info')} count={customer.files?.length} />
                        <Box sx={{ flex: 1, minHeight: 0 }}>
                            {customer.files?.length > 0 ? (
                                <>
                                    <Stack spacing={2}>
                                        {customer.files
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((file) => (
                                                <Paper key={file.id} elevation={0} sx={{ p: 2, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 2, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}>
                                                    <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <FileText size={20} />
                                                    </Box>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{file.name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{file.category} • {file.size} • {file.date}</Typography>
                                                    </Box>
                                                    <IconButton size="small"><Download size={18} /></IconButton>
                                                </Paper>
                                            ))}
                                    </Stack>
                                    <TablePagination
                                        component="div"
                                        count={customer.files.length}
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
                        <SectionTitle icon={CreditCard} title={t('customers.payments')} count={customer.payments?.length} />
                        <Box sx={{ flex: 1, minHeight: 0 }}>
                            {customer.payments?.length > 0 ? (
                                <>
                                    <Stack spacing={2}>
                                        {customer.payments
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
                                        count={customer.payments.length}
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
