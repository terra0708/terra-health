import React from 'react';
import { Box } from '@mui/material';
import { ErrorBoundary, LoadingSpinner } from '@common/ui';
import { usePerformance } from '@common/hooks';

/**
 * Module Page Wrapper
 * 
 * Her modül sayfası için standart wrapper
 * - Error Boundary
 * - Loading State
 * - Performance Monitoring
 * - Accessibility
 */
const ModulePageWrapper = ({
    children,
    moduleName,
    loading = false,
    error = null,
    fallback = null,
    'aria-label': ariaLabel,
    ...props
}) => {
    // Performance monitoring (dev mode only)
    usePerformance(moduleName || 'ModulePage');

    // Loading state
    if (loading) {
        return (
            <Box
                role="status"
                aria-live="polite"
                aria-label={ariaLabel || `${moduleName} loading`}
                {...props}
            >
                {fallback || <LoadingSpinner message={`Loading ${moduleName}...`} />}
            </Box>
        );
    }

    // Error state
    if (error) {
        return (
            <ErrorBoundary level="component" moduleName={moduleName}>
                <Box
                    role="alert"
                    aria-live="assertive"
                    aria-label={ariaLabel || `${moduleName} error`}
                    {...props}
                >
                    {children}
                </Box>
            </ErrorBoundary>
        );
    }

    // Normal render with error boundary
    return (
        <ErrorBoundary level="component" moduleName={moduleName}>
            <Box
                role="main"
                aria-label={ariaLabel || moduleName}
                {...props}
            >
                {children}
            </Box>
        </ErrorBoundary>
    );
};

export default ModulePageWrapper;
