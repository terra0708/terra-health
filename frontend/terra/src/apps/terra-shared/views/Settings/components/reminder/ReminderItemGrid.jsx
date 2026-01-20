import React from 'react';
import { Box, Typography, Paper, Grid, IconButton, Tooltip, alpha, useTheme } from '@mui/material';
import { Edit2, Trash2, Layers, AlertTriangle, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Grid view for displaying reminder items
 */
export const ReminderItemGrid = ({ items, activeTab, onEdit, onDelete, getDisplayName }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    if (!items || items.length === 0) {
        return (
            <Grid item xs={12}>
                <Box sx={{ py: 8, textAlign: 'center', opacity: 0.5 }}>
                    <Layers size={48} style={{ marginBottom: 16 }} />
                    <Typography variant="h6" fontWeight={700}>{t('common.no_data')}</Typography>
                </Box>
            </Grid>
        );
    }

    return (
        <>
            {items.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2.5,
                            borderRadius: '20px',
                            border: `1px solid ${theme.palette.divider}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: alpha(theme.palette.background.default, 0.5),
                            '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.03),
                                borderColor: theme.palette.primary.main,
                                transform: 'translateY(-4px)',
                                boxShadow: `0 10px 20px ${alpha(theme.palette.common.black, 0.05)}`,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                                width: 48,
                                height: 48,
                                borderRadius: '16px',
                                bgcolor: alpha(item.color || '#ccc', 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `2px solid ${alpha(item.color || '#ccc', 0.2)}`
                            }}>
                                <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: item.color, boxShadow: `0 0 10px ${item.color}` }} />
                            </Box>
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{getDisplayName(item)}</Typography>

                                {/* Sadece "Durum" kategorisi için isCompleted gösterimi */}
                                {item.isCompleted !== undefined && (activeTab?.paramTypeId === 'static_category_status' || activeTab?.label_tr === 'Durum' || activeTab?.label_en === 'Status') && (
                                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                        {item.isCompleted ?
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main', fontSize: '0.7rem', fontWeight: 800 }}>
                                                <AlertTriangle size={10} style={{ transform: 'rotate(180deg)' }} /> BİTİRİR
                                            </Box>
                                            :
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'warning.main', fontSize: '0.7rem', fontWeight: 800 }}>
                                                <Activity size={10} /> SÜRDÜRÜR
                                            </Box>
                                        }
                                    </Box>
                                )}

                                {/* Kategori adını göster */}
                                {activeTab && (
                                    <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.5, display: 'block', mt: 0.5 }}>
                                        {(activeTab.label_tr || activeTab.label || '').toUpperCase()}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {/* Default öğeler için edit butonu gösterilmez */}
                            {!item.isDefault && (
                                <Tooltip title={t('common.edit')}>
                                    <IconButton size="small" onClick={() => onEdit(item)} sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) } }}><Edit2 size={16} /></IconButton>
                                </Tooltip>
                            )}
                            {/* Default öğeler ve sistem öğeleri silinemez */}
                            {item.type !== 'system' && !item.isDefault && (
                                <Tooltip title={t('common.delete')}>
                                    <IconButton size="small" onClick={() => onDelete(item)} sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.15) } }}><Trash2 size={16} /></IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    </Paper>
                </Grid>
            ))}
        </>
    );
};
