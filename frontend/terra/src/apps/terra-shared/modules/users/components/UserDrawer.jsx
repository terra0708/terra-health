import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Button,
    TextField,
    InputAdornment,
    Chip,
    useTheme,
    alpha,
    Grid,
    Drawer,
    MenuItem,
    Divider,
    useMediaQuery
} from '@mui/material';
import {
    X,
    Users as UsersIcon,
    Mail,
    Phone,
    Fingerprint,
    MapPin,
    HeartPulse,
    ShieldCheck,
    CheckCircle2,
    UserCircle,
    Lock
} from 'lucide-react';
import { fieldStyles, menuItemStyles } from '../styles';
import apiClient from '../../../core/api';
import { useTranslation } from 'react-i18next';
import { usePermissionStore } from '../../permissions/hooks/usePermissionStore';
import useAuthStore from '@shared/store/authStore';

export const UserDrawer = ({ open, onClose, onSave, user, t }) => {
    const theme = useTheme();
    const currentUser = useAuthStore(state => state.user);
    const tenantDomain = currentUser?.email?.split('@')[1] || 'terra.com.tr';

    const { i18n } = useTranslation();
    const lang = i18n.language;
    const isDark = theme.palette.mode === 'dark';
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        personal_email: '',
        terra_id: '',
        phone: '',
        tc_no: '',
        birth_date: '',
        address: '',
        emergency_person: '',
        emergency_phone: '',
        bundleId: null,
    });

    const { bundles, fetchBundles } = usePermissionStore();
    const [lastUserId, setLastUserId] = useState(null);

    // Fetch bundles once when open
    useEffect(() => {
        if (open && (!bundles || bundles.length === 0)) {
            fetchBundles().catch(() => { });
        }
    }, [open, bundles, fetchBundles]);

    // Initialize form only when open or user changes
    useEffect(() => {
        if (!open) {
            setLastUserId(null); // Reset when closed
            return;
        }

        // Only initialize if we haven't for this user (or if switching from 'new' to a specific user)
        const currentId = user?.id || 'new';
        if (lastUserId === currentId) return;

        if (user) {
            // Split corporate email to get ID
            const emailParts = (user.corporate_email || user.email || '').split('@');
            const terra_id = emailParts[0] || '';

            setFormData({
                name: user.firstName || '',
                surname: user.lastName || '',
                personal_email: user.personal_email || '',
                terra_id: terra_id,
                phone: user.phone || '',
                tc_no: user.tc_no || '',
                birth_date: user.birth_date || '',
                address: user.address || '',
                emergency_person: user.emergency_person || '',
                emergency_phone: user.emergency_phone || '',
                bundleId: null,
            });
        } else {
            setFormData({
                name: '',
                surname: '',
                personal_email: '',
                terra_id: '',
                phone: '',
                tc_no: '',
                birth_date: '',
                address: '',
                emergency_person: '',
                emergency_phone: '',
                bundleId: null,
            });
        }
        setLastUserId(currentId);
    }, [open, user, lastUserId]);

    // When editing, load profile from tenant schema so form shows existing data
    useEffect(() => {
        if (!open || !user?.id) return;
        apiClient
            .get(`/v1/tenant-admin/users/${user.id}/profile`)
            .then((response) => {
                const profile = (response && response.data != null && 'success' in response) ? response.data : response;
                if (profile && typeof profile === 'object') {
                    setFormData((prev) => ({
                        ...prev,
                        tc_no: profile.tcNo ?? prev.tc_no,
                        birth_date: profile.birthDate ?? prev.birth_date,
                        address: profile.address ?? prev.address,
                        emergency_person: profile.emergencyPerson ?? prev.emergency_person,
                        emergency_phone: profile.emergencyPhone ?? prev.emergency_phone,
                        phone: profile.phoneNumber ?? prev.phone,
                        personal_email: profile.personalEmail ?? prev.personal_email,
                    }));
                }
            })
            .catch(() => { });
    }, [open, user?.id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'terra_id') {
            // Only allow lowercase English letters and numbers, strip everything else
            const sanitizedValue = value.toLowerCase().replace(/[^a-z0-9.]/g, '');
            setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const SectionTitle = ({ children, icon: Icon }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, mt: 4 }}>
            <Box sx={{ p: 0.8, borderRadius: '8px', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex' }}>
                <Icon size={16} />
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.primary' }}>{children}</Typography>
        </Box>
    );

    const handleSave = () => {
        if (!onSave) return;

        // Reconstruct corporate email
        const corporate_email = formData.terra_id ? `${formData.terra_id}@${tenantDomain}` : '';

        const authPayload = {
            firstName: formData.name,
            lastName: formData.surname,
            email: corporate_email,
            bundleId: formData.bundleId || null,
        };

        const profilePayload = {
            tcNo: formData.tc_no || null,
            birthDate: formData.birth_date || null,
            address: formData.address || null,
            emergencyPerson: formData.emergency_person || null,
            emergencyPhone: formData.emergency_phone || null,
            phoneNumber: formData.phone || null,
            personalEmail: formData.personal_email || null,
        };

        onSave({ auth: authPayload, profile: profilePayload });
    };

    return (
        <Drawer
            anchor={isMobile ? "bottom" : "right"}
            open={open}
            onClose={onClose}
            sx={{ zIndex: 1400 }}
            PaperProps={{
                sx: {
                    width: isMobile ? '100%' : 500,
                    height: isMobile ? '85vh' : '100%',
                    borderRadius: isMobile ? '32px 32px 0 0' : '32px 0 0 32px',
                    boxShadow: isDark ? '-20px 0 60px rgba(0,0,0,0.5)' : '-20px 0 60px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    bgcolor: 'background.paper'
                }
            }}
        >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
                <Box sx={{ p: isMobile ? 3 : 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', bgcolor: alpha(theme.palette.primary.main, isDark ? 0.05 : 0.02) }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary' }}>{user ? t('users.edit_user') : t('users.add_user')}</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('users.form_subtitle')}</Typography>
                    </Box>
                    <IconButton onClick={(e) => { onClose(); e.currentTarget.blur(); }} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '12px', color: 'text.primary' }}><X size={20} /></IconButton>
                </Box>
                <Divider />

                <Box sx={{ flexGrow: 1, p: isMobile ? 3 : 4, overflowY: 'auto' }}>
                    <SectionTitle icon={UserCircle}>{t('users.basic_info')}</SectionTitle>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label={t('common.name')} name="name" value={formData.name} onChange={handleChange} sx={fieldStyles} InputProps={{ startAdornment: <InputAdornment position="start"><UsersIcon size={18} /></InputAdornment> }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label={t('common.surname')} name="surname" value={formData.surname} onChange={handleChange} sx={fieldStyles} InputProps={{ startAdornment: <InputAdornment position="start"><UsersIcon size={18} /></InputAdornment> }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="TERRA ID"
                                name="terra_id"
                                value={formData.terra_id}
                                onChange={handleChange}
                                sx={fieldStyles}
                                helperText={formData.terra_id ? `${formData.terra_id}@${tenantDomain}` : ''}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Mail size={18} /></InputAdornment>,
                                    endAdornment: <InputAdornment position="end"><Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled' }}>@{tenantDomain}</Typography></InputAdornment>
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label={t('common.personal_email')} name="personal_email" value={formData.personal_email} onChange={handleChange} sx={fieldStyles} InputProps={{ startAdornment: <InputAdornment position="start"><Mail size={18} /></InputAdornment> }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label={t('common.phone')} name="phone" value={formData.phone} onChange={handleChange} sx={fieldStyles} InputProps={{ startAdornment: <InputAdornment position="start"><Phone size={18} /></InputAdornment> }} />
                        </Grid>

                        {/* Password Fields */}
                        {/* Password fields removed – password is generated by backend */}

                    </Grid>

                    <SectionTitle icon={Fingerprint}>{t('users.personal_info')}</SectionTitle>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label={t('common.tc_no')} name="tc_no" value={formData.tc_no} onChange={handleChange} sx={fieldStyles} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label={t('common.birth_date')} name="birth_date" value={formData.birth_date} onChange={handleChange} type="date" sx={fieldStyles} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth label={t('common.address')} name="address" value={formData.address} onChange={handleChange} multiline rows={2} sx={fieldStyles} InputProps={{ startAdornment: <InputAdornment position="start"><MapPin size={18} /></InputAdornment> }} />
                        </Grid>
                    </Grid>

                    <SectionTitle icon={HeartPulse}>{t('users.emergency_info')}</SectionTitle>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label={t('common.emergency_person')} name="emergency_person" value={formData.emergency_person} onChange={handleChange} sx={fieldStyles} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label={t('common.emergency_phone')} name="emergency_phone" value={formData.emergency_phone} onChange={handleChange} sx={fieldStyles} />
                        </Grid>
                    </Grid>

                    <SectionTitle icon={ShieldCheck}>{t('users.role_permission')}</SectionTitle>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                select
                                fullWidth
                                label={t('users.permission_packages')}
                                name="bundleId"
                                value={formData.bundleId || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, bundleId: e.target.value || null }))}
                                sx={fieldStyles}
                                SelectProps={{
                                    MenuProps: {
                                        sx: { zIndex: 3000 },
                                        slotProps: {
                                            paper: {
                                                sx: {
                                                    borderRadius: '16px',
                                                    mt: 1,
                                                    bgcolor: 'background.paper',
                                                    boxShadow: isDark
                                                        ? '0 10px 40px rgba(0,0,0,0.6)'
                                                        : '0 10px 40px rgba(0,0,0,0.2)',
                                                },
                                            },
                                        },
                                    },
                                }}
                            >
                                <MenuItem value="" sx={menuItemStyles}>
                                    {t('common.none') || 'Seçili paket yok'}
                                </MenuItem>
                                {bundles?.map((bundle) => (
                                    <MenuItem key={bundle.id} value={bundle.id} sx={menuItemStyles}>
                                        {bundle.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    </Grid>

                    <Box sx={{ height: 40 }} />
                </Box>

                <Box sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 2, bgcolor: 'background.paper' }}>
                    <Button fullWidth variant="outlined" onClick={onClose} sx={{ borderRadius: '16px', py: 1.5, textTransform: 'none', fontWeight: 700, color: 'text.primary', borderColor: 'divider' }}>{t('common.cancel')}</Button>
                    <Button onClick={handleSave} fullWidth variant="contained" startIcon={<CheckCircle2 size={18} />} sx={{ borderRadius: '16px', py: 1.5, textTransform: 'none', fontWeight: 800, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)` }}>{t('common.save')}</Button>
                </Box>
            </Box>
        </Drawer >
    );
};
