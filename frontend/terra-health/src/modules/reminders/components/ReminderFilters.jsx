import React from 'react';
import {
    Box, TextField, Badge, Button, IconButton, Collapse, Divider, Grid,
    FormControl, InputLabel, Select, OutlinedInput, MenuItem, Chip, Stack, alpha, useTheme
} from '@mui/material';
import { Search, Filter, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import { DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';

const ReminderFilters = ({
    searchQuery, setSearchQuery,
    activeFilterCount,
    showFilters, setShowFilters,
    resetFilters,
    localFilters, setLocalFilters,
    applyFilters,
    statuses, categories, subCategories,
    getDisplayName,
    t
}) => {
    const theme = useTheme();

    return (
        <Box>
            <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                    placeholder={t('common.search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                        sx={{ borderRadius: '12px', transition: 'all 0.3s', whiteSpace: 'nowrap' }}
                    >
                        {t('common.filters')}
                    </Button>
                </Badge>
                {(activeFilterCount > 0 || searchQuery) && (
                    <IconButton onClick={resetFilters} sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), color: 'error.main' }}>
                        <RotateCcw size={18} />
                    </IconButton>
                )}
            </Box>

            <Collapse in={showFilters}>
                <Divider />
                <Box sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.01) }}>
                    <Grid container spacing={3}>
                        {/* Status */}
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel sx={{ fontWeight: 700 }}>{t('common.status')}</InputLabel>
                                <Select
                                    multiple
                                    value={localFilters.status}
                                    onChange={(e) => setLocalFilters({ ...localFilters, status: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                                    input={<OutlinedInput label={t('common.status')} sx={{ borderRadius: '12px' }} />}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => {
                                                const stat = statuses.find(s => s.id === value) || { label_tr: value, color: '#999' };
                                                return (
                                                    <Chip
                                                        key={value} label={getDisplayName(stat)} size="small"
                                                        sx={{ borderRadius: '8px', fontWeight: 700, bgcolor: alpha(stat.color, 0.1), color: stat.color }}
                                                    />
                                                );
                                            })}
                                        </Box>
                                    )}
                                >
                                    {statuses.map(s => <MenuItem key={s.id} value={s.id}>{getDisplayName(s)}</MenuItem>)}
                                    <MenuItem value="overdue">{t('common.overdue')}</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Category */}
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel sx={{ fontWeight: 700 }}>{t('common.category')}</InputLabel>
                                <Select
                                    multiple
                                    value={localFilters.category}
                                    onChange={(e) => setLocalFilters({ ...localFilters, category: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                                    input={<OutlinedInput label={t('common.category')} sx={{ borderRadius: '12px' }} />}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => {
                                                const cat = categories.find(c => c.id === value);
                                                return (
                                                    <Chip
                                                        key={value} label={getDisplayName(cat)} size="small"
                                                        sx={{ borderRadius: '8px', fontWeight: 700, bgcolor: alpha(cat?.color || '#999', 0.1), color: cat?.color || '#666' }}
                                                    />
                                                );
                                            })}
                                        </Box>
                                    )}
                                >
                                    {categories.map(c => <MenuItem key={c.id} value={c.id}>{getDisplayName(c)}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* SubCategory */}
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel sx={{ fontWeight: 700 }}>{t('common.subcategory')}</InputLabel>
                                <Select
                                    multiple
                                    value={localFilters.subCategory}
                                    onChange={(e) => setLocalFilters({ ...localFilters, subCategory: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                                    disabled={localFilters.category.length === 0}
                                    input={<OutlinedInput label={t('common.subcategory')} sx={{ borderRadius: '12px' }} />}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => {
                                                const s = subCategories.find(x => x.id === value);
                                                const color = s?.color || theme.palette.text.secondary;
                                                return (
                                                    <Chip
                                                        key={value} label={getDisplayName(s)} size="small"
                                                        sx={{ borderRadius: '8px', fontWeight: 700, bgcolor: alpha(color, 0.1), color: color }}
                                                    />
                                                );
                                            })}
                                        </Box>
                                    )}
                                >
                                    {subCategories.filter(s => localFilters.category.includes(s.categoryId)).map(s => (
                                        <MenuItem key={s.id} value={s.id}>{getDisplayName(s)}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Date Range */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Stack direction="row" spacing={1} sx={{ height: '40px' }}>
                                <DatePicker
                                    label={t('common.start_date')}
                                    value={localFilters.dateStart ? new Date(localFilters.dateStart) : null}
                                    onChange={(newValue) => setLocalFilters({ ...localFilters, dateStart: newValue ? format(newValue, 'yyyy-MM-dd') : '' })}
                                    slotProps={{
                                        textField: {
                                            size: 'small', fullWidth: true, InputLabelProps: { shrink: true },
                                            sx: { flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }
                                        }
                                    }}
                                />
                                <DatePicker
                                    label={t('common.end_date')}
                                    value={localFilters.dateEnd ? new Date(localFilters.dateEnd) : null}
                                    onChange={(newValue) => setLocalFilters({ ...localFilters, dateEnd: newValue ? format(newValue, 'yyyy-MM-dd') : '' })}
                                    slotProps={{
                                        textField: {
                                            size: 'small', fullWidth: true, InputLabelProps: { shrink: true },
                                            sx: { flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }
                                        }
                                    }}
                                />
                            </Stack>
                        </Grid>

                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                            <Button
                                variant="contained" onClick={applyFilters}
                                sx={{ borderRadius: '12px', px: 4, py: 1, fontWeight: 700, textTransform: 'none', background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)` }}
                            >
                                {t('common.apply')}
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Collapse>
        </Box>
    );
};

export default ReminderFilters;
