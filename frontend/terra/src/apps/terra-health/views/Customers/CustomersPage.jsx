import React from 'react';
import ClientsPageBase from '@shared/views/Clients/ClientsPage';
import {
    CustomerDrawer,
    CustomerDetailsDialog,
    useCustomers
} from '@terra-health/modules/customers';
import { useLookup } from '@shared/common/hooks/useLookup';
import { useTranslation } from 'react-i18next';
import { ModulePageWrapper } from '@common/ui';
import { usePerformance } from '@common/hooks';

/**
 * Health-specific Customers Page Wrapper
 * 
 * Bu component generic ClientsPage'i wrap eder ve health-specific
 * bağımlılıkları (CustomerDrawer, CustomerDetailsDialog, useCustomers) inject eder.
 */
const CustomersPage = () => {
    usePerformance('CustomersPage');
    const { t } = useTranslation(['terra-health', 'translation']);
    const { getStatus, getSource, getService, getTag } = useLookup();

    // Fetch parameters on mount
    React.useEffect(() => {
        settings?.fetchAll?.();
    }, []);

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
        onDelete
    } = useCustomers();

    return (
        <ModulePageWrapper moduleName="Customers" aria-label="Customers Management">
            <ClientsPageBase
                clients={filteredCustomers}
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                showFilters={showFilters} setShowFilters={setShowFilters}
                localFilters={localFilters} setLocalFilters={setLocalFilters}
                page={page} setPage={setPage}
                rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage}
                drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen}
                detailsOpen={detailsOpen} setDetailsOpen={setDetailsOpen}
                editTarget={editTarget} setEditTarget={setEditTarget}
                infoTarget={infoTarget} setInfoTarget={setInfoTarget}
                snackbar={snackbar} setSnackbar={setSnackbar}
                filteredClients={filteredCustomers}
                totalCount={totalCount}
                activeFilterCount={activeFilterCount}
                stats={stats}
                settings={settings}
                lang={lang}
                applyFilters={applyFilters}
                resetFilters={resetFilters}
                handleEdit={handleEdit}
                handleInfo={handleInfo}
                onDelete={onDelete}
                getStatus={getStatus}
                getSource={getSource}
                getService={getService}
                getTag={getTag}
                ClientDrawer={CustomerDrawer}
                ClientDetailsDialog={CustomerDetailsDialog}
                showServices={true}
                showTags={true}
                customLabels={{
                    title: t('customers.title', 'Customers'),
                    total: t('customers.total_customers'),
                    active: t('customers.active_customers'),
                    pending: t('customers.pending_customers'),
                    completed: t('customers.completed_customers'),
                    addButton: t('customers.add_customer')
                }}
                t={t}
            />
        </ModulePageWrapper>
    );
};

export default CustomersPage;
