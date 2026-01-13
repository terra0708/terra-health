import { Box, Paper, Typography, Container, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, TextField, SettingsSwitchers } from '@common/ui';
import { z } from 'zod';
import useAuthStore from '../../modules/auth/hooks/useAuthStore';

const LoginPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    // Schema defined inside to use translation
    const loginSchema = z.object({
        email: z.string().min(1, t('auth.validation.email_required')).email(t('auth.validation.email_invalid')),
        password: z.string().min(6, t('auth.validation.password_min')),
    });

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

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

                    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1, width: '100%' }}>
                        <TextField
                            label={t('auth.email')}
                            {...register('email')}
                            error={!!errors.email}
                            helperText={errors.email?.message}
                        />
                        <TextField
                            label={t('auth.password')}
                            type="password"
                            {...register('password')}
                            error={!!errors.password}
                            helperText={errors.password?.message}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            size="large"
                            loading={isSubmitting}
                            sx={{ mt: 3, mb: 1 }}
                        >
                            {t('auth.login_button')}
                        </Button>
                    </Box>

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
