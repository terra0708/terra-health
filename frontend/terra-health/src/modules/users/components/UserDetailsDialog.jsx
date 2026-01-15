import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, IconButton, Box, Typography,
    Grid, Chip, alpha, useTheme, Divider
} from '@mui/material';
import {
    X, UserCircle, Mail, Phone, Fingerprint, Calendar, MapPin,
    HeartPulse, ShieldCheck, Layers, Lock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MOCK_PACKAGES } from '../data/mockData';

export const UserDetailsDialog = ({ open, onClose, user }) => {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const lang = i18n.language;

    if (!user) return null;

    const SectionHeader = ({ icon: Icon, title }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, mt: 3, pb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ p: 0.8, borderRadius: '8px', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex' }}>
                <Icon size={16} />
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.primary' }}>
                {title}
            </Typography>
        </Box>
    );

    const DetailItem = ({ label, value, icon: Icon }) => (
        <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                {Icon && <Icon size={12} />} {label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {value || '-'}
            </Typography>
        </Box>
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: '24px', overflow: 'hidden' }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'background.paper', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <UserCircle size={24} color={theme.palette.primary.main} />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>{t('common.details_dialog_title')}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>{t('common.details_dialog_subtitle')}</Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
                    <X size={20} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                {/* Basic Info */}
                <SectionHeader icon={UserCircle} title={t('users.basic_info')} />
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <DetailItem label={t('common.name')} value={user.name} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <DetailItem label={t('common.phone')} value={user.phone} icon={Phone} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <DetailItem label={t('common.corporate_email')} value={user.corporate_email || user.email} icon={Mail} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <DetailItem label={t('common.personal_email')} value={user.personal_email} icon={Mail} />
                    </Grid>
                </Grid>

                {/* Personal Info */}
                <SectionHeader icon={Fingerprint} title={t('users.personal_info')} />
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <DetailItem label={t('common.tc_no')} value={user.tc_no} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <DetailItem label={t('common.birth_date')} value={user.birth_date} icon={Calendar} />
                    </Grid>
                    <Grid item xs={12}>
                        <DetailItem label={t('common.address')} value={user.address} icon={MapPin} />
                    </Grid>
                </Grid>

                {/* Emergency Info */}
                <SectionHeader icon={HeartPulse} title={t('users.emergency_info')} />
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <DetailItem label={t('common.emergency_person')} value={user.emergency_person} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <DetailItem label={t('common.emergency_phone')} value={user.emergency_phone} icon={Phone} />
                    </Grid>
                </Grid>

                {/* Access Info */}
                <SectionHeader icon={ShieldCheck} title={t('users.role_permission')} />
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <DetailItem label={t('common.role')} value={t(`users.roles.${user.role}`)} />
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1 }}>
                            <Layers size={12} style={{ marginRight: 4 }} /> {t('users.permission_packages')}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {user.packages?.map(pkgId => {
                                const pkg = MOCK_PACKAGES.find(p => p.id === pkgId);
                                const label = lang === 'tr' ? pkg?.name_tr : (pkg?.name_en || pkg?.name_tr);
                                return (
                                    <Chip
                                        key={pkgId}
                                        label={label}
                                        size="small"
                                        sx={{
                                            fontWeight: 700,
                                            bgcolor: alpha(pkg?.color || theme.palette.primary.main, 0.1),
                                            color: pkg?.color || 'primary.main',
                                            borderRadius: '8px'
                                        }}
                                    />
                                );
                            })}
                            {(!user.packages || user.packages.length === 0) && '-'}
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
};
