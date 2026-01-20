import React from 'react';
import {
    Box, TextField, Button, Badge, IconButton, Collapse, Divider,
    Grid, FormControl, InputLabel, Select, OutlinedInput, MenuItem, Chip, Stack, alpha, useTheme
} from '@mui/material';
import { Search, Filter, ChevronDown, ChevronUp, RotateCcw, Tag as TagIcon } from 'lucide-react';
import { DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import { ALL_COUNTRIES } from '../data/countries';

/**
 * Generic Client Filters Component
 * 
 * Base client filtreleme için generic component. Domain-specific filtreler
 * (services, tags) optional olarak props ile geçilir.
 */
const ClientFilters = ({
    searchTerm, setSearchTerm,
    showFilters, setShowFilters,
    activeFilterCount,
    resetFilters,
    localFilters, setLocalFilters,
    applyFilters,
    settings, // Domain-specific settings
    lang,
    getStatus, getService, getSource, getTag,
    t,
    // Optional: Domain-specific filters
    showServices = false,
    showTags = false
}) => {
    const theme = useTheme();

    return (
        <Box>
            <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                    placeholder={t('common.search', 'Search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    InputProps={{ startAdornment: <Search size={18} style={{ marginRight: 8, opacity: 0.5 }} /> }}
                />
                <Badge badgeContent={activeFilterCount} color="primary" sx={{ '& .MuiBadge-badge': { fontWeight: 900 } }}>
                    <Button
                        variant={showFilters ? "contained" : "outlined"}
                        startIcon={<Filter size={18} />}
                        onClick={() => setShowFilters(!showFilters)}
                        endIcon={showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        sx={{ borderRadius: '12px', transition: 'all 0.3s' }}
                    >
                        {t('common.filters', 'Filters')}
                    </Button>
                </Badge>
                {(activeFilterCount > 0 || searchTerm) && (
                    <IconButton onClick={resetFilters} sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), color: 'error.main' }}>
                        <RotateCcw size={18} />
                    </IconButton>
                )}
            </Box>

            <Collapse in={showFilters}>
                <Divider />
                <Box sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.01) }}>
                    <Grid container spacing={3}>
                        {getStatus && settings?.statuses && (
                            <Grid item xs={12} sm={6} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ fontWeight: 700 }}>{t('common.status', 'Status')}</InputLabel>
                                    <Select
                                        multiple
                                        value={localFilters.status || []}
                                        onChange={(e) => setLocalFilters({ ...localFilters, status: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                                        input={<OutlinedInput label={t('common.status', 'Status')} sx={{ borderRadius: '12px' }} />}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => {
                                                    const s = getStatus(value);
                                                    return <Chip key={value} label={s?.label} size="small" />;
                                                })}
                                            </Box>
                                        )}
                                    >
                                        {settings.statuses.map(s => (
                                            <MenuItem key={s.id} value={s.value}>{lang === 'tr' ? s.label_tr : (s.label_en || s.label_tr)}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel sx={{ fontWeight: 700 }}>{t('clients.country', 'Country')}</InputLabel>
                                <Select
                                    multiple
                                    value={localFilters.country || []}
                                    onChange={(e) => setLocalFilters({ ...localFilters, country: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                                    input={<OutlinedInput label={t('clients.country', 'Country')} sx={{ borderRadius: '12px' }} />}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => (
                                                <Chip key={value} label={ALL_COUNTRIES.find(c => c.code === value)?.name || value} size="small" />
                                            ))}
                                        </Box>
                                    )}
                                >
                                    {ALL_COUNTRIES.map(c => (
                                        <MenuItem key={c.code} value={c.code}>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <span>{c.flag}</span> {c.name}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {getSource && settings?.sources && (
                            <Grid item xs={12} sm={6} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ fontWeight: 700 }}>{t('clients.source', 'Source')}</InputLabel>
                                    <Select
                                        multiple
                                        value={localFilters.source || []}
                                        onChange={(e) => setLocalFilters({ ...localFilters, source: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                                        input={<OutlinedInput label={t('clients.source', 'Source')} sx={{ borderRadius: '12px' }} />}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => {
                                                    const s = getSource(value);
                                                    return <Chip key={value} label={s?.label} size="small" />;
                                                })}
                                            </Box>
                                        )}
                                    >
                                        {settings.sources.map(s => (
                                            <MenuItem key={s.id} value={s.value}>{lang === 'tr' ? s.label_tr : (s.label_en || s.label_tr)}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        <Grid item xs={12} sm={6} md={3}>
                            <Stack direction="row" spacing={1} sx={{ height: '40px' }}>
                                <DatePicker
                                    label={t('common.start_date', 'Start Date')}
                                    value={localFilters.dateRange?.start ? new Date(localFilters.dateRange.start) : null}
                                    onChange={(newValue) => setLocalFilters({ ...localFilters, dateRange: { ...localFilters.dateRange, start: newValue ? format(newValue, 'yyyy-MM-dd') : '' } })}
                                    slotProps={{
                                        textField: {
                                            size: 'small',
                                            fullWidth: true,
                                            InputLabelProps: { shrink: true, sx: { fontWeight: 700 } },
                                            sx: { flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'background.paper' } }
                                        }
                                    }}
                                />
                                <DatePicker
                                    label={t('common.end_date', 'End Date')}
                                    value={localFilters.dateRange?.end ? new Date(localFilters.dateRange.end) : null}
                                    onChange={(newValue) => setLocalFilters({ ...localFilters, dateRange: { ...localFilters.dateRange, end: newValue ? format(newValue, 'yyyy-MM-dd') : '' } })}
                                    slotProps={{
                                        textField: {
                                            size: 'small',
                                            fullWidth: true,
                                            InputLabelProps: { shrink: true, sx: { fontWeight: 700 } },
                                            sx: { flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'background.paper' } }
                                        }
                                    }}
                                />
                            </Stack>
                        </Grid>

                        {showServices && getService && settings?.services && (
                            <Grid item xs={12} sm={6} md={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ fontWeight: 700 }}>{t('clients.services', 'Services')}</InputLabel>
                                    <Select
                                        multiple
                                        value={localFilters.services || []}
                                        onChange={(e) => setLocalFilters({ ...localFilters, services: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                                        input={<OutlinedInput label={t('clients.services', 'Services')} sx={{ borderRadius: '12px' }} />}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => (
                                                    <Chip key={value} label={getService(value).label} size="small" />
                                                ))}
                                            </Box>
                                        )}
                                    >
                                        {settings.services.map((s) => (
                                            <MenuItem key={s.id} value={s.name_tr}>
                                                {lang === 'tr' ? s.name_tr : (s.name_en || s.name_tr)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {showTags && getTag && settings?.tags && (
                            <Grid item xs={12} sm={6} md={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ fontWeight: 700 }}>{t('common.tags', 'Tags')}</InputLabel>
                                    <Select
                                        multiple
                                        value={localFilters.tags || []}
                                        onChange={(e) => setLocalFilters({ ...localFilters, tags: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                                        input={<OutlinedInput label={t('common.tags', 'Tags')} sx={{ borderRadius: '12px' }} />}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => (
                                                    <Chip key={value} label={value} size="small" />
                                                ))}
                                            </Box>
                                        )}
                                    >
                                        {settings.tags.map((tag) => (
                                            <MenuItem key={tag.id} value={tag.label_tr}>
                                                <TagIcon size={14} style={{ marginRight: 8 }} />
                                                {lang === 'tr' ? tag.label_tr : (tag.label_en || tag.label_tr)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                            <Button
                                variant="contained"
                                onClick={applyFilters}
                                sx={{
                                    borderRadius: '12px', px: 4, py: 1, fontWeight: 700, textTransform: 'none',
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
                                }}
                            >
                                {t('common.apply', 'Apply')}
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Collapse>
        </Box>
    );
};

export default ClientFilters;
export { ClientFilters };
