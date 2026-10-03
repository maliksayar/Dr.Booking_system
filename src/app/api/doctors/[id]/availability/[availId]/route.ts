import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { availabilitySchema } from '@/lib/validators';
import { authenticateRequest, authorizeRole, jsonSuccess, jsonError, handleRouteError } from '@/lib/auth';

async function getDoctorAndVerify(doctorId: string, userId: string, role: string) {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) throw Object.assign(new Error('Doctor not found'), { statusCode: 404 });
  if (role === 'DOCTOR' && doctor.userId !== userId) {
    throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  }
  return doctor;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string; availId: string } }) {
  try {
    const auth = authenticateRequest(req);
    if (auth.response) return auth.response;

    const roleErr = authorizeRole(auth.user!, 'DOCTOR', 'ADMIN');
    if (roleErr) return roleErr;

    await getDoctorAndVerify(params.id, auth.user!.id, auth.user!.role);

    const body = await req.json();
    const parsed = availabilitySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Validation error', 400, {
        errors: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    const { dayOfWeek, startTime, endTime, slotDurationMinutes } = parsed.data;

    if (startTime >= endTime) {
      return jsonError('Start time must be before end time', 400);
    }

    const updated = await prisma.doctorAvailability.update({
      where: { id: params.availId },
      data: { dayOfWeek, startTime, endTime, slotDurationMinutes },
    });

    return jsonSuccess(updated);
  } catch (err: any) {
    return handleRouteError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; availId: string } }) {
  try {
    const auth = authenticateRequest(req);
    if (auth.response) return auth.response;

    const roleErr = authorizeRole(auth.user!, 'DOCTOR', 'ADMIN');
    if (roleErr) return roleErr;

    await getDoctorAndVerify(params.id, auth.user!.id, auth.user!.role);

    await prisma.doctorAvailability.delete({ where: { id: params.availId } });

    return jsonSuccess(null, 'Availability removed');
  } catch (err: any) {
    return handleRouteError(err);
  }
}
