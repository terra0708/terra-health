import { useState, useMemo } from 'react';
import { MOCK_PACKAGES, MOCK_ROLES, COLORS } from '../data/mockData';

export const usePermissions = () => {
    const [tabValue, setTabValue] = useState(0); // 0: Yetki Paketleri, 1: Roller
    const [selectedId, setSelectedId] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', color: COLORS[1] });

    // Pagination state
    const [page, setPage] = useState(0);
    const itemsPerPage = 8;

    const selectedItem = useMemo(() => {
        return tabValue === 0
            ? MOCK_PACKAGES.find(p => p.id === selectedId) || MOCK_PACKAGES[0]
            : MOCK_ROLES.find(r => r.id === selectedId) || MOCK_ROLES[0];
    }, [tabValue, selectedId]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setSelectedId(1);
        setShowDetail(false);
        setPage(0);
    };

    const handleSelectItem = (id, isMobile) => {
        setSelectedId(id);
        if (isMobile) {
            setShowDetail(true);
        }
    };

    const allFilteredItems = useMemo(() => {
        const items = tabValue === 0 ? MOCK_PACKAGES : MOCK_ROLES;
        return items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [tabValue, searchTerm]);

    const paginatedItems = useMemo(() => {
        return allFilteredItems.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
    }, [allFilteredItems, page]);

    return {
        tabValue,
        handleTabChange,
        selectedId,
        handleSelectItem,
        searchTerm,
        setSearchTerm: (val) => { setSearchTerm(val); setPage(0); },
        drawerOpen,
        setDrawerOpen,
        showDetail,
        setShowDetail,
        selectedItem,
        formData,
        setFormData,
        filteredItems: paginatedItems,
        totalCount: allFilteredItems.length,
        page,
        setPage,
        itemsPerPage
    };
};
