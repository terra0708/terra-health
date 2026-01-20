import React, { useState } from 'react';
import {
    Box, Typography, TextField, Button, IconButton, Stack,
    Paper, alpha, useTheme
} from '@mui/material';
import { Plus, Trash2, Edit2, Check, X, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const EditableList = ({
    items = [],
    onAdd,
    onUpdate,
    onDelete,
    title,
    placeholder,
    icon: Icon,
    color,
    showDate = true,
    showTime = false,
    emptyText,
    type = 'default'
}) => {
    const theme = useTheme();
    const { t, i18n } = useTranslation();
    const [newValue, setNewValue] = useState('');
    const [newTime, setNewTime] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    const [editTime, setEditTime] = useState('');

    const handleAdd = () => {
        if (!newValue.trim()) return;
        if (showTime && !newTime) return;

        onAdd({
            text: newValue,
            time: newTime,
            date: new Date().toLocaleString(i18n.language, { dateStyle: 'short', timeStyle: 'short' })
        });
        setNewValue('');
        setNewTime('');
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        setEditText(item.text);
        setEditTime(item.reminderTime || item.time || '');
    };

    const handleSaveEdit = () => {
        if (!editText.trim()) return;
        onUpdate(editingId, {
            text: editText,
            time: editTime,
            date: new Date().toLocaleString(i18n.language, { dateStyle: 'short', timeStyle: 'short' }) + ` (${t('common.edited', 'Düzenlendi')})`
        });
        setEditingId(null);
    };

    return (
        <Box>
            {title && (
                <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2, color: color || 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    {Icon && <Icon size={18} />}
                    {title}
                </Typography>
            )}

            <Stack direction="column" spacing={2} sx={{ mb: 3 }}>
                {showTime && (
                    <TextField
                        fullWidth
                        type="datetime-local"
                        size="small"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                )}
                <Stack direction="row" spacing={1}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder={placeholder}
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                        InputProps={{ sx: { borderRadius: '12px' } }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleAdd}
                        sx={{ borderRadius: '12px', minWidth: 48, bgcolor: color }}
                    >
                        <Plus size={20} />
                    </Button>
                </Stack>
            </Stack>

            <Stack spacing={1.5}>
                {Array.isArray(items) && items.length > 0 ? items.map((item) => (
                    <Paper
                        key={item.id}
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: '16px',
                            bgcolor: alpha(color || theme.palette.primary.main, 0.02),
                            border: `1px solid ${theme.palette.divider}`,
                            transition: 'all 0.2s ease',
                            '&:hover': { bgcolor: alpha(color || theme.palette.primary.main, 0.04) }
                        }}
                    >
                        {editingId === item.id ? (
                            <Box>
                                {showTime && (
                                    <TextField
                                        fullWidth type="datetime-local" size="small" value={editTime}
                                        onChange={(e) => setEditTime(e.target.value)}
                                        sx={{ mb: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                    />
                                )}
                                <TextField
                                    fullWidth multiline rows={2} size="small" value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    sx={{ mb: 1, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                />
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                    <IconButton size="small" onClick={() => setEditingId(null)} color="inherit"><X size={18} /></IconButton>
                                    <IconButton size="small" onClick={handleSaveEdit} color="primary"><Check size={18} /></IconButton>
                                </Stack>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Box sx={{ flex: 1, pr: 1 }}>
                                    {(item.reminderTime || item.time) && (
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: color || 'warning.main', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                            <Calendar size={12} />
                                            {item.reminderTime || item.time}
                                        </Typography>
                                    )}
                                    <Typography variant="body2" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>{item.text}</Typography>
                                    {showDate && <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.6 }}>{item.date}</Typography>}
                                </Box>
                                <Stack direction="row" spacing={0.5} sx={{ alignSelf: 'flex-start' }}>
                                    <IconButton size="small" color="primary" onClick={() => startEdit(item)}><Edit2 size={14} /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => onDelete(item.id)}><Trash2 size={14} /></IconButton>
                                </Stack>
                            </Box>
                        )}
                    </Paper>
                )) : (
                    <Box sx={{ py: 4, textAlign: 'center', opacity: 0.3 }}>
                        <Typography variant="body2" fontWeight={800}>{emptyText || t('common.no_items', 'Henüz öğe yok')}</Typography>
                    </Box>
                )}
            </Stack>
        </Box>
    );
};
