import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { isPast, isValid } from 'date-fns';
import { useReminderStore } from './useReminderStore';
import { useReminderSettingsStore } from './useReminderSettingsStore';

export const useReminders = (options = {}) => {
    // Options: customersResolver, enableMigration, migrationConfig, t
    const {
        customersResolver = null, // (relationId) => customer object | null
        enableMigration = false,
        migrationConfig = null, // { customers, syncWithMockData, clearNestedReminders, syncFromCustomerStore }
        t: tProp = null
    } = options;

    const { t: tInternal, i18n } = useTranslation(['terra-health', 'translation']);
    const t = tProp || tInternal;
    const [searchParams, setSearchParams] = useSearchParams();

    // Stores
    const {
        reminders,
        fetchReminders,
        addReminder,
        updateReminder,
        deleteReminder,
        toggleComplete
    } = useReminderStore();

    const settingsStore = useReminderSettingsStore();
    const { categories, subCategories, statuses, fetchSettings, getCustomerCategory } = settingsStore;

    // Fetch settings and reminders on mount
    useEffect(() => {
        fetchSettings();
        fetchReminders();
    }, [fetchSettings, fetchReminders]);

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

    // --- INITIALIZATION & MIGRATION REMOVED (BACKEND HANDLES IT) ---

    // Auto-filter by customerId from URL params
    useEffect(() => {
        const customerIdFromUrl = searchParams.get('customerId');
        if (customerIdFromUrl && customersResolver) {
            // Set customer filter when customerId is in URL
            const customer = customersResolver(customerIdFromUrl);
            if (customer) {
                // Filter by customer category and relationId
                setFilterCategory(['customer']);
                setLocalFilters(prev => ({
                    ...prev,
                    category: ['customer']
                }));
            }
        }
    }, [searchParams, customersResolver]);

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
    }, [showFilters, currentTab, filterCategory, filterSubCategory, filterDateStart, filterDateEnd]);

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

    const enrichedReminders = useMemo(() => {
        const uniqueMap = new Map();
        const customerCategory = getCustomerCategory();

        reminders.forEach(r => {
            const customer = r.relationId && customersResolver
                ? customersResolver(r.relationId)
                : null;

            const isCustomerRem = customerCategory && r.categoryId === customerCategory.id;

            const enriched = {
                ...r,
                customer: customer,
                source: isCustomerRem ? 'CRM' : 'Personal',
                type: isCustomerRem ? 'customer' : 'personal'
            };
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
    }, [reminders, customersResolver]);

    const filteredReminders = useMemo(() => {
        let filtered = enrichedReminders;

        // Customer filter from URL params
        const customerIdFromUrl = searchParams.get('customerId');
        if (customerIdFromUrl) {
            filtered = filtered.filter(r => r.relationId === customerIdFromUrl);
        }

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
    }, [enrichedReminders, currentTab, searchQuery, filterDateStart, filterDateEnd, filterCategory, filterSubCategory, searchParams]);

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
        categories, subCategories, statuses,
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
