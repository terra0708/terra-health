import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, alpha } from '@mui/material';
import { format } from 'date-fns';
import { useCustomerStore } from './useCustomerStore';
import { useCustomerSettingsStore } from './useCustomerSettingsStore';
import { useLookup } from '../../../common/hooks/useLookup';

export const useCustomers = () => {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const { getStatus, getSource, getService, getTag } = useLookup();
    const { customers, deleteCustomer, syncWithMockData } = useCustomerStore();
    const settings = useCustomerSettingsStore();

    const lang = i18n.language;

    // --- MAIN STATES ---
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState([]);
    const [countryFilter, setCountryFilter] = useState([]);
    const [sourceFilter, setSourceFilter] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [infoTarget, setInfoTarget] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // --- LOCAL FILTERS (For Apply Button Logic) ---
    const [localFilters, setLocalFilters] = useState({
        status: [], country: [], source: [],
        services: [], tags: [], dateRange: { start: '', end: '' }
    });

    // Initial Sync
    useEffect(() => {
        if (syncWithMockData) syncWithMockData();
        if (settings.repairData) settings.repairData();
    }, []);

    // Sync Main -> Local when opening filters
    useEffect(() => {
        if (showFilters) {
            setLocalFilters({
                status: statusFilter, country: countryFilter, source: sourceFilter,
                services: selectedServices, tags: selectedTags, dateRange: dateRange
            });
        }
    }, [showFilters]);

    // --- ACTIONS ---
    const applyFilters = () => {
        setStatusFilter(localFilters.status);
        setCountryFilter(localFilters.country);
        setSourceFilter(localFilters.source);
        setSelectedServices(localFilters.services);
        setSelectedTags(localFilters.tags);
        setDateRange(localFilters.dateRange);
        setPage(0);
    };

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter([]);
        setCountryFilter([]);
        setSourceFilter([]);
        setSelectedServices([]);
        setSelectedTags([]);
        setDateRange({ start: '', end: '' });
        setLocalFilters({
            status: [], country: [], source: [],
            services: [], tags: [], dateRange: { start: '', end: '' }
        });
        setPage(0);
    };

    const handleEdit = (customer) => {
        setEditTarget(customer);
        setDrawerOpen(true);
    };

    const handleInfo = (customer) => {
        setInfoTarget(customer);
        setDetailsOpen(true);
    };

    const onDelete = (id) => {
        deleteCustomer(id);
        setSnackbar({ open: true, message: t('common.success_delete'), severity: 'success' });
    };

    // --- HELPERS ---
    const getLocalizedLabel = (item, type) => {
        if (!item) return '-';
        if (type === 'service') return lang === 'tr' ? item.name_tr : (item.name_en || item.name_tr);
        return lang === 'tr' ? item.label_tr : (item.label_en || item.label_tr);
    };

    // --- COMPUTED ---
    const filteredCustomers = useMemo(() => {
        return customers.filter(c => {
            const nameMatch = c.name?.toLowerCase().includes(searchTerm.toLowerCase());
            const phoneMatch = c.phone?.includes(searchTerm);
            const matchesSearch = nameMatch || phoneMatch;

            const matchesStatus = statusFilter.length === 0 || statusFilter.includes(c.status);
            const matchesCountry = countryFilter.length === 0 || countryFilter.includes(c.country);

            const sourceVal = typeof c.source === 'object' ? c.source?.type : c.source;
            const matchesSource = sourceFilter.length === 0 || sourceFilter.includes(sourceVal);

            const matchesServices = selectedServices.length === 0 ||
                selectedServices.every(s => c.services?.includes(s));

            const matchesTags = selectedTags.length === 0 ||
                selectedTags.some(t => c.tags?.includes(t));

            let matchesDate = true;
            if (dateRange.start || dateRange.end) {
                const regDate = new Date(c.registrationDate);
                if (dateRange.start && regDate < new Date(dateRange.start)) matchesDate = false;
                if (dateRange.end && regDate > new Date(dateRange.end)) matchesDate = false;
            }

            return matchesSearch && matchesStatus && matchesCountry && matchesSource && matchesServices && matchesTags && matchesDate;
        });
    }, [customers, searchTerm, statusFilter, countryFilter, sourceFilter, selectedServices, selectedTags, dateRange]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (statusFilter.length > 0) count++;
        if (countryFilter.length > 0) count++;
        if (sourceFilter.length > 0) count++;
        if (selectedServices.length > 0) count++;
        if (selectedTags.length > 0) count++;
        if (dateRange.start || dateRange.end) count++;
        return count;
    }, [statusFilter, countryFilter, sourceFilter, selectedServices, selectedTags, dateRange]);

    const stats = useMemo(() => ({
        total: customers.length,
        active: customers.filter(c => ['active', 'process', 'appointment', 'post_op'].includes(c.status)).length,
        pending: customers.filter(c => ['new', 'pending', 'contacted'].includes(c.status)).length,
        completed: customers.filter(c => ['completed', 'sale'].includes(c.status)).length
    }), [customers]);

    const paginatedCustomers = useMemo(() => {
        return filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredCustomers, page, rowsPerPage]);

    return {
        // States
        searchTerm, setSearchTerm,
        showFilters, setShowFilters,
        localFilters, setLocalFilters,
        page, setPage,
        rowsPerPage, setRowsPerPage,
        drawerOpen, setDrawerOpen,
        detailsOpen, setDetailsOpen,
        editTarget, setEditTarget,
        infoTarget, setInfoTarget,
        snackbar, setSnackbar,

        // Computed
        filteredCustomers: paginatedCustomers,
        totalCount: filteredCustomers.length,
        activeFilterCount,
        stats,
        lang,
        settings,

        // Actions
        applyFilters,
        resetFilters,
        handleEdit,
        handleInfo,
        onDelete,
        getLocalizedLabel,
        getStatus, getSource, getService, getTag
    };
};
