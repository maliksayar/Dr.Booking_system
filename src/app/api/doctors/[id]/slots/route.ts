import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAvailableSlots } from '@/lib/services/slotService';
import { jsonSuccess, jsonError, handleRouteError } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return jsonError('Query param `date` is required in YYYY-MM-DD format', 400);
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: params.id },
      include: { user: { select: { name: true } } },
    });

    if (!doctor) {
      return jsonError('Doctor not found', 404);
    }

    const slots = await getAvailableSlots(params.id, date, { includeBooked: true });

    return jsonSuccess({
      date,
      doctor: doctor.user.name,
      slots,
    });
  } catch (err: any) {
    return handleRouteError(err);
  }
}
