import React from 'react';
import { Box, Skeleton, Stack, Paper } from '@mui/material';

/**
 * Loading Skeleton Components
 * 
 * Çeşitli içerik tipleri için skeleton loader'lar
 * Modüler yapıya uygun - her modül kendi skeleton'ını kullanabilir
 */

/**
 * Table Skeleton
 */
export const TableSkeleton = ({ rows = 5, columns = 4, 'aria-label': ariaLabel = 'Loading table' }) => {
    return (
        <Box role="status" aria-label={ariaLabel} aria-live="polite">
            {/* Header */}
            <Stack direction="row" spacing={2} sx={{ mb: 2, px: 2 }}>
                {Array.from({ length: columns }).map((_, idx) => (
                    <Skeleton 
                        key={idx} 
                        variant="rectangular" 
                        width="100%" 
                        height={40}
                        sx={{ borderRadius: '8px' }}
                        aria-hidden="true"
                    />
                ))}
            </Stack>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <Stack 
                    key={rowIdx} 
                    direction="row" 
                    spacing={2} 
                    sx={{ mb: 1, px: 2 }}
                >
                    {Array.from({ length: columns }).map((_, colIdx) => (
                        <Skeleton 
                            key={colIdx} 
                            variant="rectangular" 
                            width="100%" 
                            height={56}
                            sx={{ borderRadius: '8px' }}
                            aria-hidden="true"
                        />
                    ))}
                </Stack>
            ))}
        </Box>
    );
};

/**
 * Card Skeleton
 */
export const CardSkeleton = ({ count = 3, variant = 'default', 'aria-label': ariaLabel = 'Loading cards' }) => {
    if (variant === 'grid') {
        return (
            <Box 
                role="status" 
                aria-label={ariaLabel} 
                aria-live="polite"
                sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}
            >
                {Array.from({ length: count }).map((_, idx) => (
                    <Paper key={idx} elevation={0} sx={{ p: 3, borderRadius: '16px' }}>
                        <Skeleton variant="circular" width={48} height={48} sx={{ mb: 2 }} aria-hidden="true" />
                        <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} aria-hidden="true" />
                        <Skeleton variant="text" width="100%" height={20} aria-hidden="true" />
                        <Skeleton variant="text" width="80%" height={20} aria-hidden="true" />
                    </Paper>
                ))}
            </Box>
        );
    }

    return (
        <Stack spacing={2} role="status" aria-label={ariaLabel} aria-live="polite">
            {Array.from({ length: count }).map((_, idx) => (
                <Paper key={idx} elevation={0} sx={{ p: 3, borderRadius: '16px' }}>
                    <Stack direction="row" spacing={2}>
                        <Skeleton variant="circular" width={56} height={56} aria-hidden="true" />
                        <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} aria-hidden="true" />
                            <Skeleton variant="text" width="100%" height={20} aria-hidden="true" />
                            <Skeleton variant="text" width="80%" height={20} aria-hidden="true" />
                        </Box>
                    </Stack>
                </Paper>
            ))}
        </Stack>
    );
};

/**
 * List Skeleton
 */
export const ListSkeleton = ({ items = 5, 'aria-label': ariaLabel = 'Loading list' }) => {
    return (
        <Stack spacing={1} role="status" aria-label={ariaLabel} aria-live="polite">
            {Array.from({ length: items }).map((_, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                    <Skeleton variant="circular" width={40} height={40} aria-hidden="true" />
                    <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="40%" height={20} sx={{ mb: 0.5 }} aria-hidden="true" />
                        <Skeleton variant="text" width="60%" height={16} aria-hidden="true" />
                    </Box>
                    <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: '8px' }} aria-hidden="true" />
                </Box>
            ))}
        </Stack>
    );
};

/**
 * Form Skeleton
 */
export const FormSkeleton = ({ fields = 5, 'aria-label': ariaLabel = 'Loading form' }) => {
    return (
        <Stack spacing={3} role="status" aria-label={ariaLabel} aria-live="polite">
            {Array.from({ length: fields }).map((_, idx) => (
                <Box key={idx}>
                    <Skeleton variant="text" width="30%" height={20} sx={{ mb: 1 }} aria-hidden="true" />
                    <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: '12px' }} aria-hidden="true" />
                </Box>
            ))}
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: '12px' }} aria-hidden="true" />
                <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: '12px' }} aria-hidden="true" />
            </Stack>
        </Stack>
    );
};

/**
 * Dashboard Stats Skeleton
 */
export const StatsSkeleton = ({ count = 4, 'aria-label': ariaLabel = 'Loading statistics' }) => {
    return (
        <Box 
            role="status" 
            aria-label={ariaLabel} 
            aria-live="polite"
            sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: `repeat(${Math.min(count, 4)}, 1fr)` }, gap: 2 }}
        >
            {Array.from({ length: count }).map((_, idx) => (
                <Paper key={idx} elevation={0} sx={{ p: 3, borderRadius: '16px' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" width="60%" height={16} sx={{ mb: 1 }} aria-hidden="true" />
                            <Skeleton variant="text" width="100%" height={32} aria-hidden="true" />
                        </Box>
                        <Skeleton variant="circular" width={48} height={48} aria-hidden="true" />
                    </Stack>
                    <Skeleton variant="text" width="40%" height={14} aria-hidden="true" />
                </Paper>
            ))}
        </Box>
    );
};

/**
 * Generic Page Skeleton
 */
export const PageSkeleton = ({ 'aria-label': ariaLabel = 'Loading page' }) => {
    return (
        <Box sx={{ p: 3 }} role="status" aria-label={ariaLabel} aria-live="polite">
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Skeleton variant="text" width="40%" height={40} sx={{ mb: 1 }} aria-hidden="true" />
                <Skeleton variant="text" width="60%" height={20} aria-hidden="true" />
            </Box>
            
            {/* Stats */}
            <StatsSkeleton count={4} />
            
            {/* Content */}
            <Box sx={{ mt: 4 }}>
                <Skeleton variant="text" width="30%" height={28} sx={{ mb: 2 }} aria-hidden="true" />
                <TableSkeleton rows={5} columns={6} />
            </Box>
        </Box>
    );
};

export default {
    Table: TableSkeleton,
    Card: CardSkeleton,
    List: ListSkeleton,
    Form: FormSkeleton,
    Stats: StatsSkeleton,
    Page: PageSkeleton
};
