import React, { memo, useState, useEffect } from 'react';
import { Box, Typography, Paper, useTheme, alpha } from '@mui/material';
import { Clock, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

/**
 * Schema Pool Activity Log Component
 * Shows last provisioning time with live relative time updates
 * 
 * CRITICAL: Uses useEffect with setInterval to update relative time every second
 * This ensures the time doesn't appear frozen when dashboard is open
 */
export const SchemaPoolActivityLog = memo(({ stats, t }) => {
    const theme = useTheme();
    const { i18n } = useTranslation();
    
    if (!stats) return null;
    
    const { lastProvisioningTime } = stats;
    
    // State for live relative time string
    const [relativeTime, setRelativeTime] = useState(null);
    const [isStagnant, setIsStagnant] = useState(false);
    
    useEffect(() => {
        if (!lastProvisioningTime) {
            setRelativeTime(null);
            setIsStagnant(false);
            return;
        }
        
        const updateRelativeTime = () => {
            try {
                const date = new Date(lastProvisioningTime);
                const locale = i18n.language.startsWith('tr') ? tr : enUS;
                const distance = formatDistanceToNow(date, { 
                    addSuffix: true,
                    locale 
                });
                setRelativeTime(distance);
                
                // Check if more than 1 hour has passed
                const hoursDiff = (Date.now() - date.getTime()) / (1000 * 60 * 60);
                setIsStagnant(hoursDiff > 1);
            } catch (error) {
                console.error('Error formatting relative time:', error);
                setRelativeTime(null);
            }
        };
        
        // Initial update
        updateRelativeTime();
        
        // Update every second for live heartbeat
        const interval = setInterval(updateRelativeTime, 1000);
        
        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, [lastProvisioningTime, i18n.language]);
    
    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: '24px',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                background: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.background.paper, 0.8)
                    : '#ffffff'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(
                        isStagnant ? theme.palette.warning.main : theme.palette.info.main,
                        0.1
                    ),
                    color: isStagnant ? theme.palette.warning.main : theme.palette.info.main
                }}>
                    {isStagnant ? (
                        <AlertTriangle size={24} />
                    ) : (
                        <Clock size={24} />
                    )}
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.1em' }}>
                        {t('schema_pool.activity_log')}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {t('schema_pool.last_provisioning')}
                    </Typography>
                </Box>
            </Box>
            
            {lastProvisioningTime ? (
                <Box>
                    <Typography 
                        variant="body1" 
                        sx={{ 
                            fontWeight: 600, 
                            color: isStagnant ? theme.palette.warning.main : 'text.primary',
                            mb: 0.5
                        }}
                    >
                        {relativeTime || '...'}
                    </Typography>
                    {isStagnant && (
                        <Typography variant="caption" sx={{ color: theme.palette.warning.main }}>
                            {t('schema_pool.stagnation_warning')}
                        </Typography>
                    )}
                </Box>
            ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                    {t('schema_pool.no_provisioning_yet')}
                </Typography>
            )}
        </Paper>
    );
});

SchemaPoolActivityLog.displayName = 'SchemaPoolActivityLog';
