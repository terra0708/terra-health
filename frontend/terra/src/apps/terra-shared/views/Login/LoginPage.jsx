import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Container, Alert, TextField, MenuItem, Button as MuiButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SettingsSwitchers, Button, TextField as CustomTextField } from '@common/ui';
import { useAuthStore, useAuthDiscovery } from '@shared/modules/auth';
import { z } from 'zod';

// Login steps
const LOGIN_STEPS = {
    EMAIL: 'email',
    TENANT_SELECTION: 'tenant_selection',
    PASSWORD: 'password'
};

// Email validation schema
const emailSchema = z.object({
    email: z.string().email('Invalid email address').min(1, 'Email is required')
});

// Password validation schema
const passwordSchema = z.object({
    password: z.string().min(1, 'Password is required')
});

const LoginPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    
    // Auth store hooks
    const login = useAuthStore((state) => state.login);
    const loading = useAuthStore((state) => state.loading);
    const authError = useAuthStore((state) => state.error);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const setDiscoveredTenantId = useAuthStore((state) => state.setDiscoveredTenantId);
    const clearDiscoveredTenantId = useAuthStore((state) => state.clearDiscoveredTenantId);
    
    // Discovery hook
    const { discoverTenants, loading: discoveryLoading, error: discoveryError } = useAuthDiscovery();
    
    // Local state
    const [step, setStep] = useState(LOGIN_STEPS.EMAIL);
    const [email, setEmail] = useState('');
    const [discoveredTenants, setDiscoveredTenants] = useState([]);
    const [selectedTenantId, setSelectedTenantId] = useState(null);
    const [error, setError] = useState(null);

    // Email form
    const emailForm = useForm({
        resolver: zodResolver(emailSchema),
        defaultValues: { email: '' }
    });

    // Password form
    const passwordForm = useForm({
        resolver: zodResolver(passwordSchema),
        defaultValues: { password: '' }
    });

    // Auth store error'ını local error state'e senkronize et
    useEffect(() => {
        if (authError) {
            setError(authError.message || 'An error occurred');
        }
    }, [authError]);

    // Discovery error'ını local error state'e senkronize et
    useEffect(() => {
        if (discoveryError) {
            setError(discoveryError);
        }
    }, [discoveryError]);

    // Get user from auth store to check roles
    const user = useAuthStore((state) => state.user);
    
    // Login başarılı olunca error temizle ve navigate et
    useEffect(() => {
        if (isAuthenticated) {
            setError(null);
            clearDiscoveredTenantId();
            
            // CRITICAL: Super Admin için otomatik yönlendirme
            // Check if user has ROLE_SUPER_ADMIN role
            const isSuperAdmin = user?.roles?.includes('ROLE_SUPER_ADMIN') || false;
            
            if (isSuperAdmin) {
                // Super Admin: Redirect to schema pool dashboard
                navigate('/super-admin/schema-pool', { replace: true });
            } else {
                // Normal user: Redirect to main dashboard
                navigate('/', { replace: true });
            }
        }
    }, [isAuthenticated, user, navigate, clearDiscoveredTenantId]);

    // Email submit handler
    const handleEmailSubmit = async (data) => {
        setError(null);
        setEmail(data.email);

        try {
            const result = await discoverTenants(data.email);
            
            if (!result.tenants || result.tenants.length === 0) {
                // SECURITY: Don't reveal that email doesn't exist (prevent user enumeration)
                setError('Unable to proceed. Please check your email or contact support.');
                return;
            }

            setDiscoveredTenants(result.tenants);

            if (result.isSingleTenant) {
                // Single tenant: automatically select and move to password step
                const tenant = result.singleTenant;
                setSelectedTenantId(tenant.tenantId);
                setDiscoveredTenantId(tenant.tenantId);
                setStep(LOGIN_STEPS.PASSWORD);
            } else {
                // Multiple tenants: show selection step
                setStep(LOGIN_STEPS.TENANT_SELECTION);
            }
        } catch (err) {
            setError(err.message || 'Failed to discover tenants. Please try again.');
        }
    };

    // Tenant selection handler
    const handleTenantSelect = (tenantId) => {
        setSelectedTenantId(tenantId);
        setDiscoveredTenantId(tenantId);
        setStep(LOGIN_STEPS.PASSWORD);
    };

    // Password submit handler
    const handlePasswordSubmit = async (data) => {
        setError(null);

        if (!selectedTenantId) {
            setError('Tenant ID is required');
            return;
        }

        try {
            await login({ 
                email: email, 
                password: data.password, 
                tenantId: selectedTenantId 
            });
            // Navigate işlemi useEffect'te yapılıyor (isAuthenticated değiştiğinde)
        } catch (error) {
            // api.js'den normalize edilmiş hata gelir
            setError(error.message || 'Login failed');
        }
    };

    // Back to email step
    const handleBack = () => {
        setStep(LOGIN_STEPS.EMAIL);
        setSelectedTenantId(null);
        setDiscoveredTenants([]);
        clearDiscoveredTenantId();
        setError(null);
        emailForm.reset();
        passwordForm.reset();
    };

    // Get selected tenant name
    const getSelectedTenantName = () => {
        const tenant = discoveredTenants.find(t => t.tenantId === selectedTenantId);
        return tenant?.tenantName || '';
    };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    py: 4,
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        borderRadius: 3,
                        bgcolor: 'background.paper',
                    }}
                >
                    <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        Terra-Health
                    </Typography>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                        {t('auth.welcome_message')}
                    </Typography>

                    <SettingsSwitchers sx={{ my: 2 }} />

                    {/* Error Alert */}
                    {error && (
                        <Alert 
                            severity="error" 
                            sx={{ mb: 2, width: '100%' }} 
                            onClose={() => setError(null)}
                        >
                            {error}
                        </Alert>
                    )}

                    {/* Step 1: Email Input */}
                    {step === LOGIN_STEPS.EMAIL && (
                        <Box component="form" onSubmit={emailForm.handleSubmit(handleEmailSubmit)} sx={{ mt: 1, width: '100%' }}>
                            <CustomTextField
                                label={t('auth.email')}
                                {...emailForm.register('email')}
                                error={!!emailForm.formState.errors.email}
                                helperText={emailForm.formState.errors.email?.message}
                                fullWidth
                                autoFocus
                                disabled={discoveryLoading}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                size="large"
                                loading={discoveryLoading}
                                sx={{ mt: 3, mb: 1 }}
                            >
                                {t('auth.continue', 'Continue')}
                            </Button>
                        </Box>
                    )}

                    {/* Step 2: Tenant Selection (if multiple tenants) */}
                    {step === LOGIN_STEPS.TENANT_SELECTION && (
                        <Box sx={{ mt: 1, width: '100%' }}>
                            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                                {t('auth.select_tenant', 'Select Your Organization')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {t('auth.multiple_tenants_message', 'Your email is associated with multiple organizations. Please select one to continue.')}
                            </Typography>
                            
                            {discoveredTenants.map((tenant) => (
                                <Paper
                                    key={tenant.tenantId}
                                    elevation={1}
                                    sx={{
                                        p: 2,
                                        mb: 2,
                                        cursor: 'pointer',
                                        border: selectedTenantId === tenant.tenantId ? 2 : 1,
                                        borderColor: selectedTenantId === tenant.tenantId ? 'primary.main' : 'divider',
                                        '&:hover': {
                                            bgcolor: 'action.hover',
                                        }
                                    }}
                                    onClick={() => handleTenantSelect(tenant.tenantId)}
                                >
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        {tenant.tenantName}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {tenant.tenantId}
                                    </Typography>
                                </Paper>
                            ))}
                            
                            <MuiButton
                                onClick={handleBack}
                                fullWidth
                                sx={{ mt: 2 }}
                            >
                                {t('auth.back', 'Back')}
                            </MuiButton>
                        </Box>
                    )}

                    {/* Step 3: Password Input */}
                    {step === LOGIN_STEPS.PASSWORD && (
                        <Box component="form" onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} sx={{ mt: 1, width: '100%' }}>
                            {selectedTenantId && (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <Typography variant="body2">
                                        <strong>{t('auth.logging_in_to', 'Logging in to')}:</strong> {getSelectedTenantName()}
                                    </Typography>
                                </Alert>
                            )}
                            
                            <CustomTextField
                                label={t('auth.password')}
                                type="password"
                                placeholder={t('auth.password')}
                                {...passwordForm.register('password')}
                                error={!!passwordForm.formState.errors.password}
                                helperText={passwordForm.formState.errors.password?.message}
                                fullWidth
                                autoFocus
                                disabled={loading}
                                autoComplete="current-password"
                            />
                            
                            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                                <MuiButton
                                    onClick={handleBack}
                                    variant="outlined"
                                    fullWidth
                                    disabled={loading}
                                >
                                    {t('auth.back', 'Back')}
                                </MuiButton>
                                <Button
                                    type="submit"
                                    fullWidth
                                    size="large"
                                    loading={loading}
                                >
                                    {t('auth.login_button', 'Login')}
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {/* Demo Info (only show on email step) */}
                    {step === LOGIN_STEPS.EMAIL && (
                        <Alert severity="info" sx={{ mt: 4, width: '100%' }}>
                            <Typography variant="body2">
                                <strong>{t('auth.demo_title', 'Demo Credentials')}</strong><br />
                                {t('auth.demo_email', 'Email')}: admin@terra.com<br />
                                {t('auth.demo_password', 'Password')}: SuperAdmin123!
                            </Typography>
                        </Alert>
                    )}
                </Paper>
            </Box>
        </Container>
    );
};

export default LoginPage;
