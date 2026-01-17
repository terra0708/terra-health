import React from 'react';
import {
    Box, Grid, Typography, Stack, useTheme, Button, Card, Divider,
    FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText, Collapse
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import {
    TrendingUp, Users, DollarSign, ArrowUpRight, ArrowDownRight,
    ShoppingBag, SlidersHorizontal, ChevronUp, FilterX
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell as ReCell
} from 'recharts';
import { MarketingStatCard, useMarketingDashboard } from '../../modules/marketing';

const MarketingDashboard = () => {
    const { t } = useTranslation();
    const theme = useTheme();
    const {
        showFilters, setShowFilters,
        filters, handleFilterChange, resetFilters,
        stats, funnelData,
        filteredDailyData
    } = useMarketingDashboard();

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{ mb: 4 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={3}>
                    <Box>
                        <Typography variant="h4" fontWeight={900} sx={{
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            {t('ads.analytics_dashboard')}
                        </Typography>
                        <Typography color="text.secondary" variant="body1">
                            {t('ads.analytics_subtitle', 'Interactive full-funnel marketing performance tracking')}
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
                        <Button
                            variant={showFilters ? "contained" : "outlined"}
                            startIcon={showFilters ? <ChevronUp size={18} /> : <SlidersHorizontal size={18} />}
                            onClick={() => setShowFilters(!showFilters)}
                            sx={{ borderRadius: 3, px: 3, fontWeight: 700 }}
                        >
                            {t('common.filters')}
                        </Button>
                        <Button variant="contained" sx={{ borderRadius: 3, fontWeight: 800, background: theme.palette.text.primary, color: theme.palette.background.paper, px: 4 }}>
                            {t('ads.export_report', 'Export Report')}
                        </Button>
                    </Stack>
                </Stack>

                <Collapse in={showFilters}>
                    <Card sx={{ mt: 3, p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.paper, 0.5) }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ fontWeight: 700 }}>{t('ads.platform')}</InputLabel>
                                    <Select
                                        multiple
                                        label={t('ads.platform')}
                                        value={filters.platforms}
                                        onChange={(e) => handleFilterChange('platforms', e.target.value)}
                                        renderValue={(selected) => selected.map(s => s.toUpperCase()).join(', ')}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        {['meta', 'google', 'whatsapp', 'manual'].map((p) => (
                                            <MenuItem key={p} value={p}>
                                                <Checkbox checked={(filters.platforms || []).indexOf(p) > -1} size="small" />
                                                <ListItemText primary={p.charAt(0).toUpperCase() + p.slice(1)} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ fontWeight: 700 }}>{t('customers.service_category')}</InputLabel>
                                    <Select
                                        label={t('customers.service_category')}
                                        value={filters.service}
                                        onChange={(e) => handleFilterChange('service', e.target.value)}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        <MenuItem value="all">{t('common.all')}</MenuItem>
                                        <MenuItem value="hair">Hair Transplant</MenuItem>
                                        <MenuItem value="dental">Dental Aesthetics</MenuItem>
                                        <MenuItem value="plastic">Plastic Surgery</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <Button fullWidth variant="soft" color="error" startIcon={<FilterX size={18} />} onClick={resetFilters} sx={{ borderRadius: 2, height: 40, fontWeight: 700 }}>
                                    {t('common.reset_filters', 'Reset All')}
                                </Button>
                            </Grid>
                        </Grid>
                    </Card>
                </Collapse>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} lg={3}>
                    <MarketingStatCard title={t('ads.total_spend')} value={`€${stats.totalSpend.toLocaleString()}`} icon={DollarSign} trend="up" trendValue="+12%" color={theme.palette.primary.main} />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <MarketingStatCard title={t('ads.leads_captured')} value={stats.totalLeads} icon={Users} trend="up" trendValue="+8%" color="#20c997" />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <MarketingStatCard title={t('ads.sales_closed')} value={stats.salesCount} icon={ShoppingBag} trend="up" trendValue="+15%" color={theme.palette.success.main} />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <MarketingStatCard title={t('ads.net_revenue')} value={`€${stats.netRevenue.toLocaleString()}`} icon={TrendingUp} trend="up" trendValue="+21%" color="#7367f0" />
                </Grid>

                <Grid item xs={12} lg={8}>
                    <Card sx={{ p: 4, borderRadius: 5, height: 550 }}>
                        <Typography variant="h6" fontWeight={800} mb={3}>{t('ads.performance_trend_daily')}</Typography>
                        <Box sx={{ width: '100%', height: 420 }}>
                            <ResponsiveContainer>
                                <AreaChart data={filteredDailyData}>
                                    <defs>
                                        <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.15} />
                                            <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.15} />
                                            <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: theme.palette.text.secondary }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: theme.palette.text.secondary }} />
                                    <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="spend" stroke={theme.palette.primary.main} strokeWidth={5} fill="url(#colorSpend)" />
                                    <Area type="monotone" dataKey="sales" stroke={theme.palette.success.main} strokeWidth={5} fill="url(#colorSales)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Box>
                    </Card>
                </Grid>

                <Grid item xs={12} lg={4}>
                    <Card sx={{ p: 4, borderRadius: 5, height: 550, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" fontWeight={800} mb={3}>{t('ads.efficiency_funnel')}</Typography>
                        <Box sx={{ flexGrow: 1, width: '100%' }}>
                            <ResponsiveContainer>
                                <BarChart layout="vertical" data={funnelData} margin={{ left: 10, right: 30, top: 20, bottom: 20 }}>
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontWeight: 800, fill: theme.palette.text.primary }} width={110} />
                                    <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={45}>
                                        {funnelData.map((entry, index) => (
                                            <ReCell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                        <Stack spacing={2} sx={{ mt: 3, pt: 3, borderTop: '1px dashed', borderColor: 'divider' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2" fontWeight={700} color="text.secondary">{t('ads.cost_per_lead')}</Typography>
                                <Typography variant="h6" fontWeight={900} color="primary.main">€{stats.cpl}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2" fontWeight={700} color="text.secondary">{t('ads.roi_roas')}</Typography>
                                <Typography variant="h6" fontWeight={900} color="success.main">{stats.roas}x</Typography>
                            </Stack>
                        </Stack>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default MarketingDashboard;
