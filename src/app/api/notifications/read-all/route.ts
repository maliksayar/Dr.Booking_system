import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, jsonSuccess, handleRouteError } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (auth.response) return auth.response;

    const { count } = await prisma.notification.updateMany({
      where: { userId: auth.user!.id, isRead: false },
      data: { isRead: true },
    });

    return jsonSuccess(null, `Marked ${count} notifications as read`);
  } catch (err: any) {
    return handleRouteError(err);
  }
}
