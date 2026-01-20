import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarketingStore } from './useMarketingStore';

export const useMarketingCampaigns = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [platformFilter, setPlatformFilter] = useState('all');
    const { campaigns, toggleStatus: storeToggleStatus } = useMarketingStore();
    const [dialogOpen, setDialogOpen] = useState(false);

    const filteredCampaigns = campaigns.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPlatform = platformFilter === 'all' || c.platform === platformFilter;
        return matchesSearch && matchesPlatform;
    });

    const toggleStatus = (id) => {
        storeToggleStatus(id);
    };

    const handleViewStats = (id) => {
        navigate(`/marketing/campaigns/${id}`);
    };

    return {
        searchQuery, setSearchQuery,
        platformFilter, setPlatformFilter,
        campaigns: filteredCampaigns,
        dialogOpen, setDialogOpen,
        toggleStatus,
        handleViewStats
    };
};
