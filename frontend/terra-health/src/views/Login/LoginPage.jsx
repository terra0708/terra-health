import { Box, Paper, Typography, Container, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SettingsSwitchers } from '@common/ui';
import { LoginForm, useAuthStore } from '../../modules/auth';

const LoginPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const onSubmit = async (data) => {
        if (data.email === 'admin@terra.com' && data.password === 'admin123') {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            login({ name: 'Admin User', role: 'admin' }, 'demo-token-123');
            navigate('/');
        } else {
            alert(t('auth.invalid_credentials'));
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
