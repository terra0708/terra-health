import React from 'react';
import {
    Box, Typography, Paper, IconButton, Button, useTheme, alpha,
    TablePagination, Badge
} from '@mui/material';
import { Plus, RefreshCw, RotateCcw, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    ReminderCard,
    ReminderFilters,
    AddReminderDialog,
    useReminders,
    useReminderStore
} from '@shared/modules/reminders';

/**
 * Generic Reminders Page
 * 
 * Bu sayfa reminders modülünü gösterir ve generic'tir.
 * Health-specific bağımlılıklar (CustomerDetailsDialog, customers) optional olarak
 * props ile geçilebilir.
 */
const RemindersPage = ({ 
    // Optional: Health-specific components
    CustomerDetailsDialog = null,
    // Optional: Customers resolver for migration and enrichment
    customersResolver = null,
    // Optional: Migration config
    migrationConfig = null,
    // Optional: Customers list for AddReminderDialog
    customers = []
}) => {
    const theme = useTheme();
    const { addReminder } = useReminderStore();
    
    const {
        categories, subCategories, statuses,
        openAddDialog, setOpenAddDialog,
        editingReminder, setEditingReminder,
        page, setPage,
        rowsPerPage, setRowsPerPage,
        detailsOpen, setDetailsOpen,
        selectedCustomer,
        searchQuery, setSearchQuery,
        showFilters, setShowFilters,
        localFilters, setLocalFilters,
        paginatedReminders,
        totalCount,
        activeFilterCount,
        i18n, t,
        applyFilters,
        resetFilters,
        handleAddSubmit,
        handleDelete,
        handleEdit,
        handleShowInfo,
        handleChangeStatus
    } = useReminders({
        customersResolver,
        enableMigration: !!migrationConfig,
        migrationConfig
    });

    const generateRandomReminders = () => {
        const randomReminders = [
            { title: 'Rastgele Hatırlatıcı 1', note: 'Demo hatırlatıcı', categoryId: 'personal', statusId: 'pending' },
            { title: 'Rastgele Hatırlatıcı 2', note: 'Demo hatırlatıcı', categoryId: 'finance', statusId: 'pending' }
        ];
        randomReminders.forEach(r => addReminder(r));
    };

    const getDisplayName = (item) => item ? (i18n.language === 'tr' ? item.label_tr : (item.label_en || item.label_tr)) : '';

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight={900} sx={{ mb: 1, background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {t('reminders.title')}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>{t('reminders.subtitle', ' ')}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" startIcon={<RefreshCw size={18} />} onClick={generateRandomReminders} sx={{ borderRadius: 3, fontWeight: 600, textTransform: 'none' }}>Demo</Button>
                    <Button
                        variant="contained" startIcon={<Plus size={20} />}
                        onClick={(e) => { e.currentTarget.blur(); setEditingReminder(null); setOpenAddDialog(true); }}
                        sx={{ borderRadius: 3, px: 3, py: 1.5, fontWeight: 700, textTransform: 'none', background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, boxShadow: `0 8px 166px ${alpha(theme.palette.primary.main, 0.3)}` }}
                    >
                        {t('reminders.add_new')}
                    </Button>
                </Box>
            </Box>

            {/* ADVANCED FILTER BAR */}
            <Paper elevation={0} sx={{ borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, mb: 3, overflow: 'hidden' }}>
                <ReminderFilters
                    searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                    activeFilterCount={activeFilterCount}
                    showFilters={showFilters} setShowFilters={setShowFilters}
                    resetFilters={resetFilters}
                    localFilters={localFilters} setLocalFilters={setLocalFilters}
                    applyFilters={applyFilters}
                    statuses={statuses} categories={categories} subCategories={subCategories}
                    getDisplayName={getDisplayName}
                    t={t}
                />
            </Paper>

            <Box sx={{ minHeight: 400 }}>
                {paginatedReminders.length > 0 ? (
                    paginatedReminders.map(reminder => (
                        <ReminderCard
                            key={`${reminder.type}-${reminder.id}`}
                            reminder={reminder}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onShowInfo={handleShowInfo}
                            onChangeStatus={handleChangeStatus}
                            t={t} i18n={i18n}
                            categories={categories} subCategories={subCategories} statuses={statuses}
                        />
                    ))
                ) : (
                    <Box sx={{ textAlign: 'center', py: 10, bgcolor: 'background.paper', borderRadius: 4, border: `1px dashed ${theme.palette.divider}` }}>
                        <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.05), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                            <Clock size={40} color={theme.palette.primary.main} style={{ opacity: 0.5 }} />
                        </Box>
                        <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>{t('reminders.no_scheduled_reminders')}</Typography>
                        <Typography variant="body2" color="text.secondary">{t('reminders.empty_state_desc')}</Typography>
                    </Box>
                )}
            </Box>

            <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                }}
                labelRowsPerPage={t('common.rows_per_page')}
                sx={{ borderTop: `1px solid ${theme.palette.divider}`, mt: 2 }}
            />

            <AddReminderDialog
                open={openAddDialog}
                onClose={() => setOpenAddDialog(false)}
                onAdd={handleAddSubmit}
                editingReminder={editingReminder}
                customers={customers}
                statuses={statuses}
                categories={categories}
                subCategories={subCategories}
            />

            {/* Optional: Health-specific CustomerDetailsDialog */}
            {CustomerDetailsDialog && selectedCustomer && (
                <CustomerDetailsDialog
                    open={detailsOpen}
                    onClose={() => setDetailsOpen(false)}
                    customer={selectedCustomer}
                />
            )}
        </Box>
    );
};

export default RemindersPage;
