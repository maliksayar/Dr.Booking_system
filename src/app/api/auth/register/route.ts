import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { registerSchema } from '@/lib/validators';
import { signTokens, jsonSuccess, jsonError, handleRouteError } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Validation error', 400, {
        errors: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    const { name, email, password, role, phone } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return jsonError('Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role, phone },
    });

    // If doctor, create doctor profile stub
    let doctorProfile = null;
    if (role === 'DOCTOR') {
      doctorProfile = await prisma.doctor.create({
        data: { userId: user.id, specialization: 'General Practice' },
      });
    }

    const { accessToken, refreshToken } = signTokens(user);

    // Persist refresh token (7 days)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });

    return jsonSuccess(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          doctorId: doctorProfile?.id ?? null,
        },
        accessToken,
        refreshToken,
      },
      'Registration successful',
      201
    );
  } catch (err: any) {
    return handleRouteError(err);
  }
}
