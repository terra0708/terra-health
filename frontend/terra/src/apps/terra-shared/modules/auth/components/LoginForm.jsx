import React from 'react';
import { Box } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, TextField } from '@common/ui';
import { getLoginSchema } from '../schemas/loginSchema';

export const LoginForm = ({ onSubmit, t }) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(getLoginSchema(t)),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    return (
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
    );
};
