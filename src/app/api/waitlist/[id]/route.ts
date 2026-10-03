import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, authorizeRole, jsonSuccess, jsonError, handleRouteError } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = authenticateRequest(req);
    if (auth.response) return auth.response;

    const roleErr = authorizeRole(auth.user!, 'PATIENT');
    if (roleErr) return roleErr;

    const entry = await prisma.waitlist.findUnique({ where: { id: params.id } });
    if (!entry) {
      return jsonError('Waitlist entry not found', 404);
    }
    if (entry.patientId !== auth.user!.id) {
      return jsonError('Not authorized', 403);
    }

    await prisma.waitlist.delete({ where: { id: params.id } });

    return jsonSuccess(null, 'Removed from waitlist');
  } catch (err: any) {
    return handleRouteError(err);
  }
}
