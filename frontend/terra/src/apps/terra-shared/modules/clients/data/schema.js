import { z } from 'zod';

export const baseClientSchema = z.object({
    id: z.union([z.string(), z.number()]),
    name: z.string().min(2, 'clients.error.name_min'),
    phone: z.string().min(7, 'clients.error.phone_min'),
    email: z.string().email('clients.error.invalid_email').or(z.literal('')),
    country: z.string().min(2),
    source: z.string().min(1), // GOOGLE_ADS, META_ADS, INSTAGRAM_ADS, MANUAL, REFERRAL
    registrationDate: z.string(),
    industryType: z.enum(['HEALTH', 'TOURISM', 'HOTEL']).nullable().optional(),
    assignedTo: z.union([z.string(), z.number()]).nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional()
});
