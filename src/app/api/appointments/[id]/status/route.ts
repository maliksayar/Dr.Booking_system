import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { updateStatusSchema } from '@/lib/validators';
import { authenticateRequest, authorizeRole, jsonSuccess, jsonError, handleRouteError } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = authenticateRequest(req);
    if (auth.response) return auth.response;

    const roleErr = authorizeRole(auth.user!, 'DOCTOR', 'ADMIN');
    if (roleErr) return roleErr;

    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Validation error', 400, {
        errors: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: { doctor: true },
    });
    if (!appointment) {
      return jsonError('Appointment not found', 404);
    }

    if (auth.user!.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId: auth.user!.id } });
      if (!doctor || doctor.id !== appointment.doctorId) {
        return jsonError('Not authorized', 403);
      }
    }

    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data: { status: parsed.data.status, cancelReason: parsed.data.reason },
      include: {
        doctor: { include: { user: { select: { id: true, name: true } } } },
        patient: { select: { id: true, name: true, email: true } },
      },
    });

    return jsonSuccess(updated);
  } catch (err: any) {
    return handleRouteError(err);
  }
}
