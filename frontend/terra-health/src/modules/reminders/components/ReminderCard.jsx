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

    // Resolve Category & SubCategory
    const category = categories.find(c => c.id === reminder.categoryId) ||
        categories.find(c => c.id === 'customer') ||
        { label_tr: 'Genel', color: theme.palette.grey[500] };

    const subCategory = reminder.subCategoryId ? subCategories.find(s => s.id === reminder.subCategoryId) : null;

    // Resolve Status
    let status = statuses.find(s => s.id === reminder.statusId);
    if (!status) {
        status = reminder.isCompleted ? statuses.find(s => s.id === 'completed') : statuses.find(s => s.id === 'pending');
    }
    if (!status) status = { label_tr: '-', color: theme.palette.grey[400] };

    const getDisplayName = (item) => {
        if (!item) return '';
        return i18n.language === 'tr' ? item.label_tr : (item.label_en || item.label_tr);
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
                        borderColor: alpha(status.color, 0.5),
                        '& .action-buttons': { opacity: 1, transform: 'translateX(0)' }
                    }
                }}
            >
                {/* Left Accent Strip */}
                <Box sx={{ width: 6, bgcolor: isOverdue ? theme.palette.error.main : status.color }} />

                <Box sx={{ p: compact ? 2 : 2.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>

                    {/* Header: Status Icon, Title and Chips */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        {/* Status Change Button (Checkbox Style) */}
                        <Tooltip title={getDisplayName(status)}>
                            <Box
                                onClick={handleStatusMenuOpen}
                                sx={{
                                    minWidth: 28, height: 28,
                                    borderRadius: '50%',
                                    border: `2px solid ${status.color}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: onChangeStatus ? 'pointer' : 'default',
                                    transition: 'all 0.2s',
                                    bgcolor: reminder.isCompleted ? status.color : 'transparent',
                                    '&:hover': { bgcolor: onChangeStatus ? alpha(status.color, 0.1) : 'transparent' }
                                }}
                            >
                                {reminder.isCompleted && <CheckCircle2 size={16} color="#fff" strokeWidth={3} />}
                            </Box>
                        </Tooltip>

                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                                <Typography
                                    variant={compact ? "subtitle2" : "h6"}
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: compact ? '0.95rem' : '1.05rem',
                                        textDecoration: reminder.isCompleted ? 'line-through' : 'none',
                                        color: reminder.isCompleted ? 'text.secondary' : 'text.primary',
                                        cursor: onEdit ? 'pointer' : 'default',
                                        transition: 'color 0.2s',
                                        '&:hover': { color: onEdit ? theme.palette.primary.main : 'inherit' }
                                    }}
                                    onClick={() => onEdit && onEdit(reminder)}
                                >
                                    {reminder.title || reminder.text}
                                </Typography>

                                {/* Date & Time */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: compact ? 1 : 2, color: isOverdue ? 'error.main' : 'text.secondary', opacity: 0.8 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Calendar size={14} />
                                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                                            {isDateValid
                                                ? format(dateObj, 'd MMM yyyy', { locale: i18n.language.startsWith('tr') ? tr : enUS })
                                                : (reminder.date || '-')}
                                        </Typography>
                                    </Box>
                                    {!compact && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Clock size={14} />
                                            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                                                {reminder.time || '-'}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>

                            {/* Chips Row */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                                {isOverdue && (
                                    <Chip label={t('common.overdue')} size="small" color="error" icon={<AlertCircle size={10} />} sx={{ height: 20, fontWeight: 700, fontSize: '0.65rem' }} />
                                )}
                                <Chip
                                    label={getDisplayName(category)}
                                    size="small"
                                    sx={{
                                        height: 20, fontSize: '0.65rem', fontWeight: 700,
                                        bgcolor: alpha(category.color, 0.08), color: category.color,
                                        border: `1px solid ${alpha(category.color, 0.2)}`
                                    }}
                                />
                                {subCategory && (
                                    <Chip
                                        icon={<Tag size={10} />}
                                        label={getDisplayName(subCategory)}
                                        size="small"
                                        sx={{
                                            height: 20, fontSize: '0.65rem', fontWeight: 700,
                                            bgcolor: alpha(subCategory.color || '#999', 0.08),
                                            color: subCategory.color || '#666'
                                        }}
                                    />
                                )}
                                <Chip
                                    label={getDisplayName(status)}
                                    size="small"
                                    sx={{
                                        height: 20, fontSize: '0.65rem', fontWeight: 700,
                                        bgcolor: alpha(status.color, 0.08), color: status.color
                                    }}
                                />
                            </Box>

                            {/* Note / Description */}
                            {reminder.note && (
                                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5, mb: 1, display: '-webkit-box', WebkitLineClamp: compact ? 1 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '0.85rem' }}>
                                    {reminder.note}
                                </Typography>
                            )}

                        </Box>
                    </Box>

                    {!compact && <Divider sx={{ borderStyle: 'dashed' }} />}

                    {/* Footer: Customer Info and Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                        {/* Customer Information */}
                        {!hideCustomerInfo && reminder.type === 'customer' && reminder.customer ? (
                            <Box
                                onClick={() => onShowInfo && onShowInfo(reminder.customer)}
                                sx={{
                                    display: 'flex', alignItems: 'center', gap: 1,
                                    cursor: onShowInfo ? 'pointer' : 'default',
                                    p: 0.5, pr: 1.5, borderRadius: 2,
                                    transition: 'all 0.2s',
                                    '&:hover': { bgcolor: onShowInfo ? alpha(theme.palette.primary.main, 0.05) : 'transparent' }
                                }}
                            >
                                <Avatar
                                    src={reminder.customer.avatar}
                                    sx={{
                                        width: 24, height: 24,
                                        bgcolor: 'primary.main', fontSize: '0.75rem', fontWeight: 700
                                    }}
                                >
                                    {reminder.customer.name?.charAt(0)}
                                </Avatar>
                                <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', lineHeight: 1 }}>{reminder.customer.name}</Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.65rem' }}>{t('customers.customer')}</Typography>
                                </Box>
                                {onShowInfo && <Info size={14} color={theme.palette.primary.main} style={{ opacity: 0.6 }} />}
                            </Box>
                        ) : (
                            !compact && <Typography variant="caption" sx={{ fontStyle: 'italic', opacity: 0.5 }}>{t('reminders.personal_reminder', 'Kişisel Hatırlatıcı')}</Typography>
                        )}

                        {/* Action Buttons */}
                        <Box className="action-buttons" sx={{ display: 'flex', gap: 0.5, opacity: compact ? 1 : 0.6, transition: 'all 0.2s' }}>
                            {onEdit && (
                                <Tooltip title={t('common.edit')}>
                                    <IconButton size="small" onClick={() => onEdit(reminder)} sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) } }}>
                                        <Edit2 size={14} />
                                    </IconButton>
                                </Tooltip>
                            )}
                            {onDelete && (
                                <Tooltip title={t('common.delete')}>
                                    <IconButton size="small" onClick={() => onDelete(reminder)} sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) } }}>
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
