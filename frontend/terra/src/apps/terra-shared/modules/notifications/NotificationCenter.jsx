import React, { useState, useEffect } from 'react';
import {
    Box,
    IconButton,
    Badge,
    Popover,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Divider,
    Button,
    alpha,
    useTheme,
    Stack,
    Tooltip,
    keyframes
} from '@mui/material';
import { Bell, CheckCheck, Inbox, MessageSquare, Calendar, AlertCircle, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from './hooks/useNotificationStore';

// 5. Görsel Efekt (Bell Shake Animation)
const shake = keyframes`
  0% { transform: rotate(0deg); }
  10% { transform: rotate(15deg); }
  20% { transform: rotate(-15deg); }
  30% { transform: rotate(15deg); }
  40% { transform: rotate(-15deg); }
  50% { transform: rotate(10deg); }
  60% { transform: rotate(-10deg); }
  100% { transform: rotate(0deg); }
`;

const NotificationCenter = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [anchorEl, setAnchorEl] = useState(null);
    const [animating, setAnimating] = useState(false);
    const { notifications, markAsRead, markAllAsRead, getUnreadCount, requestPermission, permissionStatus } = useNotificationStore();

    const open = Boolean(anchorEl);
    const id = open ? 'notification-popover' : undefined;

    // Yeni bildirim geldiğinde animasyonu tetikle
    useEffect(() => {
        const handleNewNotif = () => {
            setAnimating(true);
            setTimeout(() => setAnimating(false), 1000);
        };
        window.addEventListener('new-notification', handleNewNotif);
        return () => window.removeEventListener('new-notification', handleNewNotif);
    }, []);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = (notification) => {
        markAsRead(notification.id);
        if (notification.link) navigate(notification.link);
        handleClose();
    };

    const getIcon = (type) => {
        switch (type) {
            case 'new_lead': return <Inbox size={18} />;
            case 'appointment': return <Calendar size={18} />;
            case 'system': return <AlertCircle size={18} />;
            case 'escalation': return <AlertCircle size={18} color={theme.palette.error.main} />;
            default: return <MessageSquare size={18} />;
        }
    };

    const getIconColor = (priority) => {
        switch (priority) {
            case 'high': return theme.palette.error.main;
            case 'medium': return theme.palette.warning.main;
            default: return theme.palette.primary.main;
        }
    };

    return (
        <Box>
            <Tooltip title={t('menu.notifications')}>
                <IconButton
                    aria-describedby={id}
                    onClick={handleClick}
                    sx={{
                        width: { xs: 36, sm: 42 },
                        height: { xs: 36, sm: 42 },
                        borderRadius: 2.5,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        color: 'primary.main',
                        transition: 'all 0.3s ease',
                        animation: animating ? `${shake} 0.5s ease-in-out` : 'none',
                        '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            transform: 'translateY(-2px)'
                        }
                    }}
                >
                    <Badge
                        badgeContent={getUnreadCount()}
                        color="error"
                        sx={{
                            '& .MuiBadge-badge': {
                                fontWeight: 800,
                                fontSize: '0.65rem',
                                border: `2px solid ${theme.palette.background.paper}`
                            }
                        }}
                    >
                        <Bell size={20} />
                    </Badge>
                </IconButton>
            </Tooltip>

            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                    sx: {
                        mt: 1.5,
                        width: 360,
                        maxHeight: 500,
                        borderRadius: '20px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                        border: `1px solid ${theme.palette.divider}`,
                        overflow: 'hidden'
                    }
                }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                    <Typography variant="subtitle1" fontWeight={900}>{t('menu.notifications')}</Typography>
                    <Stack direction="row" spacing={1}>
                        {permissionStatus === 'default' && (
                            <Tooltip title="Masaüstü Bildirimlerini Aç">
                                <IconButton size="small" onClick={requestPermission} sx={{ color: 'warning.main' }}>
                                    <Settings size={18} />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title={t('notifications.mark_all_read')}>
                            <IconButton size="small" onClick={markAllAsRead} sx={{ color: 'primary.main' }}>
                                <CheckCheck size={18} />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Box>
                <Divider />

                <List sx={{ p: 0, maxHeight: 380, overflow: 'auto' }}>
                    {notifications.length > 0 ? (
                        notifications.slice(0, 10).map((n) => (
                            <ListItem
                                key={n.id}
                                component="button"
                                onClick={() => handleNotificationClick(n)}
                                sx={{
                                    px: 2,
                                    py: 1.5,
                                    bgcolor: n.isRead ? 'transparent' : alpha(theme.palette.primary.main, 0.03),
                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
                                    transition: 'all 0.2s',
                                    width: '100%',
                                    textAlign: 'left',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: alpha(getIconColor(n.priority), 0.1), color: getIconColor(n.priority), width: 40, height: 40 }}>
                                        {getIcon(n.type)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={n.title}
                                    secondary={n.message}
                                    primaryTypographyProps={{ fontWeight: n.isRead ? 700 : 900, fontSize: '0.85rem' }}
                                    secondaryTypographyProps={{
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        sx: {
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }
                                    }}
                                />
                                {!n.isRead && (
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', ml: 1 }} />
                                )}
                            </ListItem>
                        ))
                    ) : (
                        <Box sx={{ p: 4, textAlign: 'center', opacity: 0.5 }}>
                            <Bell size={40} style={{ marginBottom: 8 }} />
                            <Typography variant="body2">{t('common.no_data')}</Typography>
                        </Box>
                    )}
                </List>

                <Divider />
                <Box sx={{ p: 1 }}>
                    <Button
                        fullWidth
                        onClick={() => { navigate('/notifications'); handleClose(); }}
                        sx={{ fontWeight: 800, borderRadius: '12px' }}
                    >
                        {t('common.actions')}
                    </Button>
                </Box>
            </Popover>
        </Box>
    );
};

export default NotificationCenter;
