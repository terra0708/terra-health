import { z } from 'zod';

export const noteSchema = z.object({
    id: z.union([z.string(), z.number()]),
    text: z.string().min(1, 'Not içeriği boş olamaz'),
    date: z.string(),
    time: z.string().optional(),
    completed: z.boolean().default(false)
});

export const customerSchema = z.object({
    name: z.string().min(2, 'customers.drawer.error.name_min'),
    phone: z.string().min(7, 'customers.drawer.error.phone_min'),
    email: z.string().email('customers.drawer.error.invalid_email').or(z.literal('')),
    country: z.string().min(2),
    registrationDate: z.string(),
    consultantId: z.string().optional(),
    category: z.string().optional(),
    services: z.array(z.string()).default([]),
    status: z.string().min(1),
    source: z.string().min(1),
    tags: z.array(z.string()).default([]),
    notes: z.array(noteSchema).default([]),
    reminder: z.object({
        active: z.boolean().default(false),
        notes: z.array(noteSchema).default([])
    }).default({ active: false, notes: [] }),
    files: z.array(z.any()).default([]),
    payments: z.array(noteSchema).default([])
});
