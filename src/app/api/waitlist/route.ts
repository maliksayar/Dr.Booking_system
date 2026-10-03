import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { waitlistSchema } from '@/lib/validators';
import { authenticateRequest, authorizeRole, jsonSuccess, jsonError, handleRouteError } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (auth.response) return auth.response;

    const roleErr = authorizeRole(auth.user!, 'PATIENT');
    if (roleErr) return roleErr;

    const body = await req.json();
    const parsed = waitlistSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Validation error', 400, {
        errors: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    const { doctorId, requestedDate } = parsed.data;

    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      return jsonError('Doctor not found', 404);
    }

    // Check if already waitlisted
    const existing = await prisma.waitlist.findFirst({
      where: {
        doctorId,
        patientId: auth.user!.id,
        requestedDate,
        status: { in: ['WAITING', 'NOTIFIED'] },
      },
    });
    if (existing) {
      return jsonError('You are already on the waitlist for this date', 409);
    }

    const entry = await prisma.waitlist.create({
      data: { doctorId, patientId: auth.user!.id, requestedDate },
      include: { doctor: { include: { user: { select: { name: true } } } } },
    });

    return jsonSuccess(entry, "You've been added to the waitlist", 201);
  } catch (err: any) {
    return handleRouteError(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (auth.response) return auth.response;

    const roleErr = authorizeRole(auth.user!, 'PATIENT');
    if (roleErr) return roleErr;

    const entries = await prisma.waitlist.findMany({
      where: { patientId: auth.user!.id, status: { in: ['WAITING', 'NOTIFIED'] } },
      include: { doctor: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    return jsonSuccess(entries);
  } catch (err: any) {
    return handleRouteError(err);
  }
}
