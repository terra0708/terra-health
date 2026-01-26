import React, { memo } from 'react';
import { Alert, AlertTitle } from '@mui/material';
import { AlertCircle } from 'lucide-react';

/**
 * Schema Pool Critical Alert Component
 * Shows critical warning when readyCount === 0
 * 
 * This alert appears at the top of the dashboard when no schemas are ready,
 * indicating that new customer registration cannot be processed.
 */
export const SchemaPoolCriticalAlert = memo(({ readyCount, t }) => {
    if (readyCount !== 0) return null;
    
    return (
        <Alert
            severity="error"
            icon={<AlertCircle size={24} />}
            sx={{ mb: 3 }}
        >
            <AlertTitle sx={{ fontWeight: 700 }}>
                {t('schema_pool.critical_warning')}
            </AlertTitle>
        </Alert>
    );
});

SchemaPoolCriticalAlert.displayName = 'SchemaPoolCriticalAlert';
