import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handleRouteError } from '@/lib/auth';

export async function GET() {
  try {
    const doctors = await prisma.doctor.findMany({
      select: { specialization: true },
      distinct: ['specialization'],
    });
    const specializations = doctors.map((d) => d.specialization).sort();
    return NextResponse.json({ success: true, data: specializations });
  } catch (err: any) {
    return handleRouteError(err);
  }
}
