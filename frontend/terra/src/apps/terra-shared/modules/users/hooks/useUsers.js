import { useState, useEffect, useMemo } from 'react';
import { useUserStore } from './useUserStore';

export const useUsers = () => {
    const store = useUserStore();
    const { users, loading, fetchUsers } = store;

    const [searchTerm, setSearchTerm] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Fetch users on mount
    useEffect(() => {
        fetchUsers().catch(err => {
            console.error('Failed to fetch users:', err);
        });
    }, [fetchUsers]);

    const handleOpenDrawer = (user = null) => {
        setEditUser(user);
        setDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setEditUser(null);
        setDrawerOpen(false);
    };

    // Filter users by search term
    const allFilteredUsers = useMemo(() => {
        if (!users || users.length === 0) return [];
        return users.filter(user => {
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
            const email = (user.email || '').toLowerCase();
            const term = searchTerm.toLowerCase();
            return fullName.includes(term) || email.includes(term);
        });
    }, [users, searchTerm]);

    // Paginate users
    const paginatedUsers = useMemo(() => {
        return allFilteredUsers.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
    }, [allFilteredUsers, page, rowsPerPage]);

    // Calculate stats
    const totalTeam = users?.length || 0;
    const adminCount = users?.filter(u => u.roles?.includes('ROLE_ADMIN')).length || 0;

    return {
        searchTerm,
        setSearchTerm: (val) => { setSearchTerm(val); setPage(0); },
        drawerOpen,
        editUser,
        handleOpenDrawer,
        handleCloseDrawer,
        filteredUsers: paginatedUsers,
        totalCount: allFilteredUsers.length,
        page,
        setPage,
        rowsPerPage,
        setRowsPerPage,
        totalTeam,
        adminCount,
        loading,
        store // Expose the store to access actions
    };
};
