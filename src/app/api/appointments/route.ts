import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createAppointmentSchema } from '@/lib/validators';
import { createAppointment } from '@/lib/services/bookingService';
import { authenticateRequest, authorizeRole, jsonSuccess, jsonError, handleRouteError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.max(1, Number(searchParams.get('limit') || 20));
    const skip = (page - 1) * limit;

    const user = auth.user!;
    const where: any = {};

    if (user.role === 'PATIENT') {
      where.patientId = user.id;
    } else if (user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
      if (!doctor) return jsonError('Doctor profile not found', 404);
      where.doctorId = doctor.id;
    }
    // ADMIN sees all

    if (status) where.status = status;
    if (date) where.date = date;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          doctor: {
            include: { user: { select: { id: true, name: true, email: true, phone: true } } },
          },
          patient: { select: { id: true, name: true, email: true, phone: true } },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (auth.response) return auth.response;

    const roleErr = authorizeRole(auth.user!, 'PATIENT');
    if (roleErr) return roleErr;

    const body = await req.json();
    const parsed = createAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Validation error', 400, {
        errors: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    const { doctorId, date, startTime, notes } = parsed.data;
    const appointment = await createAppointment({
      doctorId,
      patientId: auth.user!.id,
      date,
      startTime,
      notes,
    });

    return jsonSuccess(appointment, undefined, 201);
  } catch (err: any) {
    return handleRouteError(err);
  }
}
