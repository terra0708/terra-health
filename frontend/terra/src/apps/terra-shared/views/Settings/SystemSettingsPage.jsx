import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Switch,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Button,
    alpha,
    useTheme,
    TextField,
    MenuItem,
    Avatar,
    Stack
} from '@mui/material';
import {
    Settings,
    Globe,
    Bell,
    Shield,
    Database,
    Languages,
    Moon,
    Sun,
    Save,
    Lock,
    Eye,
    EyeOff,
    Mail,
    Phone,
    User
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ModulePageWrapper } from '@common/ui';
import { usePerformance } from '@common/hooks';

const SettingSection = ({ title, icon: Icon, children }) => {
    const theme = useTheme();
    return (
        <Paper elevation={0} sx={{ p: 4, borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, height: '100%', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Box sx={{ p: 1.5, borderRadius: '16px', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex' }}>
                    <Icon size={24} />
                </Box>
                <Typography variant="h6" fontWeight={800}>{title}</Typography>
            </Box>
            {children}
        </Paper>
    );
};

const SystemSettingsPage = () => {
    usePerformance('SystemSettingsPage');
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const [isDarkMode, setIsDarkMode] = useState(theme.palette.mode === 'dark');

    const handleLanguageChange = (lang) => {
        i18n.changeLanguage(lang);
    };

    return (
        <ModulePageWrapper moduleName="Settings" aria-label="System Settings">
        <Box sx={{ animation: 'fadeIn 0.6s ease', pb: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.05em', mb: 1 }}>
                    {t('menu.system_settings')}
                </Typography>
                <Typography variant="body1" color="text.secondary" fontWeight={500}>
                    {t('settings.system_desc', 'Sistem genelindeki yapılandırmaları ve tercihleri buradan yönetin.')}
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Genel Ayarlar */}
                <Grid item xs={12} md={6}>
                    <SettingSection title={t('settings.general_settings', 'Genel Ayarlar')} icon={Globe}>
                        <List disablePadding>
                            <ListItem sx={{ px: 0, py: 2 }}>
                                <ListItemIcon><Languages size={20} /></ListItemIcon>
                                <ListItemText
                                    primary={t('common.language', 'Sistem Dili')}
                                    secondary={t('settings.lang_helper', 'Uygulama genelinde kullanılacak varsayılan dil')}
                                />
                                <TextField
                                    select
                                    size="small"
                                    value={i18n.language}
                                    onChange={(e) => handleLanguageChange(e.target.value)}
                                    sx={{ width: 120 }}
                                >
                                    <MenuItem value="tr">Türkçe</MenuItem>
                                    <MenuItem value="en">English</MenuItem>
                                </TextField>
                            </ListItem>
                            <Divider />
                            <ListItem sx={{ px: 0, py: 2 }}>
                                <ListItemIcon>{theme.palette.mode === 'dark' ? <Moon size={20} /> : <Sun size={20} />}</ListItemIcon>
                                <ListItemText
                                    primary={t('common.theme', 'Arayüz Teması')}
                                    secondary={t('settings.theme_helper', 'Koyu veya açık mod seçimi')}
                                />
                                <Switch checked={theme.palette.mode === 'dark'} />
                            </ListItem>
                        </List>
                    </SettingSection>
                </Grid>

                {/* Bildirim Ayarları */}
                <Grid item xs={12} md={6}>
                    <SettingSection title={t('menu.notifications')} icon={Bell}>
                        <List disablePadding>
                            <ListItem sx={{ px: 0, py: 1.5 }}>
                                <ListItemText primary={t('settings.push_notif', 'Tarayıcı Bildirimleri')} secondary={t('settings.push_desc', 'Web tarayıcısı üzerinden anlık bildirim al')} />
                                <Switch defaultChecked />
                            </ListItem>
                            <Divider />
                            <ListItem sx={{ px: 0, py: 1.5 }}>
                                <ListItemText primary={t('settings.email_notif', 'E-posta Bildirimleri')} secondary={t('settings.email_desc', 'Önemli olayları e-posta ile raporla')} />
                                <Switch defaultChecked />
                            </ListItem>
                            <Divider />
                            <ListItem sx={{ px: 0, py: 1.5 }}>
                                <ListItemText primary={t('settings.sound_notif', 'Bildirim Sesleri')} secondary={t('settings.sound_desc', 'Yeni bir bildirim geldiğinde ses çal')} />
                                <Switch defaultChecked />
                            </ListItem>
                        </List>
                    </SettingSection>
                </Grid>

                {/* Firma Bilgileri */}
                <Grid item xs={12} md={8}>
                    <SettingSection title={t('settings.company_info', 'Firma Bilgileri')} icon={Database}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label={t('settings.company_name', 'Firma Adı')} defaultValue="TERRA HEALTH CRM" variant="outlined" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label={t('settings.tax_id', 'Vergi Numarası')} defaultValue="9876543210" />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label={t('common.address')} multiline rows={2} defaultValue="Maslak Vergi Dairesi, İstanbul, Türkiye" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label={t('common.corporate_email')} defaultValue="info@terrahealth.com" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label={t('common.phone')} defaultValue="+90 212 123 45 67" />
                            </Grid>
                        </Grid>
                    </SettingSection>
                </Grid>

                {/* Güvenlik Ayarları */}
                <Grid item xs={12} md={4}>
                    <SettingSection title={t('common.security', 'Güvenlik')} icon={Shield}>
                        <Stack spacing={2}>
                            <Button variant="outlined" fullWidth startIcon={<Lock size={18} />} sx={{ borderRadius: 3, py: 1.5 }}>
                                {t('common.change_password', 'Şifre Değiştir')}
                            </Button>
                            <Button variant="outlined" fullWidth startIcon={<Database size={18} />} sx={{ borderRadius: 3, py: 1.5 }}>
                                {t('settings.backup_data', 'Verileri Yedekle')}
                            </Button>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="caption" color="text.secondary" textAlign="center">
                                {t('settings.last_backup', 'Son yedekleme: Bugün 14:30')}
                            </Typography>
                        </Stack>
                    </SettingSection>
                </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    startIcon={<Save size={20} />}
                    sx={{
                        borderRadius: '16px', px: 6, py: 1.8, fontWeight: 800,
                        boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}`
                    }}
                >
                    {t('common.save')}
                </Button>
            </Box>

            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </Box>
        </ModulePageWrapper>
    );
};

export default SystemSettingsPage;
