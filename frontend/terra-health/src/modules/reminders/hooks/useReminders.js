import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { isPast, isValid } from 'date-fns';
import { useCustomerStore } from '../../customers/hooks/useCustomerStore';
import { useReminderStore } from './useReminderStore';
import { useReminderSettingsStore } from './useReminderSettingsStore';

export const useReminders = () => {
    const { t, i18n } = useTranslation();

    // Stores
    const { customers, clearNestedReminders, syncWithMockData } = useCustomerStore();
    const {
        reminders,
        addReminder,
        updateReminder,
        deleteReminder,
        toggleComplete,
        syncFromCustomerStore
    } = useReminderStore();

    const { categories, subCategories, statuses } = useReminderSettingsStore();

    // UI States
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [editingReminder, setEditingReminder] = useState(null);
    const [currentTab, setCurrentTab] = useState([]); // Main Status Filter Array
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');
    const [filterCategory, setFilterCategory] = useState([]);
    const [filterSubCategory, setFilterSubCategory] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    // Local Filters for Apply Button (Performance)
    const [localFilters, setLocalFilters] = useState({
        status: [], category: [], subCategory: [],
        dateStart: '', dateEnd: ''
    });

    // --- INITIALIZATION & MIGRATION ---
    useEffect(() => {
        // 1. Sync customers with base mock data if needed
        syncWithMockData();

        // 2. Perform one-time migration from Nested -> Centralized
        // We check if any customer still has a 'reminder' property with notes
        const needsMigration = customers.some(c => c.reminder?.notes?.length > 0);
        if (needsMigration) {
            const synced = syncFromCustomerStore(customers);
            if (synced) {
                clearNestedReminders();
            }
        }

        // 3. Generate initial demo data if everything is empty
        if (reminders.length === 0) {
            // Self-generating standard demo reminders
            const demoReminders = [
                { title: 'Hoşgeldin Mesajı', note: 'Yeni sistem hatırlatıcısı', categoryId: 'personal', statusId: 'pending' },
                { title: 'Haftalık Rapor', note: 'Performans kontrolü', categoryId: 'finance', statusId: 'pending' }
            ];
            demoReminders.forEach(r => addReminder(r));
        }
    }, []);

    // Sync Main -> Local when opening filters
    useEffect(() => {
        if (showFilters) {
            setLocalFilters({
                status: currentTab,
                category: filterCategory,
                subCategory: filterSubCategory,
                dateStart: filterDateStart,
                dateEnd: filterDateEnd
            });
        }
    }, [showFilters]);

    // --- ACTIONS ---
    const applyFilters = () => {
        setCurrentTab(localFilters.status);
        setFilterCategory(localFilters.category);
        setFilterSubCategory(localFilters.subCategory);
        setFilterDateStart(localFilters.dateStart);
        setFilterDateEnd(localFilters.dateEnd);
        setPage(0);
    };

    const resetFilters = () => {
        setSearchQuery('');
        setFilterDateStart('');
        setFilterDateEnd('');
        setFilterCategory([]);
        setFilterSubCategory([]);
        setCurrentTab([]);
        setLocalFilters({
            status: [], category: [], subCategory: [],
            dateStart: '', dateEnd: ''
        });
        setPage(0);
    };

    const handleAddSubmit = useCallback((data) => {
        if (data.id) {
            updateReminder(data.id, data);
        } else {
            addReminder(data);
        }
        setOpenAddDialog(false);
        setEditingReminder(null);
    }, [addReminder, updateReminder]);

    const handleDelete = useCallback((reminder) => {
        if (window.confirm(t('reminders.delete_confirm'))) {
            deleteReminder(reminder.id);
        }
    }, [deleteReminder, t]);

    const handleChangeStatus = useCallback((reminder, newStatusId) => {
        const newStatus = statuses.find(s => s.id === newStatusId);
        updateReminder(reminder.id, {
            statusId: newStatusId,
            isCompleted: newStatus ? newStatus.isCompleted : false
        });
    }, [statuses, updateReminder]);

    const handleEdit = useCallback((reminder) => {
        setEditingReminder(reminder);
        setOpenAddDialog(true);
    }, []);

    const handleShowInfo = useCallback((customer) => {
        setSelectedCustomer(customer);
        setDetailsOpen(true);
    }, []);

    // --- COMPUTED (THE ENGINE) ---

    // We enrich reminders with customer data on-the-fly (Reference based)
    const enrichedReminders = useMemo(() => {
        const uniqueMap = new Map();

        reminders.forEach(r => {
            const customer = r.relationId ? customers.find(c => c.id === r.relationId) : null;
            const enriched = {
                ...r,
                customer: customer, // Dynamic link
                source: r.categoryId === 'customer' ? 'CRM' : 'Personal',
                type: r.categoryId === 'customer' ? 'customer' : 'personal'
            };
            // If duplicate ID exists, last one wins or we skip. 
            // Here, we ensure the key used in UI will be unique.
            if (!uniqueMap.has(r.id)) {
                uniqueMap.set(r.id, enriched);
            }
        });

        return Array.from(uniqueMap.values()).sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (!isValid(dateA)) return 1;
            if (!isValid(dateB)) return -1;
            return dateA - dateB;
        });
    }, [reminders, customers]);

    const filteredReminders = useMemo(() => {
        let filtered = enrichedReminders;

        // Status / Overdue Filter
        if (currentTab.length > 0) {
            const hasOverdue = currentTab.includes('overdue');
            const statusIds = currentTab.filter(s => s !== 'overdue');

            filtered = filtered.filter(r => {
                let match = false;
                if (statusIds.length > 0 && statusIds.includes(r.statusId)) match = true;
                if (hasOverdue && !r.isCompleted && isPast(new Date(`${r.date}T${r.time || '00:00'}`))) match = true;
                return match;
            });
        }

        // Search Query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(r =>
                (r.title && r.title.toLowerCase().includes(query)) ||
                (r.note && r.note.toLowerCase().includes(query)) ||
                (r.customer && r.customer.name && r.customer.name.toLowerCase().includes(query))
            );
        }

        // Filters
        if (filterDateStart) filtered = filtered.filter(r => r.date >= filterDateStart);
        if (filterDateEnd) filtered = filtered.filter(r => r.date <= filterDateEnd);
        if (filterCategory.length > 0) filtered = filtered.filter(r => filterCategory.includes(r.categoryId));
        if (filterSubCategory.length > 0) filtered = filtered.filter(r => filterSubCategory.includes(r.subCategoryId));

        return filtered;
    }, [enrichedReminders, currentTab, searchQuery, filterDateStart, filterDateEnd, filterCategory, filterSubCategory]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (currentTab.length > 0) count++;
        if (filterDateStart) count++;
        if (filterDateEnd) count++;
        if (filterCategory.length > 0) count++;
        if (filterSubCategory.length > 0) count++;
        return count;
    }, [currentTab, filterDateStart, filterDateEnd, filterCategory, filterSubCategory]);

    const paginatedReminders = useMemo(() => {
        return filteredReminders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredReminders, page, rowsPerPage]);

    return {
        // States & Stores
        customers, categories, subCategories, statuses,
        openAddDialog, setOpenAddDialog,
        editingReminder, setEditingReminder,
        page, setPage,
        rowsPerPage, setRowsPerPage,
        detailsOpen, setDetailsOpen,
        selectedCustomer, setSelectedCustomer,
        searchQuery, setSearchQuery,
        showFilters, setShowFilters,
        localFilters, setLocalFilters,

        // Computed
        paginatedReminders,
        totalCount: filteredReminders.length,
        activeFilterCount,
        i18n, t,

        // Actions
        applyFilters,
        resetFilters,
        handleAddSubmit,
        handleDelete,
        handleEdit,
        handleShowInfo,
        handleChangeStatus,
        toggleComplete
    };
};
