import React, { useState, useEffect, memo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Button,
    TextField,
    InputAdornment,
    Chip,
    Avatar,
    useTheme,
    alpha,
    Grid,
    Tooltip,
    Drawer,
    MenuItem,
    Divider,
    Checkbox,
    ListItemText
} from '@mui/material';
import {
    Search,
    Edit3,
    Trash2,
    UserPlus,
    Users as UsersIcon,
    UserCheck,
    ShieldCheck,
    Filter,
    Phone,
    Calendar,
    LogOut,
    X,
    CheckCircle2,
    Mail,
    Fingerprint,
    MapPin,
    HeartPulse,
    UserCircle,
    Package
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// --- MOCK DATA ---
const MOCK_USERS = [
    { id: 1, name: 'Ahmet Yılmaz', email: 'ahmet@terra.com', phone: '+90 532 123 45 67', role: 'admin', packages: [1], joined: '12.05.2023', left: '-', avatar: 'https://i.pravatar.cc/150?u=1' },
    { id: 2, name: 'Zeynep Kaya', email: 'zeynep@terra.com', phone: '+90 544 987 65 43', role: 'doctor', packages: [2], joined: '01.09.2023', left: '-', avatar: 'https://i.pravatar.cc/150?u=2' },
    { id: 3, name: 'Mehmet Demir', email: 'mehmet@terra.com', phone: '+90 505 555 12 12', role: 'staff', packages: [4], joined: '15.11.2023', left: '10.01.2024', avatar: 'https://i.pravatar.cc/150?u=3' },
    { id: 4, name: 'Ayşe Yıldız', email: 'ayse@terra.com', phone: '+90 533 111 22 33', role: 'staff', packages: [4], joined: '20.01.2024', left: '-', avatar: 'https://i.pravatar.cc/150?u=4' },
    { id: 5, name: 'Can Özkan', email: 'can@terra.com', phone: '+90 555 444 33 22', role: 'doctor', packages: [2], joined: '05.02.2024', left: '-', avatar: 'https://i.pravatar.cc/150?u=5' },
];

const MOCK_PACKAGES = [
    { id: 1, name: 'Tam Yetkili (Admin)', color: '#ef4444' },
    { id: 2, name: 'Doktor Paketi', color: '#8b5cf6' },
    { id: 3, name: 'Resepsiyon Paketi', color: '#3b82f6' },
    { id: 4, name: 'Personel Paketi', color: '#10b981' },
];

// --- STAT CARD COMPONENT ---
const StatCard = memo(({ icon: Icon, title, value, color }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    return (
        <Paper elevation={0} sx={{
            p: 3,
            borderRadius: '24px',
            border: `1px solid ${alpha(color, isDark ? 0.2 : 0.1)}`,
            background: isDark
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(color, 0.05)} 100%)`
                : `linear-gradient(135deg, #ffffff 0%, ${alpha(color, 0.02)} 100%)`,
            display: 'flex', alignItems: 'center', gap: 3, transition: 'all 0.3s ease',
            '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: isDark ? `0 10px 30px ${alpha('#000', 0.4)}` : `0 10px 30px ${alpha(color, 0.08)}`
            }
        }}>
            <Box sx={{ width: 56, height: 56, borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(color, 0.08), color: color }}>
                <Icon size={28} />
            </Box>
            <Box>
                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.1em', display: 'block' }}>{title}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary' }}>{value}</Typography>
            </Box>
        </Paper>
    );
});

// --- SUB-COMPONENT: USER FORM (DRAWER) ---
const UserDrawer = ({ open, onClose, user, t }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    // Local state for the form to prevent global re-renders
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', tc_no: '', birth_date: '', address: '', emergency_person: '', emergency_phone: '', role: 'staff', packages: []
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '', email: user.email || '', phone: user.phone || '',
                tc_no: '', birth_date: '', address: '', emergency_person: '', emergency_phone: '', role: user.role || 'staff',
                packages: user.packages || []
            });
        } else {
            setFormData({ name: '', email: '', phone: '', tc_no: '', birth_date: '', address: '', emergency_person: '', emergency_phone: '', role: 'staff', packages: [] });
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

    return (
        <Drawer
            anchor="right" open={open} onClose={onClose}
            sx={{ zIndex: 1400 }}
            PaperProps={{
                sx: {
                    width: { xs: '100%', sm: 500 },
                    borderRadius: { xs: 0, sm: '32px 0 0 32px' },
                    boxShadow: isDark ? '-20px 0 60px rgba(0,0,0,0.5)' : '-20px 0 60px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    bgcolor: 'background.paper'
                }
            }}
        >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
                <Box sx={{ p: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', bgcolor: alpha(theme.palette.primary.main, isDark ? 0.05 : 0.02) }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary' }}>{user ? t('users.edit_user') : t('users.add_user')}</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('users.form_subtitle')}</Typography>
                    </Box>
                    <IconButton onClick={onClose} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '12px', color: 'text.primary' }}><X size={20} /></IconButton>
                </Box>
                <Divider />

                <Box sx={{ flexGrow: 1, p: 4, overflowY: 'auto' }}>
                    <SectionTitle icon={UserCircle}>{t('users.basic_info')}</SectionTitle>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField fullWidth label={t('common.name')} name="name" value={formData.name} onChange={handleChange} sx={fieldStyles} InputProps={{ startAdornment: <InputAdornment position="start"><UsersIcon size={18} /></InputAdornment> }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label={t('common.email')} name="email" value={formData.email} onChange={handleChange} sx={fieldStyles} InputProps={{ startAdornment: <InputAdornment position="start"><Mail size={18} /></InputAdornment> }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label={t('common.phone')} name="phone" value={formData.phone} onChange={handleChange} sx={fieldStyles} InputProps={{ startAdornment: <InputAdornment position="start"><Phone size={18} /></InputAdornment> }} />
                        </Grid>
                    </Grid>

                    <SectionTitle icon={Fingerprint}>{t('users.personal_info')}</SectionTitle>
                    <Grid container spacing={3}>
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
                    <Grid container spacing={3}>
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
                                                return <Chip key={value} label={pkg?.name} size="small" sx={{ bgcolor: alpha(pkg?.color || '#000', 0.12), color: pkg?.color, fontWeight: 700, borderRadius: '6px' }} />;
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
                                        <ListItemText primary={pkg.name} primaryTypographyProps={{ fontWeight: 600, color: 'text.primary' }} />
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    </Grid>
                    <Box sx={{ height: 40 }} />
                </Box>

                <Box sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 2, bgcolor: 'background.paper' }}>
                    <Button fullWidth variant="outlined" onClick={onClose} sx={{ borderRadius: '16px', py: 1.5, textTransform: 'none', fontWeight: 700, color: 'text.primary', borderColor: 'divider' }}>{t('common.cancel')}</Button>
                    <Button fullWidth variant="contained" startIcon={<CheckCircle2 size={18} />} sx={{ borderRadius: '16px', py: 1.5, textTransform: 'none', fontWeight: 800, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)` }}>{t('common.save')}</Button>
                </Box>
            </Box>
        </Drawer>
    );
};

// --- MAIN PAGE COMPONENT ---
const UsersPage = () => {
    const { t } = useTranslation();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [searchTerm, setSearchTerm] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editUser, setEditUser] = useState(null);

    const getRoleChip = (role) => {
        const configs = {
            admin: { color: theme.palette.error.main, label: t('users.roles.admin'), icon: <ShieldCheck size={14} /> },
            doctor: { color: theme.palette.secondary.main, label: t('users.roles.doctor'), icon: <UserCheck size={14} /> },
            staff: { color: theme.palette.primary.main, label: t('users.roles.staff'), icon: <UsersIcon size={14} /> },
        };
        const config = configs[role] || configs.staff;
        return <Chip icon={config.icon} label={config.label} size="small" sx={{ fontWeight: 700, borderRadius: '10px', bgcolor: alpha(config.color, 0.05), color: config.color, border: `1px solid ${alpha(config.color, 0.12)}`, fontSize: '0.75rem', '& .MuiChip-icon': { color: 'inherit' } }} />;
    };

    const filteredUsers = MOCK_USERS.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ animation: 'fadeIn 0.6s ease' }}>
            <Grid container spacing={4} sx={{ mb: 6 }}>
                <Grid item xs={12} md={6}><StatCard icon={UsersIcon} title={t('users.total_team')} value={MOCK_USERS.length} color={theme.palette.primary.main} /></Grid>
                <Grid item xs={12} md={6}><StatCard icon={ShieldCheck} title={t('users.admin_count')} value={1} color={theme.palette.error.main} /></Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.05em', color: 'text.primary' }}>{t('users.title')}</Typography>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <IconButton sx={{ borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper', color: 'text.primary' }}><Filter size={20} /></IconButton>
                    <Button onClick={() => { setEditUser(null); setDrawerOpen(true); }} variant="contained" startIcon={<UserPlus size={18} />} sx={{ borderRadius: '16px', px: 3.5, py: 1.4, fontWeight: 800, textTransform: 'none', background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)` }}>{t('users.add_user')}</Button>
                </Box>
            </Box>

            <Paper elevation={0} sx={{ borderRadius: '32px', overflow: 'hidden', border: `1px solid ${theme.palette.divider}`, background: 'background.paper' }}>
                <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                    <TextField placeholder={t('common.search')} variant="standard" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ width: { xs: '100%', sm: 350 }, '& .MuiInput-underline:before, & .MuiInput-underline:after': { display: 'none' }, '& input': { fontSize: '1rem', fontWeight: 600, color: 'text.primary' } }} InputProps={{ startAdornment: <InputAdornment position="start"><Box sx={{ width: 36, height: 36, borderRadius: '12px', bgcolor: alpha(theme.palette.primary.main, 0.04), display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1, color: 'primary.main' }}><Search size={18} /></Box></InputAdornment> }} />
                </Box>

                <TableContainer>
                    <Table sx={{ minWidth: 900 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.015) }}>
                                <TableCell sx={{ py: 2.5, pl: 4, fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('common.name')}</TableCell>
                                <TableCell sx={{ py: 2.5, fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('common.phone')}</TableCell>
                                <TableCell sx={{ py: 2.5, fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('common.role')}</TableCell>
                                <TableCell sx={{ py: 2.5, fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('common.joining_date')}</TableCell>
                                <TableCell sx={{ py: 2.5, fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('common.leaving_date')}</TableCell>
                                <TableCell align="right" sx={{ py: 2.5, pr: 4, fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('common.actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id} sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.01) } }}>
                                    <TableCell sx={{ py: 2.5, pl: 4 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar src={user.avatar} sx={{ width: 48, height: 48, borderRadius: '14px', border: `2px solid ${theme.palette.background.paper}` }} />
                                            <Box><Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>{user.name}</Typography><Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>{user.email}</Typography></Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Phone size={14} strokeWidth={2.5} color={theme.palette.text.secondary} /><Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{user.phone}</Typography></Box></TableCell>
                                    <TableCell>{getRoleChip(user.role)}</TableCell>
                                    <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Calendar size={14} strokeWidth={2.5} color={theme.palette.text.secondary} /><Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{user.joined}</Typography></Box></TableCell>
                                    <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: user.left === '-' ? theme.palette.text.disabled : theme.palette.error.main }}><LogOut size={14} strokeWidth={2.5} /><Typography variant="body2" sx={{ fontWeight: 600 }}>{user.left}</Typography></Box></TableCell>
                                    <TableCell align="right" sx={{ pr: 4 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.2 }}>
                                            <Tooltip title={t('common.edit')}><IconButton onClick={() => { setEditUser(user); setDrawerOpen(true); }} size="small" sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: '12px', width: 38, height: 38 }}><Edit3 size={18} /></IconButton></Tooltip>
                                            <IconButton size="small" sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.04), borderRadius: '12px', width: 38, height: 38 }}><Trash2 size={18} /></IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <UserDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} user={editUser} t={t} />

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </Box>
    );
};

// --- STYLES ---
const fieldStyles = {
    mb: 1,
    '& .MuiInputLabel-root': {
        fontWeight: 700,
        fontSize: '0.85rem',
        color: 'text.secondary',
        '&.Mui-focused': { color: 'primary.main' }
    },
    '& .MuiOutlinedInput-root': {
        borderRadius: '16px',
        bgcolor: (theme) => theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.5) : '#ffffff',
        '& fieldset': {
            borderColor: (theme) => alpha(theme.palette.divider, 0.6),
            borderWidth: '1.5px'
        },
        '&:hover fieldset': {
            borderColor: (theme) => alpha(theme.palette.primary.main, 0.5)
        },
        '&.Mui-focused fieldset': {
            borderColor: 'primary.main',
            borderWidth: '2px'
        },
        '& input': { color: 'text.primary' }
    },
    '& .MuiSelect-select': {
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        color: 'text.primary'
    }
};

const menuItemStyles = {
    fontWeight: 600,
    fontSize: '0.9rem',
    mx: 1,
    my: 0.5,
    borderRadius: '10px',
    color: 'text.primary',
    '&.Mui-selected': {
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
        color: 'primary.main',
        '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12) }
    }
};

export default UsersPage;
