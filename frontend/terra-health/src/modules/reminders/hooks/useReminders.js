import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { isPast, isValid } from 'date-fns';
import { useCustomerStore } from '../../customers/hooks/useCustomerStore';
import { useReminderStore } from './useReminderStore';
import { useReminderSettingsStore } from './useReminderSettingsStore';

export const useReminders = () => {
    const { t, i18n } = useTranslation();

    // Stores
    const { customers, deleteCustomerNote, updateCustomerNote, addCustomerNote, generateRandomReminders, syncWithMockData } = useCustomerStore();
    const { personalReminders, addPersonalReminder, updatePersonalReminder, deletePersonalReminder } = useReminderStore();
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

    // Local Filters for Apply Button
    const [localFilters, setLocalFilters] = useState({
        status: [], category: [], subCategory: [],
        dateStart: '', dateEnd: ''
    });

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

    // Initial Sync
    useEffect(() => {
        syncWithMockData();
        const totalReminders = personalReminders.length + customers.reduce((acc, c) => acc + (c.reminder?.notes?.length || 0), 0);
        if (totalReminders === 0) generateRandomReminders();
    }, []);

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
        if (data.categoryId === 'customer' && data.customerId) {
            const noteData = { ...data, type: 'customer' };
            if (data.id && data.type === 'customer') updateCustomerNote(data.customerId, data.id, noteData);
            else addCustomerNote(data.customerId, noteData);
        } else {
            const reminderData = { ...data, type: 'personal' };
            if (data.id && data.type === 'personal') updatePersonalReminder(data.id, reminderData);
            else addPersonalReminder(reminderData);
        }
    }, [addCustomerNote, updateCustomerNote, addPersonalReminder, updatePersonalReminder]);

    const handleDelete = useCallback((reminder) => {
        if (reminder.type === 'customer') {
            if (window.confirm(t('reminders.delete_confirm'))) deleteCustomerNote(reminder.customer.id, reminder.id);
        } else deletePersonalReminder(reminder.id);
    }, [deleteCustomerNote, deletePersonalReminder, t]);

    const handleChangeStatus = useCallback((reminder, newStatusId) => {
        const newStatus = statuses.find(s => s.id === newStatusId);
        const isCompleted = newStatus ? newStatus.isCompleted : false;

        if (reminder.type === 'customer') {
            updateCustomerNote(reminder.customer.id, reminder.id, {
                statusId: newStatusId,
                isCompleted: isCompleted
            });
        } else {
            updatePersonalReminder(reminder.id, {
                statusId: newStatusId,
                isCompleted: isCompleted
            });
        }
    }, [statuses, updateCustomerNote, updatePersonalReminder]);

    const handleEdit = useCallback((reminder) => {
        setEditingReminder(reminder);
        setOpenAddDialog(true);
    }, []);

    const handleShowInfo = useCallback((customer) => {
        setSelectedCustomer(customer);
        setDetailsOpen(true);
    }, []);

    // --- COMPUTED ---
    const allReminders = useMemo(() => {
        const customerReminders = customers.flatMap(c =>
            (c.reminder?.notes || []).map(note => ({
                ...note,
                type: 'customer',
                customer: c,
                source: 'CRM'
            }))
        );
        const personal = personalReminders.map(r => ({ ...r, type: 'personal', source: 'Personal' }));
        return [...customerReminders, ...personal].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (!isValid(dateA)) return 1;
            if (!isValid(dateB)) return -1;
            return dateA - dateB;
        });
    }, [customers, personalReminders]);

    const filteredReminders = useMemo(() => {
        let filtered = allReminders;
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
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(r =>
                (r.title && r.title.toLowerCase().includes(query)) ||
                (r.note && r.note.toLowerCase().includes(query)) ||
                (r.customer && r.customer.name && r.customer.name.toLowerCase().includes(query))
            );
        }
        if (filterDateStart) filtered = filtered.filter(r => r.date >= filterDateStart);
        if (filterDateEnd) filtered = filtered.filter(r => r.date <= filterDateEnd);
        if (filterCategory.length > 0) filtered = filtered.filter(r => filterCategory.includes(r.categoryId));
        if (filterSubCategory.length > 0) filtered = filtered.filter(r => filterSubCategory.includes(r.subCategoryId));
        return filtered;
    }, [allReminders, currentTab, searchQuery, filterDateStart, filterDateEnd, filterCategory, filterSubCategory]);

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
        generateRandomReminders,
        handleAddSubmit,
        handleDelete,
        handleEdit,
        handleShowInfo,
        handleChangeStatus
    };
};
