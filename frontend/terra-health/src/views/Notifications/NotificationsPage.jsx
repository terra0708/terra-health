import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Card,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    IconButton,
    Button,
    Stack,
    Chip,
    alpha,
    useTheme,
    Divider,
    FormControl,
    Select,
    MenuItem,
    InputLabel
} from '@mui/material';
import {
    Bell,
    Trash2,
    CheckCheck,
    Inbox,
    Calendar,
    AlertCircle,
    MessageSquare,
    Filter,
    ChevronRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '../../modules/notifications/hooks/useNotificationStore';
import { useNavigate } from 'react-router-dom';

const NotificationsPage = () => {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const navigate = useNavigate();
    const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();

    const [filter, setFilter] = useState('all');

    const filteredNotifications = useMemo(() => {
        if (filter === 'all') return notifications;
        if (filter === 'unread') return notifications.filter(n => !n.isRead);
        return notifications.filter(n => n.type === filter);
    }, [notifications, filter]);

    const getIcon = (type) => {
        switch (type) {
            case 'new_lead': return <Inbox size={20} />;
            case 'appointment': return <Calendar size={20} />;
            case 'system': return <AlertCircle size={20} />;
            default: return <MessageSquare size={20} />;
        }
    };

    const getIconColor = (priority) => {
        switch (priority) {
            case 'high': return theme.palette.error.main;
            case 'medium': return theme.palette.warning.main;
            default: return theme.palette.primary.main;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const isTurkish = i18n.language.startsWith('tr');
        return date.toLocaleDateString(isTurkish ? 'tr-TR' : 'en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }) + ' ' + date.toLocaleTimeString(isTurkish ? 'tr-TR' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: !isTurkish
        });
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, animation: 'fadeIn 0.6s ease' }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight={900} sx={{
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        {t('menu.notifications')}
                    </Typography>
                    <Typography color="text.secondary" variant="body1" sx={{ fontWeight: 500 }}>
                        {t('notifications.title')}
                    </Typography>
                </Box>

                <Stack direction="row" spacing={2}>
                    <Button
                        variant="outlined"
                        startIcon={<CheckCheck size={18} />}
                        onClick={markAllAsRead}
                        sx={{ borderRadius: 3, fontWeight: 700 }}
                    >
                        {t('notifications.mark_all_read')}
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<Trash2 size={18} />}
                        onClick={clearAll}
                        sx={{ borderRadius: 3, fontWeight: 800 }}
                    >
                        {t('notifications.clear_all')}
                    </Button>
                </Stack>
            </Box>

            <Card sx={{ mb: 3, p: 2, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.paper, 0.6) }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>{t('notifications.filter')}</InputLabel>
                        <Select
                            value={filter}
                            label={t('notifications.filter')}
                            onChange={(e) => setFilter(e.target.value)}
                            sx={{ borderRadius: 3 }}
                            startAdornment={<Filter size={18} style={{ marginRight: 8, opacity: 0.5 }} />}
                        >
                            <MenuItem value="all">{t('notifications.all_notifications')}</MenuItem>
                            <MenuItem value="unread">{t('notifications.unread_only')}</MenuItem>
                            <MenuItem value="new_lead">{t('notifications.new_leads')}</MenuItem>
                            <MenuItem value="appointment">{t('notifications.appointments')}</MenuItem>
                            <MenuItem value="system">{t('notifications.system')}</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </Card>

            <Card sx={{ borderRadius: 5, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
                <List sx={{ p: 0 }}>
                    {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((n, index) => (
                            <React.Fragment key={n.id}>
                                <ListItem
                                    sx={{
                                        px: 3,
                                        py: 2.5,
                                        bgcolor: n.isRead ? 'transparent' : alpha(theme.palette.primary.main, 0.02),
                                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                                        transition: 'all 0.2s',
                                        borderLeft: n.isRead ? 'none' : `4px solid ${getIconColor(n.priority)}`,
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                        markAsRead(n.id);
                                        if (n.link) navigate(n.link);
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{
                                            bgcolor: alpha(getIconColor(n.priority), 0.1),
                                            color: getIconColor(n.priority),
                                            width: 48,
                                            height: 48,
                                            borderRadius: 2.5
                                        }}>
                                            {getIcon(n.type)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Typography variant="subtitle1" fontWeight={n.isRead ? 700 : 900}>
                                                    {n.title}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                    {formatDate(n.createdAt)}
                                                </Typography>
                                            </Stack>
                                        }
                                        secondary={
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
                                                {n.message}
                                            </Typography>
                                        }
                                    />
                                    <IconButton size="small" sx={{ ml: 2, color: 'text.disabled' }}>
                                        <ChevronRight size={20} />
                                    </IconButton>
                                </ListItem>
                                {index < filteredNotifications.length - 1 && <Divider />}
                            </React.Fragment>
                        ))
                    ) : (
                        <Box sx={{ py: 12, textAlign: 'center', opacity: 0.5 }}>
                            <Bell size={64} style={{ marginBottom: 16 }} />
                            <Typography variant="h6" fontWeight={800}>{t('notifications.no_notifications')}</Typography>
                        </Box>
                    )}
                </List>
            </Card>

            <style>{`
                @keyframes fadeIn { 
                    from { opacity: 0; transform: translateY(10px); } 
                    to { opacity: 1; transform: translateY(0); } 
                }
            `}</style>
        </Box>
    );
};

export default NotificationsPage;
