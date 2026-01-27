import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Stack, Alert, CircularProgress } from '@mui/material';
import { Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUpdateTenant } from '@shared/modules/super-admin';

/**
 * Quotas Tab - Manage tenant quotas and limits
 */
const QuotasTab = ({ tenant }) => {
    const { t } = useTranslation();
    const updateTenant = useUpdateTenant();
    const [maxUsers, setMaxUsers] = useState(tenant?.maxUsers || 10);
    const [domain, setDomain] = useState(tenant?.domain || '');
    const [success, setSuccess] = useState(false);

    const handleSave = async () => {
        try {
            await updateTenant.mutateAsync({
                tenantId: tenant.id,
                maxUsers,
                domain
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to update tenant quotas:', error);
        }
    };

    return (
        <Box>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                {t('super_admin.tenants.quotas_and_domain', 'Quotas & Domain')}
            </Typography>

            <Stack spacing={4} sx={{ maxWidth: 500 }}>
                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {t('common.success_saved', 'Changes saved successfully')}
                    </Alert>
                )}

                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                        {t('super_admin.tenants.domain', 'Domain')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {t('super_admin.tenants.domain_description', 'Enforced email domain for all users in this tenant.')}
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="example.com"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value.toLowerCase().replace(/\s/g, ''))}
                        disabled={tenant?.schemaName === 'public'} // SYSTEM tenant domain shouldn't be easy to change
                    />
                </Box>

                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                        {t('super_admin.tenants.user_limit', 'User Limit')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {t('super_admin.tenants.user_limit_description', 'Maximum number of non-admin users allowed for this tenant.')}
                    </Typography>
                    <TextField
                        fullWidth
                        type="number"
                        value={maxUsers}
                        onChange={(e) => setMaxUsers(parseInt(e.target.value))}
                    />
                </Box>

                <Button
                    variant="contained"
                    startIcon={updateTenant.isPending ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
                    onClick={handleSave}
                    disabled={updateTenant.isPending || (maxUsers === tenant?.maxUsers && domain === tenant?.domain)}
                    sx={{ alignSelf: 'flex-start' }}
                >
                    {t('common.save_changes', 'Save Changes')}
                </Button>
            </Stack>
        </Box>
    );
};

export default QuotasTab;
