import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Container, Alert, TextField } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SettingsSwitchers } from '@common/ui';
import { LoginForm, useAuthStore } from '@shared/modules/auth';

// UUID format validasyonu (basit regex kontrolü)
const isValidUUID = (str) => {
    if (!str || typeof str !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str.trim());
};

const LoginPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // Auth store hooks
    const login = useAuthStore((state) => state.login);
    const loading = useAuthStore((state) => state.loading);
    const authError = useAuthStore((state) => state.error);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    
    // Local state
    const [tenantIdInput, setTenantIdInput] = useState('');
    const [error, setError] = useState(null);

    // URL parametresinden tenantId okuma ve TextField'a otomatik doldurma
    useEffect(() => {
        const tenantIdFromUrl = searchParams.get('tenantId');
        if (tenantIdFromUrl) {
            setTenantIdInput(tenantIdFromUrl);
        }
    }, [searchParams]);

    // Auth store error'ını local error state'e senkronize et
    useEffect(() => {
        if (authError) {
            setError(authError.message || 'An error occurred');
        }
    }, [authError]);

    // Login başarılı olunca error temizle ve navigate et
    useEffect(() => {
        if (isAuthenticated) {
            setError(null);
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const onSubmit = async (data) => {
        // Error state'i temizle
        setError(null);

        // Tenant ID'yi al (URL parametresi veya TextField'dan)
        const tenantId = searchParams.get('tenantId') || tenantIdInput?.trim();

        // Tenant ID kontrolü
        if (!tenantId) {
            setError('Tenant ID is required');
            return;
        }

        // UUID format validasyonu
        if (!isValidUUID(tenantId)) {
            setError('Tenant ID must be a valid UUID format (e.g., 123e4567-e89b-12d3-a456-426614174000)');
            return;
        }

        try {
            await login({ 
                email: data.email, 
                password: data.password, 
                tenantId: tenantId 
            });
            // Navigate işlemi useEffect'te yapılıyor (isAuthenticated değiştiğinde)
        } catch (error) {
            // api.js'den normalize edilmiş hata gelir
            // error.message, error.code, error.status direkt kullanılabilir
            setError(error.message || 'Login failed');
        }
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

                    {/* Tenant ID Input */}
                    <TextField
                        label="Tenant ID (UUID)"
                        value={tenantIdInput}
                        onChange={(e) => setTenantIdInput(e.target.value)}
                        fullWidth
                        required
                        sx={{ mb: 2 }}
                        helperText="URL'den otomatik alınır (?tenantId=xxx) veya manuel girebilirsiniz"
                        placeholder="123e4567-e89b-12d3-a456-426614174000"
                        disabled={loading}
                    />

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

                    <LoginForm onSubmit={onSubmit} t={t} />

                    <Alert severity="info" sx={{ mt: 4, width: '100%' }}>
                        <Typography variant="body2">
                            <strong>{t('auth.demo_title')}</strong><br />
                            {t('auth.demo_email')}: admin@terra.com<br />
                            {t('auth.demo_password')}: admin123
                        </Typography>
                    </Alert>
                </Paper>
            </Box>
        </Container>
    );
};

export default LoginPage;
