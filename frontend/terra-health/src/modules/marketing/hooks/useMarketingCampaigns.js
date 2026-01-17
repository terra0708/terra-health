import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_CAMPAIGNS } from '../../../mocks/marketingMocks';

export const useMarketingCampaigns = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [platformFilter, setPlatformFilter] = useState('all');
    const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS);
    const [dialogOpen, setDialogOpen] = useState(false);

    const filteredCampaigns = campaigns.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPlatform = platformFilter === 'all' || c.platform === platformFilter;
        return matchesSearch && matchesPlatform;
    });

    const toggleStatus = (id) => {
        setCampaigns(prev => prev.map(c =>
            c.id === id ? { ...c, status: c.status === 'active' ? 'paused' : 'active' } : c
        ));
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
