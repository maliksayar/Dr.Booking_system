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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = authenticateRequest(req);
    if (auth.response) return auth.response;

    const availability = await prisma.doctorAvailability.findMany({
      where: { doctorId: params.id },
      orderBy: { dayOfWeek: 'asc' },
    });

    return jsonSuccess(availability);
  } catch (err: any) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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

    const avail = await prisma.doctorAvailability.create({
      data: {
        doctorId: params.id,
        dayOfWeek,
        startTime,
        endTime,
        slotDurationMinutes,
      },
    });

    return jsonSuccess(avail, undefined, 201);
  } catch (err: any) {
    return handleRouteError(err);
  }
}
