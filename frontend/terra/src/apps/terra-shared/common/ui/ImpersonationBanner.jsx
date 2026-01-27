import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '@shared/store/authStore';
import { useNavigate } from 'react-router-dom';
import apiClient from '@shared/core/api';

/**
 * Impersonation Banner Component
 * 
 * CRITICAL: Displays a red blinking banner at the top of the screen when impersonation is active.
 * Prevents Super Admin from accidentally deleting/modifying data thinking they are the impersonated user.
 * 
 * Features:
 * - Red background with blinking/pulsing animation
 * - Shows impersonated user email and original Super Admin email
 * - "Exit Impersonation" button to end session
 * - Fixed position at top of screen (z-index: 9999)
 */
const ImpersonationBanner = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    
    // CRITICAL: Read impersonation status from authStore (populated by /api/v1/auth/me endpoint)
    // Token is in HttpOnly cookie and cannot be accessed via JavaScript for security
    const isImpersonation = user?.isImpersonation || false;
    
    // Extract impersonation info from user object
    const impersonationInfo = isImpersonation ? {
        impersonatedEmail: user?.impersonatedEmail || user?.email || 'Unknown',
        originalEmail: user?.originalEmail || null,
        originalUserId: user?.originalUserId || null
    } : null;
    
    if (!isImpersonation || !impersonationInfo) {
        return null;
    }
    
    const handleExitImpersonation = async () => {
        try {
            // Clear impersonation token and logout
            // This will redirect to login, and Super Admin can login again to access dashboard
            logout();
        } catch (error) {
            console.error('Failed to exit impersonation:', error);
            // Fallback: manual redirect
            // CRITICAL: Token is in HttpOnly cookie, cannot remove from localStorage
            localStorage.removeItem('tenantId');
            window.location.href = '/login';
        }
    };
    
    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                backgroundColor: '#d32f2f',
                color: 'white',
                py: 1.5,
                px: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                animation: 'pulse 1s infinite',
                '@keyframes pulse': {
                    '0%, 100%': {
                        opacity: 0.9,
                    },
                    '50%': {
                        opacity: 1,
                    },
                },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AlertTriangle size={20} />
                <Box>
                    <Typography variant="body2" fontWeight={700} sx={{ mb: 0.25 }}>
                        ⚠️ {t('impersonation.banner.title', 'IMPERSONATION MODE ACTIVE')}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.95 }}>
                        {t('impersonation.banner.acting_as', 'You are acting as:')} {impersonationInfo.impersonatedEmail}
                    </Typography>
                    {impersonationInfo.originalEmail && (
                        <Typography variant="caption" sx={{ opacity: 0.85, display: 'block', mt: 0.25 }}>
                            {t('impersonation.banner.original_user', 'Original user:')} {impersonationInfo.originalEmail}
                        </Typography>
                    )}
                </Box>
            </Box>
            
            <Button
                variant="contained"
                size="small"
                onClick={handleExitImpersonation}
                sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 700,
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    },
                }}
            >
                {t('impersonation.banner.exit', 'Exit Impersonation')}
            </Button>
        </Box>
    );
};

export default ImpersonationBanner;
