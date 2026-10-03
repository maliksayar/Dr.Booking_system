import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import config from './config';
import { ZodError } from 'zod';

export interface AuthUser {
  id: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
}

export function signTokens(user: { id: string; email: string; role: string }) {
  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
  const refreshToken = jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
  return { accessToken, refreshToken };
}

export function jsonResponse(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonSuccess(data: any, message?: string, status = 200) {
  return NextResponse.json(
    {
      success: true,
      ...(message ? { message } : {}),
      ...(data !== undefined ? (typeof data === 'object' && 'pagination' in data ? data : { data }) : {}),
    },
    { status }
  );
}

export function jsonError(message: string, status = 400, extra: Record<string, any> = {}) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...extra,
    },
    { status }
  );
}

export function handleRouteError(err: any) {
  // Allow Next.js internal dynamic bailouts to propagate
  if (err?.digest === 'DYNAMIC_SERVER_USAGE') {
    throw err;
  }

  console.error('[API Route Error]:', err);

  if (err instanceof ZodError) {
    return jsonError('Validation error', 400, {
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Prisma unique constraint violation
  if (err?.code === 'P2002') {
    return jsonError('A record with that value already exists', 409, {
      field: err.meta?.target,
    });
  }

  // Prisma not found
  if (err?.code === 'P2025' || err?.code === 'P2023') {
    return jsonError('Record not found', 404);
  }

  if (err?.statusCode) {
    return jsonError(err.message, err.statusCode);
  }

  return jsonError(
    config.NODE_ENV === 'production' ? 'Internal server error' : err?.message || 'Internal server error',
    500
  );
}

export function authenticateRequest(req: NextRequest): { user?: AuthUser; response?: NextResponse } {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { response: jsonError('Authentication required', 401) };
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as AuthUser;
    return { user: payload };
  } catch (err: any) {
    if (err?.name === 'TokenExpiredError') {
      return { response: jsonError('Token expired', 401, { code: 'TOKEN_EXPIRED' }) };
    }
    return { response: jsonError('Invalid token', 401) };
  }
}

export function authorizeRole(user: AuthUser, ...roles: string[]): NextResponse | null {
  if (!roles.includes(user.role)) {
    return jsonError(`Access denied. Required role(s): ${roles.join(', ')}`, 403);
  }
  return null;
}
