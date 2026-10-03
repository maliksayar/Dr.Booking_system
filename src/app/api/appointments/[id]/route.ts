import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, jsonSuccess, jsonError, handleRouteError } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = authenticateRequest(req);
    if (auth.response) return auth.response;

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        doctor: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
        patient: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!appointment) {
      return jsonError('Appointment not found', 404);
    }

    const doctor =
      auth.user!.role === 'DOCTOR'
        ? await prisma.doctor.findUnique({ where: { userId: auth.user!.id } })
        : null;

    const isOwner =
      (auth.user!.role === 'PATIENT' && appointment.patientId === auth.user!.id) ||
      (auth.user!.role === 'DOCTOR' && doctor?.id === appointment.doctorId) ||
      auth.user!.role === 'ADMIN';

    if (!isOwner) {
      return jsonError('Not authorized', 403);
    }

    return jsonSuccess(appointment);
  } catch (err: any) {
    return handleRouteError(err);
  }
}
