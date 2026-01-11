
import { z } from 'zod';

// --- Base Schemas ---
export const StudentSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    birthDate: z.string().optional(),
    active: z.boolean().default(true),
    enrollmentDate: z.string(),
    deactivationDate: z.string().optional(),
    monthlyFee: z.number().nonnegative(),
    paymentMethod: z.enum(['Efectivo', 'Transferencia', 'Domiciliación', 'Bizum']),
    enrolledClassIds: z.array(z.string()).default([]),
    feeExceptions: z.record(z.string(), z.number()).optional(),
    notes: z.string().optional(),
});

export const InstructorSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    active: z.boolean().default(true),
    hireDate: z.string(),
    specialties: z.array(z.string()).default([]),
    ratePerClass: z.number().nonnegative().optional(),
});

export const DanceClassSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2),
    instructorId: z.string(),
    days: z.array(z.string()), // e.g., ['Lunes', 'Miércoles']
    time: z.string(), // e.g., '18:00'
    duration: z.number().positive(), // in minutes
    level: z.string(),
    capacity: z.number().int().positive(),
    location: z.string().optional(),
});

export const PaymentSchema = z.object({
    id: z.string().optional(),
    studentId: z.string(),
    amount: z.number().positive(),
    date: z.string(),
    paymentMethod: z.enum(['Efectivo', 'Transferencia', 'Domiciliación', 'Bizum']),
    concept: z.string(),
    notes: z.string().optional(),
});

export const CostSchema = z.object({
    id: z.string().optional(),
    concept: z.string().min(2),
    category: z.enum(['Profesores', 'Alquiler', 'Suministros', 'Licencias', 'Marketing', 'Mantenimiento', 'Otros']),
    amount: z.number().positive(),
    paymentDate: z.string(),
    paymentMethod: z.enum(['Transferencia', 'Efectivo', 'Domiciliación', 'Tarjeta']),
    beneficiary: z.string().min(2),
    isRecurring: z.boolean().default(false),
    notes: z.string().optional(),
    relatedInstructorId: z.string().optional(),
});

export type StudentInput = z.infer<typeof StudentSchema>;
export type InstructorInput = z.infer<typeof InstructorSchema>;
export type DanceClassInput = z.infer<typeof DanceClassSchema>;
export type PaymentInput = z.infer<typeof PaymentSchema>;
export type CostInput = z.infer<typeof CostSchema>;
