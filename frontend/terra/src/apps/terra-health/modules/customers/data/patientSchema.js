import { z } from 'zod';

export const noteSchema = z.object({
    id: z.union([z.string(), z.number()]),
    text: z.string().min(1, 'Not içeriği boş olamaz'),
    date: z.string(),
    time: z.string().optional(),
    completed: z.boolean().default(false)
});

export const patientDetailsSchema = z.object({
    clientId: z.union([z.string(), z.number()]),
    services: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    status: z.string().min(1),
    consultantId: z.string().optional().nullable(),
    category: z.string().optional(),
    notes: z.array(noteSchema).default([]),
    files: z.array(z.any()).default([]),
    payments: z.array(noteSchema).default([]),
    medicalHistory: z.string().optional(),
    operationType: z.string().optional(),
    passportNumber: z.string().optional(),
    city: z.string().optional(),
    job: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional()
});
