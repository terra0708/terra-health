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
    Checkbox,
    ListItemText,
    useMediaQuery,
    FormControlLabel
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
    Lock,
    Eye,
    EyeOff
} from 'lucide-react';
import { MOCK_PACKAGES } from '../data/mockData';
import { fieldStyles, menuItemStyles } from '../styles';

import { useTranslation } from 'react-i18next';

export const UserDrawer = ({ open, onClose, onSave, user, t }) => {
    const theme = useTheme();
    const { i18n } = useTranslation();
    const lang = i18n.language;
    const isDark = theme.palette.mode === 'dark';
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [formData, setFormData] = useState({
        name: '', personal_email: '', corporate_email: '', phone: '', tc_no: '', birth_date: '', address: '',
        emergency_person: '', emergency_phone: '', role: 'staff', packages: [], password: '', passwordConfirm: '',
        system_access: true
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                personal_email: user.personal_email || '',
                corporate_email: user.corporate_email || user.email || '',
                phone: user.phone || '',
                tc_no: user.tc_no || '',
                birth_date: user.birth_date || '',
                address: user.address || '',
                emergency_person: user.emergency_person || '',
                emergency_phone: user.emergency_phone || '',
                role: user.role || 'staff',
                packages: user.packages || [],
                password: '',
                passwordConfirm: '',
                system_access: user.system_access !== undefined ? user.system_access : true
            });
        } else {
            setFormData({
                name: '', personal_email: '', corporate_email: '', phone: '', tc_no: '', birth_date: '', address: '',
                emergency_person: '', emergency_phone: '', role: 'staff', packages: [], password: '', passwordConfirm: '',
                system_access: true
            });
        }
    }, [user, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
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
        if (formData.password && formData.password !== formData.passwordConfirm) {
            alert(t('auth.passwords_do_not_match') || 'Passwords do not match!');
            return;
        }
        if (onSave) onSave(formData);
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
                        <Grid item xs={12}>
                            <TextField fullWidth label={t('common.name')} name="name" value={formData.name} onChange={handleChange} sx={fieldStyles} InputProps={{ startAdornment: <InputAdornment position="start"><UsersIcon size={18} /></InputAdornment> }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label={t('common.corporate_email')} name="corporate_email" value={formData.corporate_email} onChange={handleChange} sx={fieldStyles} InputProps={{ startAdornment: <InputAdornment position="start"><Mail size={18} /></InputAdornment> }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label={t('common.personal_email')} name="personal_email" value={formData.personal_email} onChange={handleChange} sx={fieldStyles} InputProps={{ startAdornment: <InputAdornment position="start"><Mail size={18} /></InputAdornment> }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label={t('common.phone')} name="phone" value={formData.phone} onChange={handleChange} sx={fieldStyles} InputProps={{ startAdornment: <InputAdornment position="start"><Phone size={18} /></InputAdornment> }} />
                        </Grid>

                        {/* Password Fields */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label={t('common.password')}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                type={showPassword ? "text" : "password"}
                                sx={fieldStyles}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Lock size={18} /></InputAdornment>,
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label={t('common.password_confirm')}
                                name="passwordConfirm"
                                value={formData.passwordConfirm}
                                onChange={handleChange}
                                type={showPasswordConfirm ? "text" : "password"}
                                sx={fieldStyles}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Lock size={18} /></InputAdornment>,
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPasswordConfirm(!showPasswordConfirm)} edge="end" size="small">
                                                {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>

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
                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                fullWidth
                                label={t('common.role')}
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                sx={fieldStyles}
                                SelectProps={{
                                    MenuProps: {
                                        sx: { zIndex: 3000 },
                                        slotProps: { paper: { sx: { borderRadius: '16px', mt: 1, bgcolor: 'background.paper', boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.6)' : '0 10px 40px rgba(0,0,0,0.2)' } } }
                                    }
                                }}
                            >
                                <MenuItem value="admin" sx={menuItemStyles}>{t('users.roles.admin')}</MenuItem>
                                <MenuItem value="doctor" sx={menuItemStyles}>{t('users.roles.doctor')}</MenuItem>
                                <MenuItem value="staff" sx={menuItemStyles}>{t('users.roles.staff')}</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                fullWidth
                                label={t('users.permission_packages')}
                                name="packages"
                                value={formData.packages}
                                onChange={handleChange}
                                sx={fieldStyles}
                                SelectProps={{
                                    multiple: true,
                                    renderValue: (selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => {
                                                const pkg = MOCK_PACKAGES.find(p => p.id === value);
                                                const label = lang === 'tr' ? pkg?.name_tr : (pkg?.name_en || pkg?.name_tr);
                                                return <Chip key={value} label={label} size="small" sx={{ bgcolor: alpha(pkg?.color || '#000', 0.12), color: pkg?.color, fontWeight: 700, borderRadius: '6px' }} />;
                                            })}
                                        </Box>
                                    ),
                                    MenuProps: {
                                        sx: { zIndex: 3000 },
                                        slotProps: { paper: { sx: { borderRadius: '16px', mt: 1, bgcolor: 'background.paper', boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.6)' : '0 10px 40px rgba(0,0,0,0.2)' } } }
                                    }
                                }}
                            >
                                {MOCK_PACKAGES.map((pkg) => (
                                    <MenuItem key={pkg.id} value={pkg.id} sx={menuItemStyles}>
                                        <Checkbox checked={formData.packages.includes(pkg.id)} size="small" sx={{ color: pkg.color, '&.Mui-checked': { color: pkg.color } }} />
                                        <ListItemText primary={lang === 'tr' ? pkg.name_tr : (pkg.name_en || pkg.name_tr)} primaryTypographyProps={{ fontWeight: 600, color: 'text.primary' }} />
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, p: 2, borderRadius: '16px', bgcolor: alpha(theme.palette.success.main, 0.04), border: `1px solid ${alpha(theme.palette.success.main, 0.1)}` }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formData.system_access}
                                    onChange={(e) => setFormData(prev => ({ ...prev, system_access: e.target.checked }))}
                                    sx={{ color: 'success.main', '&.Mui-checked': { color: 'success.main' } }}
                                />
                            }
                            label={
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                    {t('common.system_access')}
                                </Typography>
                            }
                        />
                    </Box>

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
