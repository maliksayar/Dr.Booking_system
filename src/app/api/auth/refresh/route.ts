import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import config from '@/lib/config';
import { signTokens, jsonSuccess, jsonError, handleRouteError } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken } = body;
    if (!refreshToken) {
      return jsonError('Refresh token required', 400);
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      return jsonError('Invalid or expired refresh token', 401);
    }

    let payload: any;
    try {
      payload = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
    } catch {
      return jsonError('Invalid refresh token', 401);
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.isActive) {
      return jsonError('User not found', 401);
    }

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { token: refreshToken } });
    const tokens = signTokens(user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: { token: tokens.refreshToken, userId: user.id, expiresAt },
    });

    return jsonSuccess(tokens);
  } catch (err: any) {
    return handleRouteError(err);
  }
}
