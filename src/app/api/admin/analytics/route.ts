import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, authorizeRole, handleRouteError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (auth.response) return auth.response;

    const roleErr = authorizeRole(auth.user!, 'ADMIN');
    if (roleErr) return roleErr;

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayStr = today.toISOString().slice(0, 10);
    const weekStr = startOfWeek.toISOString().slice(0, 10);
    const monthStr = startOfMonth.toISOString().slice(0, 10);

    const [
      totalAppointments,
      todayAppointments,
      weekAppointments,
      monthAppointments,
      statusBreakdown,
      totalDoctors,
      totalPatients,
      specializationStats,
      recentAppointments,
      dailyStatsGroups,
    ] = await Promise.all([
      prisma.appointment.count(),
      prisma.appointment.count({ where: { date: todayStr } }),
      prisma.appointment.count({ where: { date: { gte: weekStr } } }),
      prisma.appointment.count({ where: { date: { gte: monthStr } } }),
      prisma.appointment.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.doctor.count(),
      prisma.user.count({ where: { role: 'PATIENT' } }),
      prisma.doctor.groupBy({
        by: ['specialization'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.appointment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          doctor: { include: { user: { select: { name: true } } } },
          patient: { select: { name: true } },
        },
      }),
      // Daily appointment counts for last 30 days
      prisma.appointment.groupBy({
        by: ['date', 'status'],
        _count: { id: true },
        where: { date: { gte: monthStr } },
        orderBy: { date: 'asc' },
      }),
    ]);

    const dailyStats = dailyStatsGroups.map((g) => ({
      date: g.date,
      status: g.status,
      count: g._count.id,
    }));

    const cancelRate =
      totalAppointments > 0
        ? (
            ((statusBreakdown.find((s) => s.status === 'CANCELLED')?._count?.id ?? 0) / totalAppointments) *
            100
          ).toFixed(1)
        : '0.0';

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalAppointments,
          todayAppointments,
          weekAppointments,
          monthAppointments,
          totalDoctors,
          totalPatients,
          cancellationRate: `${cancelRate}%`,
        },
        statusBreakdown: statusBreakdown.map((s) => ({ status: s.status, count: s._count.id })),
        specializationStats: specializationStats.map((s) => ({
          specialization: s.specialization,
          count: s._count.id,
        })),
        dailyStats,
        recentAppointments,
      },
    });
  } catch (err: any) {
    return handleRouteError(err);
  }
}
