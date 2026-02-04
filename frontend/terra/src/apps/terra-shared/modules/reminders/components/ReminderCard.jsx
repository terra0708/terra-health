import React, { useState, memo } from 'react';
import {
    Box,
    Typography,
    Paper,
    IconButton,
    Chip,
    Avatar,
    Tooltip,
    Fade,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    alpha,
    useTheme
} from '@mui/material';
import {
    Calendar,
    Clock,
    CheckCircle2,
    Edit2,
    Trash2,
    Tag,
    Activity,
    Info,
    AlertCircle
} from 'lucide-react';
import { format, isPast, isValid } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

export const ReminderCard = memo(({
    reminder,
    onDelete,
    onEdit,
    onShowInfo,
    onChangeStatus,
    t,
    i18n,
    categories = [],
    subCategories = [],
    statuses = [],
    hideCustomerInfo = false,
    compact = false
}) => {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState(null);

    // Parse Date safely
    const dateObj = reminder.date ? new Date(`${reminder.date}T${reminder.time || '00:00'}`) : null;
    const isDateValid = dateObj && isValid(dateObj);
    const isOverdue = !reminder.isCompleted && isDateValid && isPast(dateObj);

    const category = categories.find(c => c.id === reminder.categoryId) ||
        categories.find(c => c.labelEn === 'Customer' || c.label_en === 'Customer' || c.id === 'customer') ||
        { labelTr: 'Genel', labelEn: 'General', color: theme.palette.grey[500] };

    const subCategory = reminder.subCategoryId ? subCategories.find(s => s.id === reminder.subCategoryId) : null;

    // Resolve Status
    let status = statuses.find(s => s.id === reminder.statusId);
    if (!status) {
        status = reminder.isCompleted
            ? statuses.find(s => s.value === 'completed' || s.id === 'completed')
            : statuses.find(s => s.value === 'pending' || s.id === 'pending');
    }
    if (!status) status = { labelTr: '-', labelEn: '-', color: theme.palette.grey[400] };

    const getDisplayName = (item) => {
        if (!item) return '';
        if (i18n.language === 'tr') return item.labelTr || item.label_tr || '';
        return item.labelEn || item.label_en || item.labelTr || item.label_tr || '';
    };

    const handleStatusMenuOpen = (event) => {
        if (!onChangeStatus) return;
        setAnchorEl(event.currentTarget);
    };

    const handleStatusMenuClose = () => setAnchorEl(null);

    const handleStatusSelect = (newStatusId) => {
        onChangeStatus(reminder, newStatusId);
        handleStatusMenuClose();
    };

    return (
        <Fade in={true} timeout={300}>
            <Paper
                elevation={0}
                sx={{
                    mb: compact ? 1.5 : 2,
                    p: 0,
                    borderRadius: compact ? '12px' : '16px',
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: 'background.paper',
                    transition: 'all 0.2s ease-in-out',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.08)',
                        borderColor: alpha(status.color, 0.3),
                        '& .action-buttons': { opacity: 1, transform: 'translateX(0)' }
                    }
                }}
            >
                {/* Left Accent Strip - More subtle */}
                <Box sx={{
                    width: 4,
                    bgcolor: isOverdue
                        ? theme.palette.error.main
                        : alpha(status.color || category.color, 0.6),
                    transition: 'background-color 0.2s'
                }} />

                <Box sx={{ p: compact ? 2 : 2.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.75 }}>

                    {/* Header: Status Icon, Title and Chips */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        {/* Status Change Button (Checkbox Style) */}
                        <Tooltip title={getDisplayName(status)}>
                            <Box
                                onClick={handleStatusMenuOpen}
                                sx={{
                                    minWidth: 28, height: 28,
                                    borderRadius: '50%',
                                    border: `2px solid ${alpha(status.color, 0.3)}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: onChangeStatus ? 'pointer' : 'default',
                                    transition: 'all 0.2s',
                                    bgcolor: reminder.isCompleted ? status.color : 'transparent',
                                    '&:hover': {
                                        bgcolor: onChangeStatus ? alpha(status.color, 0.1) : 'transparent',
                                        borderColor: status.color
                                    }
                                }}
                            >
                                {reminder.isCompleted && <CheckCircle2 size={16} color="#fff" strokeWidth={3} />}
                            </Box>
                        </Tooltip>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, gap: 1 }}>
                                <Typography
                                    variant={compact ? "subtitle2" : "h6"}
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: compact ? '0.95rem' : '1.05rem',
                                        textDecoration: reminder.isCompleted ? 'line-through' : 'none',
                                        color: reminder.isCompleted ? 'text.secondary' : 'text.primary',
                                        cursor: onEdit ? 'pointer' : 'default',
                                        transition: 'color 0.2s',
                                        flex: 1,
                                        '&:hover': { color: onEdit ? theme.palette.primary.main : 'inherit' }
                                    }}
                                    onClick={() => onEdit && onEdit(reminder)}
                                >
                                    {reminder.title || reminder.text}
                                </Typography>

                                {/* Date & Time - More subtle styling */}
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: compact ? 0.75 : 1.5,
                                    color: isOverdue ? 'error.main' : 'text.secondary',
                                    opacity: isOverdue ? 1 : 0.7,
                                    flexShrink: 0
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Calendar size={13} style={{ opacity: 0.7 }} />
                                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                                            {isDateValid
                                                ? format(dateObj, 'd MMM yyyy', { locale: i18n.language.startsWith('tr') ? tr : enUS })
                                                : (reminder.date || '-')}
                                        </Typography>
                                    </Box>
                                    {!compact && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Clock size={13} style={{ opacity: 0.7 }} />
                                            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                                                {reminder.time || '-'}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>

                            {/* Chips Row - Improved styling for better visual harmony */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
                                {isOverdue && (
                                    <Chip
                                        label={t('common.overdue')}
                                        size="small"
                                        icon={<AlertCircle size={11} />}
                                        sx={{
                                            height: 22,
                                            fontWeight: 600,
                                            fontSize: '0.7rem',
                                            bgcolor: alpha(theme.palette.error.main, 0.1),
                                            color: theme.palette.error.main,
                                            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                                        }}
                                    />
                                )}
                                <Chip
                                    label={getDisplayName(category)}
                                    size="small"
                                    sx={{
                                        height: 22,
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        bgcolor: alpha(category.color, 0.1),
                                        color: category.color,
                                        border: `1px solid ${alpha(category.color, 0.15)}`
                                    }}
                                />
                                {subCategory && (
                                    <Chip
                                        icon={<Tag size={11} />}
                                        label={getDisplayName(subCategory)}
                                        size="small"
                                        sx={{
                                            height: 22,
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            bgcolor: alpha(subCategory.color || category.color, 0.1),
                                            color: subCategory.color || category.color,
                                            border: `1px solid ${alpha(subCategory.color || category.color, 0.15)}`
                                        }}
                                    />
                                )}
                                <Chip
                                    label={getDisplayName(status)}
                                    size="small"
                                    sx={{
                                        height: 22,
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        bgcolor: alpha(status.color, 0.1),
                                        color: status.color,
                                        border: `1px solid ${alpha(status.color, 0.15)}`
                                    }}
                                />
                            </Box>

                            {/* Note / Description */}
                            {reminder.note && (
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: 'text.secondary',
                                        lineHeight: 1.6,
                                        mb: 0.5,
                                        display: '-webkit-box',
                                        WebkitLineClamp: compact ? 1 : 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        fontSize: '0.8rem',
                                        opacity: 0.8
                                    }}
                                >
                                    {reminder.note}
                                </Typography>
                            )}

                        </Box>
                    </Box>

                    {!compact && (
                        <Divider
                            sx={{
                                borderStyle: 'dashed',
                                borderColor: alpha(theme.palette.divider, 0.5),
                                my: 0.5
                            }}
                        />
                    )}

                    {/* Footer: Customer Info and Actions */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        pt: compact ? 0 : 0.5
                    }}>

                        {/* Customer Information - Improved styling */}
                        {!hideCustomerInfo && reminder.type === 'customer' && reminder.customer ? (
                            <Box
                                onClick={() => onShowInfo && onShowInfo(reminder.customer)}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.25,
                                    cursor: onShowInfo ? 'pointer' : 'default',
                                    p: 0.75,
                                    pr: 1.5,
                                    borderRadius: 2,
                                    transition: 'all 0.2s',
                                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                    '&:hover': {
                                        bgcolor: onShowInfo ? alpha(theme.palette.primary.main, 0.08) : alpha(theme.palette.primary.main, 0.04),
                                        borderColor: alpha(theme.palette.primary.main, 0.2)
                                    }
                                }}
                            >
                                <Avatar
                                    src={reminder.customer.avatar}
                                    sx={{
                                        width: 28,
                                        height: 28,
                                        bgcolor: theme.palette.primary.main,
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`
                                    }}
                                >
                                    {reminder.customer.name?.charAt(0)}
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontWeight: 700,
                                            display: 'block',
                                            lineHeight: 1.3,
                                            fontSize: '0.8rem',
                                            color: 'text.primary'
                                        }}
                                    >
                                        {reminder.customer.name}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: 'text.secondary',
                                            fontWeight: 500,
                                            fontSize: '0.7rem',
                                            opacity: 0.7
                                        }}
                                    >
                                        {t('customers.customer')}
                                    </Typography>
                                </Box>
                                {onShowInfo && (
                                    <Info
                                        size={14}
                                        color={theme.palette.primary.main}
                                        style={{ opacity: 0.5, flexShrink: 0 }}
                                    />
                                )}
                            </Box>
                        ) : (
                            !compact && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontStyle: 'italic',
                                        opacity: 0.5,
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    {t('reminders.personal_reminder', 'Kişisel Hatırlatıcı')}
                                </Typography>
                            )
                        )}

                        {/* Action Buttons - Improved styling */}
                        <Box
                            className="action-buttons"
                            sx={{
                                display: 'flex',
                                gap: 0.5,
                                opacity: compact ? 1 : 0.7,
                                transition: 'all 0.2s',
                                ml: 1
                            }}
                        >
                            {onEdit && (
                                <Tooltip title={t('common.edit')}>
                                    <IconButton
                                        size="small"
                                        onClick={() => onEdit(reminder)}
                                        sx={{
                                            color: 'primary.main',
                                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                                            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.primary.main, 0.15),
                                                borderColor: alpha(theme.palette.primary.main, 0.3),
                                                transform: 'scale(1.05)'
                                            },
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <Edit2 size={14} />
                                    </IconButton>
                                </Tooltip>
                            )}
                            {onDelete && (
                                <Tooltip title={t('common.delete')}>
                                    <IconButton
                                        size="small"
                                        onClick={() => onDelete(reminder)}
                                        sx={{
                                            color: 'error.main',
                                            bgcolor: alpha(theme.palette.error.main, 0.08),
                                            border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`,
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.error.main, 0.15),
                                                borderColor: alpha(theme.palette.error.main, 0.3),
                                                transform: 'scale(1.05)'
                                            },
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* Status Menu */}
                {onChangeStatus && (
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleStatusMenuClose}
                        PaperProps={{ sx: { borderRadius: 3, mt: 1, minWidth: 150 } }}
                    >
                        {statuses.map(s => (
                            <MenuItem key={s.id} onClick={() => handleStatusSelect(s.id)} selected={s.id === status.id}>
                                <ListItemIcon><Activity size={18} color={s.color} /></ListItemIcon>
                                <ListItemText primary={getDisplayName(s)} primaryTypographyProps={{ fontWeight: 600 }} />
                                {s.id === status.id && <CheckCircle2 size={16} color={theme.palette.success.main} />}
                            </MenuItem>
                        ))}
                    </Menu>
                )}
            </Paper>
        </Fade>
    );
});
