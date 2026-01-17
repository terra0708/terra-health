import React from 'react';
import {
    Box, Typography, Paper, Button, useTheme, alpha, TablePagination,
    Snackbar, Alert, useMediaQuery
} from '@mui/material';
import { UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    CustomerDrawer,
    CustomerMobileCard,
    CustomerDetailsDialog,
    CustomerFilters,
    CustomerTable,
    CustomerStats,
    useCustomers
} from '../../modules/customers';

const CustomersPage = () => {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const {
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
        filteredCustomers,
        totalCount,
        activeFilterCount,
        stats,
        settings,
        lang,
        applyFilters,
        resetFilters,
        handleEdit,
        handleInfo,
        onDelete,
        getStatus, getService, getSource
    } = useCustomers();

    return (
        <Box sx={{ animation: 'fadeIn 0.6s ease', pb: 4 }}>
            {/* STAT CARDS */}
            <CustomerStats stats={stats} t={t} />

            {/* HEADER */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.03em' }}>{t('customers.title')}</Typography>
                <Button
                    variant="contained"
                    startIcon={<UserPlus size={18} />}
                    onClick={() => { setEditTarget(null); setDrawerOpen(true); }}
                    sx={{
                        borderRadius: '16px', px: 3, py: 1.2, fontWeight: 800,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.25)}`
                    }}
                >
                    {t('customers.add_customer')}
                </Button>
            </Box>

            {/* ADVANCED FILTERS SECTION */}
            <Paper elevation={0} sx={{ borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, mb: 3, overflow: 'hidden' }}>
                <CustomerFilters
                    searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                    showFilters={showFilters} setShowFilters={setShowFilters}
                    activeFilterCount={activeFilterCount}
                    resetFilters={resetFilters}
                    localFilters={localFilters} setLocalFilters={setLocalFilters}
                    applyFilters={applyFilters}
                    settings={settings}
                    lang={lang}
                    getStatus={getStatus} getService={getService} getSource={getSource}
                    t={t}
                />
            </Paper>

            {/* DATA CONTENT */}
            <Paper elevation={0} sx={{ borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}>
                {isMobile ? (
                    <Box sx={{ p: 2 }}>
                        {filteredCustomers.map((c) => (
                            <CustomerMobileCard key={c.id} customer={c} t={t} theme={theme} onEdit={handleEdit} onInfo={handleInfo} />
                        ))}
                    </Box>
                ) : (
                    <CustomerTable
                        customers={filteredCustomers}
                        onInfo={handleInfo}
                        onEdit={handleEdit}
                        onDelete={onDelete}
                        getStatus={getStatus}
                        getSource={getSource}
                        settings={settings}
                        lang={lang}
                        t={t}
                        i18n={i18n}
                    />
                )}
                <TablePagination
                    component="div"
                    count={totalCount}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, p) => setPage(p)}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    labelRowsPerPage={t('common.rows_per_page')}
                />
            </Paper>

            <CustomerDrawer
                open={drawerOpen}
                onClose={() => { setDrawerOpen(false); setEditTarget(null); }}
                customer={editTarget}
                t={t}
            />

            <CustomerDetailsDialog
                open={detailsOpen}
                onClose={() => { setDetailsOpen(false); setInfoTarget(null); }}
                customer={infoTarget}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', borderRadius: '12px', fontWeight: 600 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </Box >
    );
};

export default CustomersPage;
