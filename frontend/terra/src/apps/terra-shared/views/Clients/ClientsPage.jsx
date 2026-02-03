import React from 'react';
import {
    Box, Typography, Paper, Button, useTheme, alpha, TablePagination,
    Snackbar, Alert, useMediaQuery, Chip
} from '@mui/material';
import { UserPlus, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    ClientTable,
    ClientFilters,
    ClientStats,
    ClientMobileCard
} from '@shared/modules/clients';
import { usePackageLabels } from '@shared/common/hooks/usePackageLabels';

/**
 * Generic Clients Page
 * 
 * Bu sayfa base client listesini gösterir ve generic'tir.
 * Domain-specific component'ler (Drawer, DetailsDialog) props olarak geçilir.
 */
const ClientsPage = ({
    // Required: Data and handlers
    clients,
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
    filteredClients,
    totalCount,
    activeFilterCount,
    stats,
    settings, // Domain-specific settings
    lang,
    applyFilters,
    resetFilters,
    handleEdit,
    handleInfo,
    onDelete,
    getStatus,
    getSource,
    getService,
    getTag,

    // Optional: Domain-specific components
    ClientDrawer = null,
    ClientDetailsDialog = null,

    // Optional: Domain-specific features
    showServices = false,
    showTags = false,

    // Optional: Custom labels
    customLabels = {},

    // Optional: translation function
    t: tProp
}) => {
    const { t: tInternal, i18n } = useTranslation();
    const t = tProp || tInternal;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { clientLabel, addClientLabel } = usePackageLabels();

    const getStatusChip = (statusValue) => {
        if (!getStatus) return null;
        const status = getStatus(statusValue);
        if (!status) return null;
        const { label, color } = status;
        const statusColor = typeof color === 'string' && color.startsWith('#') ? color : (theme.palette[color]?.main || color || theme.palette.primary.main);
        return (
            <Chip
                icon={<Circle size={8} fill="currentColor" />}
                label={label}
                size="small"
                sx={{
                    fontWeight: 800, borderRadius: '8px',
                    bgcolor: alpha(statusColor, 0.08),
                    color: statusColor,
                    border: `1px solid ${alpha(statusColor, 0.2)}`,
                    fontSize: '0.65rem',
                    '& .MuiChip-icon': { color: 'inherit' }
                }}
            />
        );
    };

    return (
        <Box sx={{ animation: 'fadeIn 0.6s ease', pb: 4 }}>
            {/* STAT CARDS */}
            <ClientStats
                stats={stats}
                t={t}
                labels={{
                    total: customLabels.total || t('clients.total_clients', 'Total Clients'),
                    active: customLabels.active || t('clients.active_clients', 'Active Clients'),
                    pending: customLabels.pending || t('clients.pending_clients', 'Pending Clients'),
                    completed: customLabels.completed || t('clients.completed_clients', 'Completed Clients')
                }}
            />

            {/* HEADER */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.03em' }}>
                    {customLabels.title || clientLabel}
                </Typography>
                {ClientDrawer && (
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
                        {customLabels.addButton || addClientLabel}
                    </Button>
                )}
            </Box>

            {/* ADVANCED FILTERS SECTION */}
            <Paper elevation={0} sx={{ borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, mb: 3, overflow: 'hidden' }}>
                <ClientFilters
                    searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                    showFilters={showFilters} setShowFilters={setShowFilters}
                    activeFilterCount={activeFilterCount}
                    resetFilters={resetFilters}
                    localFilters={localFilters} setLocalFilters={setLocalFilters}
                    applyFilters={applyFilters}
                    settings={settings}
                    lang={lang}
                    getStatus={getStatus} getService={getService} getSource={getSource} getTag={getTag}
                    showServices={showServices}
                    showTags={showTags}
                    t={t}
                />
            </Paper>

            {/* DATA CONTENT */}
            <Paper elevation={0} sx={{ borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}>
                {isMobile ? (
                    <Box sx={{ p: 2 }}>
                        {filteredClients.map((c) => (
                            <ClientMobileCard
                                key={c.id}
                                client={c}
                                t={t}
                                theme={theme}
                                onEdit={handleEdit}
                                onInfo={handleInfo}
                                getStatusChip={getStatusChip}
                                showServices={showServices}
                                showTags={showTags}
                                getService={getService}
                                getTag={getTag}
                            />
                        ))}
                    </Box>
                ) : (
                    <ClientTable
                        clients={filteredClients}
                        onInfo={handleInfo}
                        onEdit={handleEdit}
                        onDelete={onDelete}
                        getStatus={getStatus}
                        getSource={getSource}
                        settings={settings}
                        lang={lang}
                        t={t}
                        i18n={i18n}
                        showServices={showServices}
                        showTags={showTags}
                        getService={getService}
                        getTag={getTag}
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

            {/* Optional: Domain-specific Drawer */}
            {ClientDrawer && (
                <ClientDrawer
                    open={drawerOpen}
                    onClose={() => { setDrawerOpen(false); setEditTarget(null); }}
                    client={editTarget}
                    t={t}
                />
            )}

            {/* Optional: Domain-specific Details Dialog */}
            {ClientDetailsDialog && infoTarget && (
                <ClientDetailsDialog
                    open={detailsOpen}
                    onClose={() => { setDetailsOpen(false); setInfoTarget(null); }}
                    client={infoTarget}
                    t={t}
                />
            )}

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
        </Box>
    );
};

export default ClientsPage;
