import { z } from 'zod';

// ─── Auth ────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: z.enum(['PATIENT', 'DOCTOR']).default('PATIENT'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Doctor ───────────────────────────────────────────────────────────────────

export const doctorProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(30).optional().nullable(),
  specialization: z.string().min(2).max(100).optional(),
  experienceYears: z.coerce.number().int().min(0).max(60).optional(),
  bio: z.string().max(2000).optional().nullable(),
  consultationFee: z.coerce.number().min(0).optional(),
  isApprovalRequired: z.boolean().optional(),
  avatarUrl: z.string().max(2000000).optional().nullable(),
  qualifications: z.string().max(200).optional().nullable(),
});

export const createDoctorSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  specialization: z.string().min(2),
  experienceYears: z.coerce.number().int().min(0).default(0),
  bio: z.string().optional(),
  consultationFee: z.coerce.number().min(0).default(0),
});

export const availabilitySchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  slotDurationMinutes: z.coerce.number().int().min(10).max(240).optional().default(30),
});

export const leaveSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  reason: z.string().max(500).optional(),
});

// ─── Appointment ──────────────────────────────────────────────────────────────

export const createAppointmentSchema = z.object({
  doctorId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  notes: z.string().max(1000).optional(),
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const rescheduleAppointmentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  notes: z.string().max(1000).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']),
  reason: z.string().max(500).optional(),
});

// ─── Waitlist ─────────────────────────────────────────────────────────────────

export const waitlistSchema = z.object({
  doctorId: z.string().min(1),
  requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
