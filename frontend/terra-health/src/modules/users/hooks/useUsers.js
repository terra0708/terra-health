import { useState, useMemo } from 'react';
import { MOCK_USERS } from '../data/mockData';

export const useUsers = () => {
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
        return MOCK_USERS.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

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
        totalTeam: MOCK_USERS.length,
        adminCount: MOCK_USERS.filter(u => u.role === 'admin').length
    };
};
