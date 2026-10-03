import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { loginSchema } from '@/lib/validators';
import { signTokens, jsonSuccess, jsonError, handleRouteError } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid email or password', 400);
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return jsonError('Invalid email or password', 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return jsonError('Invalid email or password', 401);
    }

    const { accessToken, refreshToken } = signTokens(user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });

    let doctorProfile = null;
    if (user.role === 'DOCTOR') {
      doctorProfile = await prisma.doctor.findUnique({ where: { userId: user.id } });
    }

    return jsonSuccess({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        doctorId: doctorProfile?.id ?? null,
        avatarUrl: doctorProfile?.avatarUrl ?? null,
        qualifications: doctorProfile?.qualifications ?? null,
      },
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    return handleRouteError(err);
  }
}
