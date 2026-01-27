import React from 'react';
import { Box, Typography, Chip, Stack, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { LoadingSpinner } from '@common/ui';
import { useTenantModules } from '@shared/modules/super-admin';

/**
 * Modules Tab - Display tenant modules (read-only for now)
 */
const ModulesTab = ({ tenant }) => {
    const { t } = useTranslation();
    const { data: modules, isLoading } = useTenantModules(tenant?.id);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <Box>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                {t('super_admin.tenants.assigned_modules', 'Assigned Modules')}
            </Typography>

            {modules && modules.length > 0 ? (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {modules.map((module) => (
                        <Chip
                            key={module}
                            label={module.replace('MODULE_', '')}
                            color="primary"
                            variant="outlined"
                        />
                    ))}
                </Stack>
            ) : (
                <Typography color="text.secondary">
                    {t('super_admin.tenants.no_modules', 'No modules assigned')}
                </Typography>
            )}
        </Box>
    );
};

export default ModulesTab;
