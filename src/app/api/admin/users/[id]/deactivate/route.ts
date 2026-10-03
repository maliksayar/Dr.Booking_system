import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, authorizeRole, jsonSuccess, jsonError, handleRouteError } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = authenticateRequest(req);
    if (auth.response) return auth.response;

    const roleErr = authorizeRole(auth.user!, 'ADMIN');
    if (roleErr) return roleErr;

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) {
      return jsonError('User not found', 404);
    }
    if (user.role === 'ADMIN') {
      return jsonError('Cannot deactivate an admin account', 400);
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, email: true, isActive: true },
    });

    return jsonSuccess(updated, `User ${updated.isActive ? 'activated' : 'deactivated'}`);
  } catch (err: any) {
    return handleRouteError(err);
  }
}
