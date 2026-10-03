import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handleRouteError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const specialization = searchParams.get('specialization');
    const name = searchParams.get('name');
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.max(1, Number(searchParams.get('limit') || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      user: { isActive: true },
      ...(specialization && {
        specialization: { contains: specialization, mode: 'insensitive' },
      }),
      ...(name && {
        user: { name: { contains: name, mode: 'insensitive' }, isActive: true },
      }),
    };

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          availability: { orderBy: { dayOfWeek: 'asc' } },
        },
        skip,
        take: limit,
        orderBy: { experienceYears: 'desc' },
      }),
      prisma.doctor.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: doctors,
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
