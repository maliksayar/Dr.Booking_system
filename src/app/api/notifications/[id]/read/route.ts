import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, jsonSuccess, jsonError, handleRouteError } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = authenticateRequest(req);
    if (auth.response) return auth.response;

    const notification = await prisma.notification.findUnique({ where: { id: params.id } });
    if (!notification) {
      return jsonError('Notification not found', 404);
    }
    if (notification.userId !== auth.user!.id) {
      return jsonError('Not authorized', 403);
    }

    const updated = await prisma.notification.update({
      where: { id: params.id },
      data: { isRead: true },
    });

    return jsonSuccess(updated);
  } catch (err: any) {
    return handleRouteError(err);
  }
}
