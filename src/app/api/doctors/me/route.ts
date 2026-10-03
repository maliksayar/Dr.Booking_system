import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, authorizeRole, jsonSuccess, jsonError, handleRouteError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (auth.response) return auth.response;

    const roleError = authorizeRole(auth.user!, 'DOCTOR');
    if (roleError) return roleError;

    const doctor = await prisma.doctor.findUnique({
      where: { userId: auth.user!.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
        availability: { orderBy: { dayOfWeek: 'asc' } },
        leaves: {
          where: { date: { gte: new Date().toISOString().slice(0, 10) } },
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!doctor) {
      return jsonError('Doctor profile not found', 404);
    }

    return jsonSuccess(doctor);
  } catch (err: any) {
    return handleRouteError(err);
  }
}
