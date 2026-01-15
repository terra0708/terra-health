import { useState, useMemo } from 'react';
import { mockCustomers } from '../data/mockData';

export const useCustomers = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editCustomer, setEditCustomer] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [statusFilter, setStatusFilter] = useState('all');

    // Filter customers based on search term and status
    const filteredCustomers = useMemo(() => {
        let filtered = mockCustomers;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(customer =>
                customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.phone.includes(searchTerm) ||
                customer.consultant.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(customer => customer.status === statusFilter);
        }

        return filtered;
    }, [searchTerm, statusFilter]);

    // Paginated customers
    const paginatedCustomers = useMemo(() => {
        const start = page * rowsPerPage;
        return filteredCustomers.slice(start, start + rowsPerPage);
    }, [filteredCustomers, page, rowsPerPage]);

    // Statistics
    const stats = useMemo(() => {
        const total = mockCustomers.length;
        const active = mockCustomers.filter(c => c.status === 'active').length;
        const pending = mockCustomers.filter(c => c.status === 'pending').length;
        const completed = mockCustomers.filter(c => c.status === 'completed').length;

        return { total, active, pending, completed };
    }, []);

    const handleOpenDrawer = (customer = null) => {
        setEditCustomer(customer);
        setDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setDrawerOpen(false);
        setEditCustomer(null);
    };

    return {
        searchTerm,
        setSearchTerm,
        drawerOpen,
        editCustomer,
        handleOpenDrawer,
        handleCloseDrawer,
        filteredCustomers: paginatedCustomers,
        totalCount: filteredCustomers.length,
        stats,
        page,
        setPage,
        rowsPerPage,
        setRowsPerPage,
        statusFilter,
        setStatusFilter
    };
};
