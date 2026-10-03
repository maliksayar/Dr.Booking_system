import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, jsonSuccess, jsonError, handleRouteError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (auth.response) return auth.response;

    const user = await prisma.user.findUnique({
      where: { id: auth.user!.id },
      include: { doctor: true },
    });
    if (!user) {
      return jsonError('User not found', 404);
    }

    return jsonSuccess({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      doctorId: user.doctor?.id ?? null,
      avatarUrl: user.doctor?.avatarUrl ?? null,
      qualifications: user.doctor?.qualifications ?? null,
      createdAt: user.createdAt,
    });
  } catch (err: any) {
    return handleRouteError(err);
  }
}
