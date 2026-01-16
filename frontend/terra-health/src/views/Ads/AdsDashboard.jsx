import React, { useState, useMemo } from 'react';
import {
    Box,
    Grid,
    Card,
    Typography,
    Stack,
    useTheme,
    Button,
    Paper,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    ListItemText,
    Collapse,
    Tooltip as MuiTooltip,
    LinearProgress
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import {
    TrendingUp,
    MousePointer2,
    Users,
    DollarSign,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    ShoppingBag,
    XCircle,
    Smartphone,
    Search as SearchIcon,
    MessageCircle,
    UserCircle,
    SlidersHorizontal,
    ChevronUp,
    Calendar,
    FilterX,
    Globe2,
    CheckCircle2
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
    Cell as ReCell
} from 'recharts';
import { MOCK_DAILY_STATS_FULL, MOCK_ATTRIBUTION_DATA_FULL } from '../../mocks/adsMocks';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, subtitle }) => {
    const theme = useTheme();
    return (
        <Card sx={{ p: 3, borderRadius: 4, height: '100%', position: 'relative', overflow: 'hidden', border: '1px solid', borderColor: alpha(color, 0.1) }}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.05 }}>
                <Icon size={100} color={color} />
            </Box>

            <Stack spacing={2}>
                <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(color, 0.1),
                    color: color
                }}>
                    <Icon size={24} />
                </Box>

                <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {title}
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                        {value}
                    </Typography>
                </Box>

                <Stack direction="row" alignItems="center" spacing={0.5}>
                    {trend === 'up' ? (
                        <ArrowUpRight size={18} color={theme.palette.success.main} />
                    ) : (
                        <ArrowDownRight size={18} color={theme.palette.error.main} />
                    )}
                    <Typography variant="caption" fontWeight={700} sx={{ color: trend === 'up' ? 'success.main' : 'error.main' }}>
                        {trendValue}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {subtitle || 'vs last month'}
                    </Typography>
                </Stack>
            </Stack>
        </Card>
    );
};

const AdsDashboard = () => {
    const { t } = useTranslation();
    const theme = useTheme();

    // FILTER STATE
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        platforms: ['meta', 'google', 'whatsapp', 'manual'],
        service: 'all'
    });

    // INTERACTIVE FILTER LOGIC
    const filteredDailyData = useMemo(() => {
        return (MOCK_DAILY_STATS_FULL || []).filter(item => {
            const matchesPlatform = filters.platforms.includes(item.platform);
            const matchesService = filters.service === 'all' || item.service === filters.service;
            return matchesPlatform && matchesService;
        });
    }, [filters]);

    const filteredAttribution = useMemo(() => {
        return (MOCK_ATTRIBUTION_DATA_FULL || []).filter(item => {
            const matchesPlatform = filters.platforms.includes(item.platform);
            const matchesService = filters.service === 'all' || item.service === filters.service;
            return matchesPlatform && matchesService;
        });
    }, [filters]);

    // DERIVED STATS
    const stats = useMemo(() => {
        const totalSpend = filteredDailyData.reduce((acc, curr) => acc + (curr.spend || 0), 0);
        const totalLeads = filteredDailyData.reduce((acc, curr) => acc + (curr.leads || 0), 0);
        const salesCount = filteredAttribution.filter(l => l.status === 'sale').length;
        const cancelCount = filteredAttribution.filter(l => l.status === 'cancelled').length;
        const netRevenue = filteredAttribution.reduce((acc, curr) => acc + (curr.value || 0), 0);
        const cpl = totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : 0;
        const roas = totalSpend > 0 ? (netRevenue / totalSpend).toFixed(1) : 0;

        return { totalSpend, totalLeads, salesCount, cancelCount, netRevenue, cpl, roas };
    }, [filteredDailyData, filteredAttribution]);

    const funnelData = useMemo(() => [
        { name: 'Total Leads', value: stats.totalLeads, color: theme.palette.primary.main },
        { name: 'Sales', value: stats.salesCount, color: theme.palette.success.main },
        { name: 'Cancellations', value: stats.cancelCount, color: theme.palette.error.main },
    ], [stats, theme]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const resetFilters = () => {
        setFilters({
            platforms: ['meta', 'google', 'whatsapp', 'manual'],
            service: 'all'
        });
    };

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
                            Ads Analytics Dashboard
                        </Typography>
                        <Typography color="text.secondary" variant="body1">
                            Interactive full-funnel marketing performance tracking
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
                        <Button
                            variant={showFilters ? "contained" : "outlined"}
                            startIcon={showFilters ? <ChevronUp size={18} /> : <SlidersHorizontal size={18} />}
                            onClick={() => setShowFilters(!showFilters)}
                            sx={{ borderRadius: 3, px: 3, fontWeight: 700 }}
                        >
                            Advanced Filters
                        </Button>
                        <Button variant="contained" sx={{ borderRadius: 3, fontWeight: 800, background: theme.palette.text.primary, color: theme.palette.background.paper, px: 4 }}>
                            Export Report
                        </Button>
                    </Stack>
                </Stack>

                <Collapse in={showFilters}>
                    <Card sx={{ mt: 3, p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.paper, 0.5) }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ fontWeight: 700 }}>Platforms</InputLabel>
                                    <Select
                                        multiple
                                        label="Platforms"
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
                                    <InputLabel sx={{ fontWeight: 700 }}>Service Type</InputLabel>
                                    <Select
                                        label="Service Type"
                                        value={filters.service}
                                        onChange={(e) => handleFilterChange('service', e.target.value)}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        <MenuItem value="all">All Services</MenuItem>
                                        <MenuItem value="hair">Hair Transplant</MenuItem>
                                        <MenuItem value="dental">Dental Aesthetics</MenuItem>
                                        <MenuItem value="plastic">Plastic Surgery</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <Button fullWidth variant="soft" color="error" startIcon={<FilterX size={18} />} onClick={resetFilters} sx={{ borderRadius: 2, height: 40, fontWeight: 700 }}>
                                    Reset All
                                </Button>
                            </Grid>
                        </Grid>
                    </Card>
                </Collapse>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard title="Total Ad Spend" value={`€${stats.totalSpend.toLocaleString()}`} icon={DollarSign} trend="up" trendValue="+12%" color={theme.palette.primary.main} />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard title="Leads Captured" value={stats.totalLeads} icon={Users} trend="up" trendValue="+8%" color="#20c997" />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard title="Sales (Closed)" value={stats.salesCount} icon={ShoppingBag} trend="up" trendValue="+15%" color={theme.palette.success.main} />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard title="Net Revenue" value={`€${stats.netRevenue.toLocaleString()}`} icon={TrendingUp} trend="up" trendValue="+21%" color="#7367f0" />
                </Grid>

                <Grid item xs={12} lg={8}>
                    <Card sx={{ p: 4, borderRadius: 5, height: 550 }}>
                        <Typography variant="h6" fontWeight={800} mb={3}>Performance Trend (Daily)</Typography>
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
                        <Typography variant="h6" fontWeight={800} mb={3}>Efficiency Funnel</Typography>
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
                                <Typography variant="body2" fontWeight={700} color="text.secondary">Cost Per Lead (CPL)</Typography>
                                <Typography variant="h6" fontWeight={900} color="primary.main">€{stats.cpl}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2" fontWeight={700} color="text.secondary">ROI / ROAS</Typography>
                                <Typography variant="h6" fontWeight={900} color="success.main">{stats.roas}x</Typography>
                            </Stack>
                        </Stack>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdsDashboard;
