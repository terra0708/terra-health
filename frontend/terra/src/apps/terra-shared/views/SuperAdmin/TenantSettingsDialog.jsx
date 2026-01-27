import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, Tabs, Tab, Box, IconButton
} from '@mui/material';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ModulesTab from './TenantSettingsTabs/ModulesTab';
import AdminsTab from './TenantSettingsTabs/AdminsTab';
import QuotasTab from './TenantSettingsTabs/QuotasTab';

/**
 * Tenant Settings Dialog with Tabs
 * - Modules: Manage tenant modules
 * - Admins: Full CRUD for tenant admins
 * - Quotas: Manage tenant quotas
 */
const TenantSettingsDialog = ({ open, onClose, tenant }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(0);

    const handleClose = () => {
        setActiveTab(0);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    minHeight: '70vh',
                    maxHeight: '90vh',
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0 }}>
                <Box>
                    {t('super_admin.tenants.settings', 'Tenant Settings')} - {tenant?.name}
                </Box>
                <IconButton onClick={handleClose} size="small">
                    <X size={20} />
                </IconButton>
            </DialogTitle>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                    <Tab label={t('super_admin.tenants.modules', 'Modules')} />
                    <Tab label={t('super_admin.tenants.admins', 'Admins')} />
                    <Tab label={t('super_admin.tenants.quotas', 'Quotas')} />
                </Tabs>
            </Box>

            <DialogContent sx={{ pt: 3 }}>
                {activeTab === 0 && <ModulesTab tenant={tenant} />}
                {activeTab === 1 && <AdminsTab tenant={tenant} />}
                {activeTab === 2 && <QuotasTab tenant={tenant} />}
            </DialogContent>
        </Dialog>
    );
};

export default TenantSettingsDialog;
