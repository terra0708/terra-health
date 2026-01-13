import React, { useState, memo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    InputAdornment,
    IconButton,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Divider,
    Checkbox,
    alpha,
    useTheme,
    Drawer,
    Tooltip,
    Tabs,
    Tab,
    Chip
} from '@mui/material';
import {
    Search,
    Plus,
    Shield,
    Lock,
    Save,
    Trash2,
    ChevronRight,
    CheckCircle2,
    Settings,
    Users,
    Calendar,
    HeartPulse,
    X,
    Palette,
    UserCircle,
    Layers
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// --- MOCK PERMISSIONS DATA ---
const PERMISSION_MODULES = [
    {
        id: 'customers',
        name: 'Müşteriler',
        icon: Users,
        permissions: [
            { id: 'view_customers', name: 'Görüntüleme', description: 'Müşteri listesini görebilir.' },
            { id: 'create_customers', name: 'Ekleme', description: 'Yeni müşteri kaydı açabilir.' },
            { id: 'edit_customers', name: 'Düzenleme', description: 'Mevcut müşteri bilgilerini değiştirebilir.' },
            { id: 'delete_customers', name: 'Silme', description: 'Müşteri kaydını silebilir.' }
        ]
    },
    {
        id: 'appointments',
        name: 'Randevular',
        icon: Calendar,
        permissions: [
            { id: 'view_appointments', name: 'Görüntüleme', description: 'Takvimi görebilir.' },
            { id: 'create_appointments', name: 'Oluşturma', description: 'Yeni randevu ekleyebilir.' },
            { id: 'edit_appointments', name: 'Düzenleme', description: 'Randevu bilgilerini güncelleyebilir.' },
            { id: 'cancel_appointments', name: 'İptal Etme', description: 'Randevuları iptal edebilir.' }
        ]
    },
    {
        id: 'analysis',
        name: 'Analizler',
        icon: HeartPulse,
        permissions: [
            { id: 'view_analysis', name: 'Görüntüleme', description: 'Laboratuvar sonuçlarını görebilir.' },
            { id: 'create_analysis', name: 'Ekleme', description: 'Analiz sonucu girebilir.' },
            { id: 'approve_analysis', name: 'Onaylama', description: 'Analiz sonuçlarını onaylayabilir.' }
        ]
    },
    {
        id: 'settings',
        name: 'Ayarlar',
        icon: Settings,
        permissions: [
            { id: 'view_settings', name: 'Görüntüleme', description: 'Sistem ayarlarını görebilir.' },
            { id: 'edit_settings', name: 'Düzenleme', description: 'Sistem genel ayarlarını değiştirebilir.' },
            { id: 'manage_users', name: 'Kullanıcı Yönetimi', description: 'Yetkileri ve kullanıcıları yönetebilir.' }
        ]
    }
];

const MOCK_PACKAGES = [
    { id: 1, name: 'Tam Yetkili (Admin)', permissions: ['view_customers', 'create_customers', 'edit_customers', 'delete_customers', 'view_appointments', 'create_appointments', 'edit_appointments', 'cancel_appointments', 'view_analysis', 'create_analysis', 'approve_analysis', 'view_settings', 'edit_settings', 'manage_users'], color: '#ef4444' },
    { id: 2, name: 'Doktor Paketi', permissions: ['view_customers', 'view_appointments', 'edit_appointments', 'view_analysis', 'create_analysis', 'approve_analysis'], color: '#8b5cf6' },
    { id: 3, name: 'Resepsiyon Paketi', permissions: ['view_customers', 'create_customers', 'view_appointments', 'create_appointments', 'cancel_appointments'], color: '#3b82f6' },
    { id: 4, name: 'Personel Paketi', permissions: ['view_customers', 'view_appointments'], color: '#10b981' },
];

const MOCK_ROLES = [
    { id: 1, name: 'Başhekim', description: 'Kurumun en yetkili tıbbi personeli.', packages: [1, 2], color: '#6366f1' },
    { id: 2, name: 'Uzman Doktor', description: 'Hasta takibi ve analiz yetkisine sahip doktorlar.', packages: [2], color: '#a855f7' },
    { id: 3, name: 'Hasta Kabul', description: 'Resepsiyon ve randevu süreçlerini yöneten personel.', packages: [3], color: '#0ea5e9' },
];

const COLORS = ['#ef4444', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#6366f1'];

const PermissionsPage = () => {
    const { t } = useTranslation();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [tabValue, setTabValue] = useState(0); // 0: Yetki Paketleri, 1: Roller
    const [selectedId, setSelectedId] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);

    // UI state for package/role
    const selectedItem = tabValue === 0
        ? MOCK_PACKAGES.find(p => p.id === selectedId) || MOCK_PACKAGES[0]
        : MOCK_ROLES.find(r => r.id === selectedId) || MOCK_ROLES[0];

    // Form state for creating new
    const [formData, setFormData] = useState({ name: '', description: '', color: COLORS[1] });

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setSelectedId(1); // Reset selected list item when tab changes
    };

    const handleTogglePermission = (permissionId) => {
        // Mock toggling Logic
        console.log("Toggle permission:", permissionId);
    };

    const handleTogglePackageInRole = (packageId) => {
        // Mock toggling logic
        console.log("Toggle package in role:", packageId);
    };

    return (
        <Box sx={{ animation: 'fadeIn 0.6s ease' }}>
            {/* ÜST BAŞLIK */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.05em', color: 'text.primary' }}>
                        {t('permissions.title')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {t('permissions.subtitle')}
                    </Typography>
                </Box>
                <Button
                    onClick={() => setDrawerOpen(true)}
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    sx={{
                        borderRadius: '16px', px: 3, py: 1.2, fontWeight: 800, textTransform: 'none',
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                    }}
                >
                    {tabValue === 0 ? t('permissions.add_package') : t('permissions.add_role')}
                </Button>
            </Box>

            {/* TAB SEÇİMİ */}
            <Paper elevation={0} sx={{
                borderRadius: '18px', p: 0.5, mb: 3, bgcolor: alpha(theme.palette.divider, 0.05), border: `1px solid ${theme.palette.divider}`,
                width: 'fit-content'
            }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    sx={{
                        minHeight: 40,
                        '& .MuiTabs-indicator': { display: 'none' },
                        '& .MuiTab-root': {
                            minHeight: 40, py: 1, px: 3, borderRadius: '14px', textTransform: 'none', fontWeight: 700, fontSize: '0.9rem', color: 'text.secondary',
                            transition: 'all 0.2s ease',
                            '&.Mui-selected': {
                                color: 'primary.main',
                                bgcolor: isDark ? 'background.paper' : '#ffffff',
                                boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.05)'
                            }
                        }
                    }}
                >
                    <Tab label={t('permissions.packages_tab')} icon={<Layers size={18} />} iconPosition="start" />
                    <Tab label={t('permissions.roles_tab')} icon={<UserCircle size={18} />} iconPosition="start" />
                </Tabs>
            </Paper>

            <Grid container spacing={3}>
                {/* SOL LİSTE */}
                <Grid item xs={12} md={4} lg={3}>
                    <Paper elevation={0} sx={{
                        borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, overflow: 'hidden', height: '100%',
                        bgcolor: 'background.paper', minHeight: '600px'
                    }}>
                        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                            <TextField
                                fullWidth placeholder={tabValue === 0 ? t('permissions.package_search') : t('permissions.role_search')} variant="standard"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment>,
                                    disableUnderline: true,
                                    sx: { px: 1, fontWeight: 600, color: 'text.primary' }
                                }}
                            />
                        </Box>
                        <List sx={{ p: 1 }}>
                            {(tabValue === 0 ? MOCK_PACKAGES : MOCK_ROLES)
                                .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map((item) => (
                                    <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                                        <ListItemButton
                                            selected={selectedId === item.id}
                                            onClick={() => setSelectedId(item.id)}
                                            sx={{
                                                borderRadius: '14px',
                                                py: 1.5,
                                                '&.Mui-selected': {
                                                    bgcolor: alpha(item.color || theme.palette.primary.main, 0.08),
                                                    color: item.color || theme.palette.primary.main,
                                                    '&:hover': { bgcolor: alpha(item.color || theme.palette.primary.main, 0.12) }
                                                }
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                                                {tabValue === 0 ? <Layers size={20} /> : <UserCircle size={20} />}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={item.name}
                                                primaryTypographyProps={{ fontWeight: 800, fontSize: '0.9rem' }}
                                            />
                                            <ChevronRight size={16} style={{ opacity: selectedId === item.id ? 1 : 0.3 }} />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                        </List>
                    </Paper>
                </Grid>

                {/* SAĞ DETAY */}
                <Grid item xs={12} md={8} lg={9}>
                    <Paper elevation={0} sx={{
                        borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, overflow: 'hidden',
                        bgcolor: 'background.paper', minHeight: '640px', display: 'flex', flexDirection: 'column'
                    }}>
                        {/* BAŞLIK */}
                        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: alpha(selectedItem.color, 0.02), borderBottom: `1px solid ${theme.palette.divider}` }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ p: 1.5, borderRadius: '14px', bgcolor: alpha(selectedItem.color, 0.1), color: selectedItem.color }}>
                                    {tabValue === 0 ? <Lock size={24} /> : <Shield size={24} />}
                                </Box>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary' }}>{selectedItem.name}</Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                        {tabValue === 0
                                            ? t('permissions.permission_count', { count: selectedItem.permissions.length })
                                            : t('permissions.package_count', { count: selectedItem.packages.length })}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                <Button
                                    variant="outlined" color="error" startIcon={<Trash2 size={18} />}
                                    sx={{ borderRadius: '14px', fontWeight: 700, textTransform: 'none' }}
                                >
                                    {t('common.delete')}
                                </Button>
                                <Button
                                    variant="contained" startIcon={<Save size={18} />}
                                    sx={{
                                        borderRadius: '14px', fontWeight: 800, textTransform: 'none', px: 3,
                                        bgcolor: selectedItem.color, '&:hover': { bgcolor: selectedItem.color, filter: 'brightness(0.9)' }
                                    }}
                                >
                                    {t('common.save')}
                                </Button>
                            </Box>
                        </Box>

                        {/* İÇERİK */}
                        <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto', maxHeight: '550px' }}>
                            {tabValue === 0 ? (
                                /* YETKİLER (TAB 0) */
                                <Grid container spacing={4}>
                                    {PERMISSION_MODULES.map((module) => (
                                        <Grid item xs={12} key={module.id}>
                                            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <module.icon size={20} color={theme.palette.primary.main} />
                                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>{module.name}</Typography>
                                                <Divider sx={{ flexGrow: 1, ml: 2, opacity: 0.5 }} />
                                            </Box>
                                            <Grid container spacing={2}>
                                                {module.permissions.map((perm) => (
                                                    <Grid item xs={12} sm={6} lg={4} key={perm.id}>
                                                        <PermissionCard
                                                            perm={perm}
                                                            selected={selectedItem.permissions.includes(perm.id)}
                                                            color={selectedItem.color}
                                                            onClick={() => handleTogglePermission(perm.id)}
                                                        />
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                /* ROLLER İÇİN PAKET ATAMA (TAB 1) */
                                <Box>
                                    <Box sx={{ mb: 4, p: 3, borderRadius: '20px', bgcolor: alpha(theme.palette.primary.main, 0.03), border: `1px dashed ${alpha(theme.palette.primary.main, isDark ? 0.3 : 0.2)}` }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>{t('permissions.role_description')}</Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{selectedItem.description}</Typography>
                                    </Box>

                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary' }}>
                                        <Layers size={20} /> {t('permissions.assigned_packages')}
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {MOCK_PACKAGES.map((pkg) => {
                                            const isAtanan = selectedItem.packages.includes(pkg.id);
                                            return (
                                                <Grid item xs={12} sm={6} key={pkg.id}>
                                                    <Paper
                                                        onClick={() => handleTogglePackageInRole(pkg.id)}
                                                        sx={{
                                                            p: 2.5, borderRadius: '18px', cursor: 'pointer', border: '2px solid',
                                                            borderColor: isAtanan ? pkg.color : theme.palette.divider,
                                                            bgcolor: isAtanan ? alpha(pkg.color, 0.04) : 'transparent',
                                                            transition: 'all 0.2s ease',
                                                            '&:hover': { transform: 'translateY(-3px)', boxShadow: isAtanan ? (isDark ? `0 10px 20px ${alpha('#000', 0.5)}` : `0 10px 20px ${alpha(pkg.color, 0.1)}`) : 'none' }
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: pkg.color }} />
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>{pkg.name}</Typography>
                                                            </Box>
                                                            <Checkbox checked={isAtanan} sx={{ color: pkg.color, '&.Mui-checked': { color: pkg.color } }} />
                                                        </Box>
                                                    </Paper>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* OLUŞTURMA DRAWER */}
            <CreateDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                type={tabValue === 0 ? 'package' : 'role'}
                formData={formData}
                setFormData={setFormData}
                theme={theme}
                t={t}
            />

            <style>{` @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } `}</style>
        </Box>
    );
};

// --- SUB-COMPONENTS ---
const PermissionCard = ({ perm, selected, color, onClick }) => (
    <Paper
        elevation={0}
        onClick={onClick}
        sx={{
            p: 2, borderRadius: '16px', border: '1.5px solid',
            borderColor: selected ? color : 'divider',
            bgcolor: selected ? alpha(color, 0.03) : 'transparent',
            cursor: 'pointer', transition: 'all 0.2s ease',
            '&:hover': { borderColor: selected ? color : alpha('#000', 0.1), transform: 'translateY(-2px)' }
        }}
    >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Checkbox checked={selected} sx={{ p: 0, '&.Mui-checked': { color: color } }} />
            <Box>
                <Typography variant="body2" sx={{ fontWeight: 800, color: selected ? 'text.primary' : 'text.secondary' }}>{perm.name}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', lineHeight: 1.2, display: 'block', mt: 0.5 }}>{perm.description}</Typography>
            </Box>
        </Box>
    </Paper>
);

const CreateDrawer = ({ open, onClose, type, formData, setFormData, theme, t }) => {
    const isDark = theme.palette.mode === 'dark';
    return (
        <Drawer
            anchor="right" open={open} onClose={onClose}
            PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, borderRadius: { xs: 0, sm: '24px 0 0 24px' }, overflow: 'hidden', bgcolor: 'background.paper' } }}
        >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
                <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: alpha(theme.palette.primary.main, isDark ? 0.05 : 0.02) }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary' }}>{type === 'package' ? t('permissions.new_package') : t('permissions.new_role')}</Typography>
                    <IconButton onClick={onClose} sx={{ color: 'text.primary' }}><X /></IconButton>
                </Box>
                <Divider />
                <Box sx={{ p: 3, flexGrow: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>{type === 'package' ? t('permissions.package_name') : t('permissions.role_name')}</Typography>
                    <TextField fullWidth placeholder={type === 'package' ? "Örn: Finans Paketi" : "Örn: Başhekim"} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} sx={drawerFieldStyles} />

                    {type === 'role' && (
                        <>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 3, mb: 1, color: 'text.primary' }}>{t('permissions.description')}</Typography>
                            <TextField fullWidth multiline rows={3} placeholder="Bu rolün görev tanımı..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} sx={drawerFieldStyles} />
                        </>
                    )}

                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 3, mb: 2, color: 'text.primary' }}>{t('permissions.visual_color')}</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                        {COLORS.map((c) => (
                            <Box
                                key={c} onClick={() => setFormData({ ...formData, color: c })}
                                sx={{
                                    width: 36, height: 36, borderRadius: '50%', bgcolor: c, cursor: 'pointer',
                                    border: `3px solid ${formData.color === c ? alpha(c, 0.3) : 'transparent'}`,
                                    outline: formData.color === c ? `2px solid ${c}` : 'none',
                                    transition: 'all 0.2s ease', '&:hover': { transform: 'scale(1.1)' }
                                }}
                            />
                        ))}
                    </Box>
                </Box>
                <Box sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 2, bgcolor: 'background.paper' }}>
                    <Button fullWidth variant="outlined" onClick={onClose} sx={{ borderRadius: '12px', py: 1.5, color: 'text.primary', borderColor: 'divider' }}>{t('common.cancel')}</Button>
                    <Button fullWidth variant="contained" sx={{ borderRadius: '12px', py: 1.5, fontWeight: 800, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)` }}>{t('permissions.add_package')}</Button>
                </Box>
            </Box>
        </Drawer>
    )
};

const drawerFieldStyles = {
    mb: 2,
    '& .MuiOutlinedInput-root': {
        borderRadius: '12px',
        bgcolor: (theme) => theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.5) : '#f8fafc',
        '& fieldset': { borderColor: (theme) => alpha(theme.palette.divider, 0.6) },
        '&.Mui-focused fieldset': { borderColor: 'primary.main' },
        '& input, & textarea': { color: 'text.primary' }
    }
};

export default PermissionsPage;
