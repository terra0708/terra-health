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
    
    // Check if impersonation is active from JWT token
    // TODO: Parse JWT to check is_impersonation claim
    // For now, check if user has a special flag or check JWT directly
    const token = localStorage.getItem('token');
    const isImpersonation = token ? checkImpersonationToken(token) : false;
    
    // Extract impersonation info from token
    const impersonationInfo = token ? extractImpersonationInfo(token) : null;
    
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
            localStorage.removeItem('token');
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

/**
 * Check if token is an impersonation token by parsing JWT.
 * Decodes JWT payload and checks for is_impersonation claim.
 */
function checkImpersonationToken(token) {
    if (!token) return false;
    try {
        // JWT format: header.payload.signature
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        
        // Decode JWT payload (base64url)
        // Note: atob doesn't handle base64url properly, but for our use case it works
        // In production, consider using a JWT library like jwt-decode
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload.is_impersonation === true;
    } catch (error) {
        console.warn('Failed to parse JWT token:', error);
        return false;
    }
}

/**
 * Extract impersonation info from JWT token.
 */
function extractImpersonationInfo(token) {
    if (!token) return null;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        
        if (!payload.is_impersonation) return null;
        
        return {
            impersonatedEmail: payload.sub || payload.impersonated_user_id || 'Unknown',
            originalUserId: payload.original_user_id || null,
        };
    } catch (error) {
        console.warn('Failed to extract impersonation info:', error);
        return null;
    }
}

export default ImpersonationBanner;
