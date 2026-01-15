import { useState, useMemo } from 'react';
import { useUserStore } from './useUserStore';

export const useUsers = () => {
    const store = useUserStore();
    const { users } = store;

    const [searchTerm, setSearchTerm] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleOpenDrawer = (user = null) => {
        setEditUser(user);
        setDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setEditUser(null);
        setDrawerOpen(false);
    };

    const allFilteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const paginatedUsers = useMemo(() => {
        return allFilteredUsers.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
    }, [allFilteredUsers, page, rowsPerPage]);

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
        totalTeam: users.length,
        adminCount: users.filter(u => u.role === 'admin').length,
        store // Expose the store to access actions
    };
};
