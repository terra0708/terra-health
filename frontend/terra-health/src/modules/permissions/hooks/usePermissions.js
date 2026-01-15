import { useState, useMemo } from 'react';
import { usePermissionStore } from './usePermissionStore';
import { COLORS } from '../data/mockData';

export const usePermissions = () => {
    const store = usePermissionStore();
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
        const list = tabValue === 0 ? store.packages : store.roles;
        return list.find(i => i.id === selectedId) || list[0] || null;
    }, [tabValue, selectedId, store.packages, store.roles]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        const nextList = newValue === 0 ? store.packages : store.roles;
        setSelectedId(nextList[0]?.id || null);
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
        const items = tabValue === 0 ? store.packages : store.roles;
        return items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [tabValue, searchTerm, store.packages, store.roles]);

    const paginatedItems = useMemo(() => {
        return allFilteredItems.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
    }, [allFilteredItems, page]);

    const handleCreate = () => {
        if (tabValue === 0) {
            store.addPackage(formData);
        } else {
            store.addRole(formData);
        }
        setDrawerOpen(false);
        setFormData({ name: '', description: '', color: COLORS[1] });
    };

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
        itemsPerPage,
        handleCreate,
        store // Pass full store for direct actions in UI
    };
};
