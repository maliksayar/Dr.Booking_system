import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, authorizeRole, jsonSuccess, handleRouteError } from '@/lib/auth';

async function getDoctorAndVerify(doctorId: string, userId: string, role: string) {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) throw Object.assign(new Error('Doctor not found'), { statusCode: 404 });
  if (role === 'DOCTOR' && doctor.userId !== userId) {
    throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  }
  return doctor;
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; leaveId: string } }) {
  try {
    const auth = authenticateRequest(req);
    if (auth.response) return auth.response;

    const roleErr = authorizeRole(auth.user!, 'DOCTOR', 'ADMIN');
    if (roleErr) return roleErr;

    await getDoctorAndVerify(params.id, auth.user!.id, auth.user!.role);

    await prisma.doctorLeave.delete({ where: { id: params.leaveId } });

    return jsonSuccess(null, 'Leave cancelled');
  } catch (err: any) {
    return handleRouteError(err);
  }
}
