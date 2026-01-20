import { z } from 'zod';

export const getLoginSchema = (t) => z.object({
    email: z.string().min(1, t('auth.validation.email_required')).email(t('auth.validation.email_invalid')),
    password: z.string().min(6, t('auth.validation.password_min')),
});
