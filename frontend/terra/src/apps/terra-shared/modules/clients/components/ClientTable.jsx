import React from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Typography, Box, Tooltip, IconButton, Chip, alpha, useTheme
} from '@mui/material';
import { Info, Edit3, Trash2, UserCheck, Copy, Link as LinkIcon, Circle } from 'lucide-react';
import { formatLocaleDate, ALL_COUNTRIES } from '../data/countries';
import { MOCK_USERS } from '@shared/modules/users';

/**
 * Generic Client Table Component
 * 
 * Base client bilgilerini gösterir. Domain-specific detaylar (services, tags, status)
 * props olarak geçilir ve generic olarak gösterilir.
 */
const ClientTable = ({
    clients,
    onInfo,
    onEdit,
    onDelete,
    getStatus,
    getSource,
    settings, // Domain-specific settings (statuses, sources, services, tags)
    lang,
    t,
    i18n,
    // Optional: Domain-specific fields
    showServices = false,
    showTags = false,
    getService = null,
    getTag = null
}) => {
    const theme = useTheme();

    const getStatusChip = (statusValue) => {
        if (!getStatus) return null;
        const { label, color } = getStatus(statusValue);
        return (
            <Chip
                icon={<Circle size={8} fill="currentColor" />}
                label={label}
                size="small"
                sx={{
                    fontWeight: 800, borderRadius: '8px',
                    bgcolor: alpha(color, 0.08),
                    color: color,
                    border: `1px solid ${alpha(color, 0.2)}`,
                    fontSize: '0.65rem',
                    '& .MuiChip-icon': { color: 'inherit' }
                }}
            />
        );
    };

    return (
        <TableContainer>
            <Table sx={{ minWidth: 1200 }}>
                <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                        <TableCell sx={{ pl: 3, fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('clients.registration_date', 'Registration Date').toUpperCase()}</TableCell>
                        <TableCell sx={{ width: 60, fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('clients.country', 'Country').toUpperCase()}</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('clients.client', 'Client').toUpperCase()}</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('clients.consultant', 'Consultant').toUpperCase()}</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('clients.phone', 'Phone').toUpperCase()}</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('clients.source', 'Source').toUpperCase()}</TableCell>
                        {getStatus && <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('common.status', 'Status').toUpperCase()}</TableCell>}
                        {showServices && getService && <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('clients.services', 'Services').toUpperCase()}</TableCell>}
                        {showTags && getTag && <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('common.tags', 'Tags').toUpperCase()}</TableCell>}
                        <TableCell align="right" sx={{ pr: 3, fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>{t('common.actions', 'Actions').toUpperCase()}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {clients.map((c) => (
                        <TableRow key={c.id} hover>
                            <TableCell sx={{ pl: 3, whiteSpace: 'nowrap' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {formatLocaleDate(c.registrationDate, i18n.language)}
                                </Typography>
                            </TableCell>

                            <TableCell>
                                <Tooltip title={ALL_COUNTRIES.find(x => x.code === c.country)?.name || c.country}>
                                    <Box sx={{
                                        fontWeight: 700, bgcolor: alpha(theme.palette.divider, 0.5),
                                        width: 36, height: 26, borderRadius: '6px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: `1px solid ${theme.palette.divider}`
                                    }}>
                                        {c.country}
                                    </Box>
                                </Tooltip>
                            </TableCell>

                            <TableCell sx={{ maxWidth: 200 }}>
                                <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>{c.name}</Typography>
                            </TableCell>

                            <TableCell sx={{ maxWidth: 180 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <UserCheck size={14} color={theme.palette.text.disabled} />
                                    <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                                        {MOCK_USERS.find(u => u.id === c.assignedTo)?.name || '-'}
                                    </Typography>
                                </Box>
                            </TableCell>

                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{c.phone || '-'}</Typography>
                                    {c.phone && (
                                        <IconButton size="small" onClick={() => navigator.clipboard.writeText(c.phone)}>
                                            <Copy size={12} />
                                        </IconButton>
                                    )}
                                </Box>
                            </TableCell>

                            <TableCell>
                                {(() => {
                                    if (!getSource || !settings) return '-';
                                    const sourceVal = typeof c.source === 'object' ? c.source?.type : c.source;
                                    const sourceDef = settings.sources?.find(x => x.value === sourceVal);
                                    const sColor = sourceDef?.color || theme.palette.text.secondary;
                                    const sLabel = (lang === 'tr' ? sourceDef?.label_tr : (sourceDef?.label_en || sourceDef?.label_tr)) || sourceDef?.label;
                                    return (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                            <LinkIcon size={12} color={sColor} />
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: sColor }}>{sLabel || sourceVal || '-'}</Typography>
                                        </Box>
                                    );
                                })()}
                            </TableCell>

                            {getStatus && <TableCell>{getStatusChip(c.status)}</TableCell>}

                            {showServices && getService && (
                                <TableCell sx={{ maxWidth: 200 }}>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {c.services?.slice(0, 2).map((sName, i) => {
                                            const def = settings.services?.find(x => x.value === sName || x.name_tr === sName || x.name_en === sName);
                                            const sColor = def?.color || theme.palette.secondary.main;
                                            const finalLabel = def ? (lang === 'tr' ? def.name_tr : (def.name_en || def.name_tr)) : sName;
                                            return (
                                                <Chip key={i} label={finalLabel} size="small" sx={{
                                                    height: 22, fontSize: '0.65rem', fontWeight: 700,
                                                    bgcolor: alpha(sColor, 0.08), color: sColor, border: `1px solid ${alpha(sColor, 0.15)}`
                                                }} />
                                            );
                                        })}
                                        {c.services?.length > 2 && <Chip label={`+${c.services.length - 2}`} size="small" sx={{ height: 22, fontSize: '0.65rem' }} />}
                                    </Box>
                                </TableCell>
                            )}

                            {showTags && getTag && (
                                <TableCell sx={{ maxWidth: 180 }}>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {c.tags?.slice(0, 2).map((tLabel, i) => {
                                            const tagDef = settings.tags?.find(x => x.value === tLabel || x.label_tr === tLabel || x.label_en === tLabel);
                                            const tColor = tagDef?.color || theme.palette.text.secondary;
                                            const finalLabel = tagDef ? (lang === 'tr' ? tagDef.label_tr : (tagDef.label_en || tagDef.label_tr)) : tLabel;
                                            return (
                                                <Chip key={i} label={finalLabel} size="small" sx={{
                                                    height: 22, fontSize: '0.65rem', fontWeight: 700,
                                                    bgcolor: alpha(tColor, 0.08), color: tColor, border: `1px solid ${alpha(tColor, 0.1)}`
                                                }} />
                                            );
                                        })}
                                        {c.tags?.length > 2 && <Chip label={`+${c.tags.length - 2}`} size="small" sx={{ height: 22, fontSize: '0.65rem' }} />}
                                    </Box>
                                </TableCell>
                            )}

                            <TableCell align="right" sx={{ pr: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                    <IconButton size="small" onClick={() => onInfo(c)} sx={{ color: 'info.main', bgcolor: alpha(theme.palette.info.main, 0.08) }}><Info size={18} /></IconButton>
                                    <IconButton size="small" onClick={() => onEdit(c)} sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.08) }}><Edit3 size={18} /></IconButton>
                                    <IconButton size="small" onClick={() => onDelete(c.id)} sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.08) }}><Trash2 size={18} /></IconButton>
                                </Box>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default ClientTable;
export { ClientTable };
