import React, { useMemo } from 'react';
import {
    Box,
    Grid,
    Card,
    Typography,
    Button,
    Stack,
    Avatar,
    Chip,
    alpha,
    useTheme,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Divider,
    IconButton,
    LinearProgress
} from '@mui/material';
import {
    Users,
    Calendar,
    TrendingUp,
    Bell,
    DollarSign,
    UserPlus,
    CalendarPlus,
    BarChart3,
    Clock,
    ArrowRight,
    ChevronRight,
    Target,
    Zap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '@terra-health/modules/customers';
import { useAppointmentStore } from '@terra-health/modules/appointments/hooks/useAppointmentStore';
import { useReminderStore } from '@shared/modules/reminders';
import { useMarketingStore } from '@terra-ads/modules/marketing/hooks/useMarketingStore';
import { useNotificationStore } from '@shared/modules/notifications/hooks/useNotificationStore';
import { format, isToday, isTomorrow, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

const DashboardPage = () => {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const navigate = useNavigate();
    const { customers } = useCustomers();
    const { appointments } = useAppointmentStore();
    const { reminders } = useReminderStore();
    const { campaigns } = useMarketingStore();
    const { notifications, getUnreadCount } = useNotificationStore();

    // Calculate metrics
    const metrics = useMemo(() => {
        const now = new Date();

        // Customer stats by status
        const statusCounts = customers.reduce((acc, c) => {
            acc[c.status] = (acc[c.status] || 0) + 1;
            return acc;
        }, {});

        // Today's appointments
        const todaysAppointments = appointments.filter(a => isToday(new Date(a.start)));

        // Tomorrow's appointments
        const tomorrowsAppointments = appointments.filter(a => isTomorrow(new Date(a.start)));

        // Unread notifications
        const unreadNotifications = getUnreadCount();

        // Today's reminders
        const todaysReminders = reminders.filter(r =>
            !r.isCompleted &&
            r.date === now.toISOString().split('T')[0]
        );

        // Recent customers (last 5)
        const recentCustomers = [...customers]
            .sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate))
            .slice(0, 5);

        // Upcoming appointments (next 3 today)
        const upcomingAppointments = todaysAppointments
            .filter(a => new Date(a.start) > now)
            .sort((a, b) => new Date(a.start) - new Date(b.start))
            .slice(0, 3);

        // Top sources
        const sourceCounts = customers.reduce((acc, c) => {
            const sourceKey = typeof c.source === 'object' ? c.source?.type : c.source;
            const source = sourceKey || 'other';
            acc[source] = (acc[source] || 0) + 1;
            return acc;
        }, {});
        const topSources = Object.entries(sourceCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        const activeCampaignsCount = campaigns.filter(c => c.status === 'active').length;

        return {
            totalCustomers: customers.length,
            statusCounts,
            todaysAppointments: todaysAppointments.length,
            tomorrowsAppointments: tomorrowsAppointments.length,
            unreadNotifications,
            todaysReminders,
            recentCustomers,
            upcomingAppointments,
            topSources,
            activeCampaignsCount
        };
    }, [customers, appointments, reminders, campaigns, getUnreadCount]);

    const getTimeAgo = (date) => {
        const now = new Date();
        const past = new Date(date);
        const minutes = differenceInMinutes(now, past);
        const hours = differenceInHours(now, past);
        const days = differenceInDays(now, past);

        if (minutes < 1) return t('dashboard.just_now');
        if (minutes < 60) return `${minutes} ${t('dashboard.minutes_ago')}`;
        if (hours < 24) return `${hours} ${t('dashboard.hours_ago')}`;
        return `${days} ${i18n.language.startsWith('tr') ? 'gün önce' : 'days ago'}`;
    };

    const StatCard = ({ icon: Icon, title, value, subtitle, color, onClick }) => (
        <Card
            onClick={onClick}
            sx={{
                p: 3,
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                    borderColor: color,
                    boxShadow: `0 4px 12px ${alpha(color, 0.15)}`
                }
            }}
        >
            <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: alpha(color, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: color
                    }}>
                        <Icon size={24} />
                    </Box>
                    <ArrowRight size={20} color={theme.palette.text.disabled} />
                </Box>
                <Box>
                    <Typography variant="h3" fontWeight={800} color={color} sx={{ mb: 0.5 }}>
                        {value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                            {subtitle}
                        </Typography>
                    )}
                </Box>
            </Stack>
        </Card>
    );

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ mb: 0.5 }}>
                    {t('dashboard.welcome')}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {format(new Date(), i18n.language.startsWith('tr') ? 'dd MMMM yyyy, EEEE' : 'EEEE, MMMM dd, yyyy', { locale: i18n.language.startsWith('tr') ? tr : enUS })}
                </Typography>
            </Box>

            {/* Main Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        icon={Users}
                        title={t('customers.customers')}
                        value={metrics.totalCustomers}
                        subtitle={`${metrics.statusCounts.pending || 0} ${i18n.language.startsWith('tr') ? 'beklemede' : 'pending'}`}
                        color={theme.palette.primary.main}
                        onClick={() => navigate('/customers')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        icon={Calendar}
                        title={t('dashboard.todays_appointments')}
                        value={metrics.todaysAppointments}
                        subtitle={`${metrics.tomorrowsAppointments} ${i18n.language.startsWith('tr') ? 'yarın' : 'tomorrow'}`}
                        color="#6366f1"
                        onClick={() => navigate('/appointments')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        icon={Clock}
                        title={t('dashboard.todays_reminders')}
                        value={metrics.todaysReminders.length}
                        subtitle={i18n.language.startsWith('tr') ? 'hatırlatıcı var' : 'reminders'}
                        color="#8b5cf6"
                        onClick={() => navigate('/reminders')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        icon={BarChart3}
                        title={t('menu.marketing')}
                        value={i18n.language.startsWith('tr') ? 'Aktif' : 'Active'}
                        subtitle={i18n.language.startsWith('tr') ? 'Performansı gör' : 'View performance'}
                        color="#10b981"
                        onClick={() => navigate('/marketing/dashboard')}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Quick Actions */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ p: 3, height: '100%', border: `1px solid ${theme.palette.divider}` }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>
                            {t('dashboard.quick_actions')}
                        </Typography>
                        <Stack spacing={1.5}>
                            <Button
                                onClick={() => navigate('/customers')}
                                variant="outlined"
                                startIcon={<UserPlus size={18} />}
                                sx={{
                                    justifyContent: 'flex-start',
                                    py: 1.5,
                                    borderRadius: 2,
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    borderColor: theme.palette.divider,
                                    color: 'text.primary',
                                    '&:hover': {
                                        borderColor: theme.palette.primary.main,
                                        bgcolor: alpha(theme.palette.primary.main, 0.04)
                                    }
                                }}
                            >
                                {t('dashboard.add_customer')}
                            </Button>
                            <Button
                                onClick={() => navigate('/appointments')}
                                variant="outlined"
                                startIcon={<CalendarPlus size={18} />}
                                sx={{
                                    justifyContent: 'flex-start',
                                    py: 1.5,
                                    borderRadius: 2,
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    borderColor: theme.palette.divider,
                                    color: 'text.primary',
                                    '&:hover': {
                                        borderColor: theme.palette.primary.main,
                                        bgcolor: alpha(theme.palette.primary.main, 0.04)
                                    }
                                }}
                            >
                                {t('dashboard.create_appointment')}
                            </Button>
                            <Button
                                onClick={() => navigate('/ads')}
                                variant="outlined"
                                startIcon={<BarChart3 size={18} />}
                                sx={{
                                    justifyContent: 'flex-start',
                                    py: 1.5,
                                    borderRadius: 2,
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    borderColor: theme.palette.divider,
                                    color: 'text.primary',
                                    '&:hover': {
                                        borderColor: theme.palette.primary.main,
                                        bgcolor: alpha(theme.palette.primary.main, 0.04)
                                    }
                                }}
                            >
                                {t('dashboard.ad_performance')}
                            </Button>
                        </Stack>
                    </Card>
                </Grid>

                {/* Recent Customers */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ p: 3, height: '100%', border: `1px solid ${theme.palette.divider}` }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" fontWeight={700}>
                                {t('dashboard.recent_customers')}
                            </Typography>
                            <IconButton size="small" onClick={() => navigate('/customers')}>
                                <ChevronRight size={20} />
                            </IconButton>
                        </Box>
                        <List sx={{ p: 0 }}>
                            {metrics.recentCustomers.length > 0 ? (
                                metrics.recentCustomers.map((customer, idx) => (
                                    <React.Fragment key={customer.id}>
                                        {idx > 0 && <Divider sx={{ my: 1 }} />}
                                        <ListItem
                                            sx={{
                                                px: 0,
                                                py: 1,
                                                cursor: 'pointer',
                                                borderRadius: 1,
                                                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) }
                                            }}
                                            onClick={() => navigate('/customers')}
                                        >
                                            <ListItemAvatar>
                                                <Avatar sx={{
                                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                    color: theme.palette.primary.main,
                                                    fontWeight: 700,
                                                    fontSize: '0.9rem'
                                                }}>
                                                    {customer.name.charAt(0)}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {customer.name}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Typography variant="caption" color="text.secondary">
                                                        {getTimeAgo(customer.registrationDate)}
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                    </React.Fragment>
                                ))
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                    {t('dashboard.no_data')}
                                </Typography>
                            )}
                        </List>
                    </Card>
                </Grid>

                {/* Customer Sources */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ p: 3, height: '100%', border: `1px solid ${theme.palette.divider}` }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>
                            {t('dashboard.top_source')}
                        </Typography>
                        <Stack spacing={2}>
                            {metrics.topSources.map(([source, count], idx) => {
                                const percentage = ((count / metrics.totalCustomers) * 100).toFixed(0);
                                return (
                                    <Box key={source}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" fontWeight={600}>
                                                {source}
                                            </Typography>
                                            <Typography variant="body2" fontWeight={700} color="primary.main">
                                                {count}
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={parseInt(percentage)}
                                            sx={{
                                                height: 6,
                                                borderRadius: 3,
                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                '& .MuiLinearProgress-bar': {
                                                    borderRadius: 3,
                                                    bgcolor: theme.palette.primary.main
                                                }
                                            }}
                                        />
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                            {percentage}% {i18n.language.startsWith('tr') ? 'toplam' : 'of total'}
                                        </Typography>
                                    </Box>
                                );
                            })}
                            {metrics.topSources.length === 0 && (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                    {t('dashboard.no_data')}
                                </Typography>
                            )}
                        </Stack>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPage;
