import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Grid,
    Card,
    Typography,
    Stack,
    useTheme,
    IconButton,
    Divider,
    alpha,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Collapse,
    TextField,
    InputAdornment,
    Button,
    Tooltip as MuiTooltip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft,
    TrendingUp,
    Users,
    DollarSign,
    ShoppingBag,
    Calendar,
    ExternalLink,
    RefreshCcw,
    Smartphone,
    Globe,
    SlidersHorizontal,
    Search,
    FilterX,
    MapPin
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { MOCK_CAMPAIGNS, MOCK_DAILY_STATS_FULL, MOCK_ATTRIBUTION_DATA_FULL } from '../../mocks/marketingMocks';

const DetailStatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => {
    const theme = useTheme();
    return (
        <Card sx={{ p: 3, borderRadius: 4, height: '100%', border: '1px solid', borderColor: alpha(color, 0.1) }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                        {title}
                    </Typography>
                    <Typography variant="h4" fontWeight={900} sx={{ mt: 1 }}>
                        {value}
                    </Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: alpha(color, 0.1), color: color }}>
                    <Icon size={24} />
                </Box>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 2 }}>
                {trend && (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <TrendingUp size={16} color={theme.palette.success.main} />
                        <Typography variant="caption" fontWeight={700} color="success.main">
                            {trend}
                        </Typography>
                    </Stack>
                )}
                <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
            </Stack>
        </Card>
    );
};

const MarketingCampaignDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const theme = useTheme();

    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({ status: 'all', sort: 'newest' });

    const campaign = useMemo(() => (MOCK_CAMPAIGNS || []).find(c => c.id === id), [id]);

    const filteredLeads = useMemo(() => {
        if (!campaign) return [];
        return (MOCK_ATTRIBUTION_DATA_FULL || []).filter(lead => {
            const isThisCampaign = lead.campaignId === campaign.id;
            const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filters.status === 'all' || lead.status === filters.status;
            return isThisCampaign && matchesSearch && matchesStatus;
        }).sort((a, b) => {
            if (filters.sort === 'value') return (b.value || 0) - (a.value || 0);
            return new Date(b.date || 0) - new Date(a.date || 0);
        });
    }, [campaign, searchQuery, filters]);

    const dailyTrendData = useMemo(() => {
        if (!campaign) return [];
        return (MOCK_DAILY_STATS_FULL || []).filter(d => d.platform === campaign.platform);
    }, [campaign]);

    const campaignStats = useMemo(() => {
        if (!campaign) return { leads: 0, sales: 0, value: 0, conv: 0 };
        const filteredSales = filteredLeads.filter(l => l.status === 'sale');
        const totalValue = filteredSales.reduce((acc, curr) => acc + (curr.value || 0), 0);
        const convRate = filteredLeads.length > 0 ? ((filteredSales.length / filteredLeads.length) * 100).toFixed(1) : 0;
        return { leads: filteredLeads.length, sales: filteredSales.length, value: totalValue, conv: convRate };
    }, [filteredLeads, campaign]);

    if (!campaign) return null;

    const funnelData = [
        { name: t('ads.leads'), value: campaignStats.leads, color: theme.palette.primary.main },
        { name: t('ads.sales'), value: campaignStats.sales, color: theme.palette.success.main },
    ];

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{ mb: 4 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
                    <IconButton onClick={() => navigate('/marketing/campaigns')} sx={{ bgcolor: 'action.hover' }}>
                        <ArrowLeft size={20} />
                    </IconButton>
                    <Typography variant="body2" fontWeight={700} color="text.secondary">{t('ads.campaigns')}</Typography>
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} gap={3}>
                    <Box>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{
                                width: 56, height: 56, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: campaign.platform === 'meta' ? '#1877F2' : campaign.platform === 'google' ? '#DB4437' : '#25D366', color: 'white'
                            }}>
                                {campaign.platform === 'meta' ? <Smartphone size={32} /> : <Globe size={32} />}
                            </Box>
                            <Box>
                                <Typography variant="h4" fontWeight={900}>{campaign.name}</Typography>
                                <Stack direction="row" spacing={2} alignItems="center" mt={0.5}>
                                    <Chip label={campaign.status.toUpperCase()} size="small" color={campaign.status === 'active' ? 'success' : 'default'} sx={{ fontWeight: 800 }} />
                                    <Typography variant="body2" color="text.secondary" fontWeight={600}>ID: {campaign.id}</Typography>
                                </Stack>
                            </Box>
                        </Stack>
                    </Box>

                    <Stack direction="row" spacing={2}>
                        <Button variant={showFilters ? "contained" : "outlined"} startIcon={<SlidersHorizontal size={18} />} onClick={() => setShowFilters(!showFilters)} sx={{ borderRadius: 3, fontWeight: 700 }}>
                            {t('ads.lead_filters')}
                        </Button>
                        <Button variant="contained" startIcon={<RefreshCcw size={18} />} sx={{ borderRadius: 3, fontWeight: 800, background: theme.palette.text.primary, color: theme.palette.background.paper }}>{t('ads.sync_data')}</Button>
                    </Stack>
                </Stack>

                <Collapse in={showFilters}>
                    <Card sx={{ mt: 3, p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.paper, 0.5) }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={5}>
                                <TextField fullWidth size="small" placeholder={t('ads.search_leads')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment>, sx: { borderRadius: 2 } }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={3} md={2.5}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>{t('ads.status')}</InputLabel>
                                    <Select value={filters.status} label={t('ads.status')} onChange={(e) => setFilters(p => ({ ...p, status: e.target.value }))} sx={{ borderRadius: 2 }}>
                                        <MenuItem value="all">{t('customers.filter.all')}</MenuItem>
                                        <MenuItem value="sale">{t('ads.sales')}</MenuItem>
                                        <MenuItem value="pending">{t('customers.status.pending')}</MenuItem>
                                        <MenuItem value="cancelled">{t('customers.status.cancelled')}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={3} md={2.5}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>{t('common.actions')}</InputLabel>
                                    <Select value={filters.sort} label={t('common.actions')} onChange={(e) => setFilters(p => ({ ...p, sort: e.target.value }))} sx={{ borderRadius: 2 }}>
                                        <MenuItem value="newest">{t('customers.registration_date')}</MenuItem>
                                        <MenuItem value="value">{t('ads.net_value')}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Button fullWidth variant="soft" color="error" startIcon={<FilterX size={18} />} onClick={() => { setSearchQuery(''); setFilters({ status: 'all', sort: 'newest' }); }} sx={{ borderRadius: 2, height: 40 }}>
                                    {t('common.delete')}
                                </Button>
                            </Grid>
                        </Grid>
                    </Card>
                </Collapse>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} lg={3}>
                    <DetailStatCard title={t('ads.budget_spent')} value={`€${campaign.spend.toLocaleString()}`} icon={DollarSign} color={theme.palette.primary.main} subtitle={`${t('ads.budget')}: €${campaign.budget}`} />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <DetailStatCard title={t('ads.leads')} value={campaignStats.leads} icon={Users} color="#20c997" subtitle={t('ads.matched_criteria')} />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <DetailStatCard title={t('ads.sales')} value={campaignStats.sales} icon={ShoppingBag} color={theme.palette.success.main} subtitle={`${campaignStats.conv}% ${t('ads.conversion')}`} />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <DetailStatCard title={t('ads.net_value')} value={`€${campaignStats.value.toLocaleString()}`} icon={TrendingUp} color="#7367f0" subtitle={`${(campaign.spend > 0 ? campaignStats.value / campaign.spend : 0).toFixed(1)}x ROAS`} />
                </Grid>

                <Grid item xs={12} lg={8}>
                    <Card sx={{ p: 4, borderRadius: 5, height: 500 }}>
                        <Typography variant="h6" fontWeight={800} mb={4}>{t('ads.performance_trend_daily')}</Typography>
                        <Box sx={{ width: '100%', height: 350 }}>
                            <ResponsiveContainer>
                                <AreaChart data={dailyTrendData}>
                                    <defs>
                                        <linearGradient id="colorSpendDet" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.2} />
                                            <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: theme.palette.text.secondary }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: theme.palette.text.secondary }} />
                                    <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="spend" stroke={theme.palette.primary.main} strokeWidth={4} fill="url(#colorSpendDet)" />
                                    <Area type="monotone" dataKey="sales" stroke={theme.palette.success.main} strokeWidth={4} fill="none" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Box>
                    </Card>
                </Grid>

                <Grid item xs={12} lg={4}>
                    <Card sx={{ p: 4, borderRadius: 5, height: 500, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" fontWeight={800} mb={4}>{t('ads.efficiency_funnel')}</Typography>
                        <Box sx={{ flexGrow: 1, width: '100%' }}>
                            <ResponsiveContainer>
                                <BarChart layout="vertical" data={funnelData} margin={{ left: 20, right: 30, top: 20, bottom: 20 }}>
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontWeight: 800 }} width={80} />
                                    <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={40}>
                                        {funnelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Card>
                </Grid>

                <Grid item xs={12}>
                    <Card sx={{ borderRadius: 5, overflow: 'hidden' }}>
                        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h6" fontWeight={800}>{t('ads.matching_lead')} ({filteredLeads.length})</Typography>
                        </Box>
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800 }}>{t('ads.lead_identity')}</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>{t('ads.status')}</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>{t('ads.location')}</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>{t('ads.value_revenue')}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800 }}>{t('common.actions')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredLeads.map((lead) => (
                                        <TableRow key={lead.id} hover>
                                            <TableCell>
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, fontWeight: 800 }}>
                                                        {lead.name ? lead.name[0] : '?'}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={800}>{lead.name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{lead.date}</Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={(lead.status || '').toUpperCase()} size="small" variant="soft" color={lead.status === 'sale' ? 'success' : lead.status === 'pending' ? 'warning' : 'error'} sx={{ fontWeight: 900 }} />
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <MapPin size={14} color={theme.palette.text.secondary} />
                                                    <Typography variant="body2" color="text.secondary">{lead.country}</Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={800} color={lead.status === 'sale' ? 'success.main' : 'inherit'}>
                                                    {lead.value > 0 ? `€${lead.value.toLocaleString()}` : '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right" sx={{ pr: 3 }}>
                                                <IconButton size="small" color="primary" sx={{ border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.1) }}>
                                                    <ExternalLink size={16} />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default MarketingCampaignDetail;
