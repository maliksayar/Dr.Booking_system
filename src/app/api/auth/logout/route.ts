import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, jsonSuccess, handleRouteError } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (auth.response) return auth.response;

    const body = await req.json().catch(() => ({}));
    const { refreshToken } = body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }

    return jsonSuccess(null, 'Logged out successfully');
  } catch (err: any) {
    return handleRouteError(err);
  }
}
