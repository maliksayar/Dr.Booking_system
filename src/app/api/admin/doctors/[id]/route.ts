import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, authorizeRole, jsonSuccess, jsonError, handleRouteError } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = authenticateRequest(req);
    if (auth.response) return auth.response;

    const roleErr = authorizeRole(auth.user!, 'ADMIN');
    if (roleErr) return roleErr;

    const doctor = await prisma.doctor.findUnique({ where: { id: params.id } });
    if (!doctor) {
      return jsonError('Doctor not found', 404);
    }

    await prisma.$transaction(async (tx) => {
      // Remove waitlist and appointment records referencing this doctor to prevent FK constraint violations
      await tx.waitlist.deleteMany({ where: { doctorId: doctor.id } });
      await tx.appointment.deleteMany({ where: { doctorId: doctor.id } });
      await tx.doctorLeave.deleteMany({ where: { doctorId: doctor.id } });
      await tx.doctorAvailability.deleteMany({ where: { doctorId: doctor.id } });
      await tx.doctor.delete({ where: { id: doctor.id } });
      await tx.user.delete({ where: { id: doctor.userId } });
    });

    return jsonSuccess(null, 'Doctor account deleted');
  } catch (err: any) {
    return handleRouteError(err);
  }
}
