import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createDoctorSchema } from '@/lib/validators';
import { authenticateRequest, authorizeRole, jsonSuccess, jsonError, handleRouteError } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (auth.response) return auth.response;

    const roleErr = authorizeRole(auth.user!, 'ADMIN');
    if (roleErr) return roleErr;

    const body = await req.json();
    const parsed = createDoctorSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Validation error', 400, {
        errors: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    const { name, email, password, phone, specialization, experienceYears, bio, consultationFee } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return jsonError('Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, passwordHash, role: 'DOCTOR', phone },
      });
      const doctor = await tx.doctor.create({
        data: { userId: user.id, specialization, experienceYears, bio, consultationFee },
      });
      return { user, doctor };
    });

    return jsonSuccess(result, undefined, 201);
  } catch (err: any) {
    return handleRouteError(err);
  }
}
