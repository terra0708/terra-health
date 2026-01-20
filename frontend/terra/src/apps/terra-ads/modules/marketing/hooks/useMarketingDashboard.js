import { useState, useMemo } from 'react';
import { useTheme } from '@mui/material';
import { MOCK_DAILY_STATS_FULL, MOCK_ATTRIBUTION_DATA_FULL } from '@mocks/marketingMocks';

export const useMarketingDashboard = () => {
    const theme = useTheme();
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        platforms: ['meta', 'google', 'whatsapp', 'manual'],
        service: 'all'
    });

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

    return {
        showFilters, setShowFilters,
        filters, handleFilterChange, resetFilters,
        stats, funnelData,
        filteredDailyData, filteredAttribution,
        theme
    };
};
