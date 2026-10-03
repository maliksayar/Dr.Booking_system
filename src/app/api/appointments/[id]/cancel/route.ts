import { NextRequest } from 'next/server';
import { cancelAppointmentSchema } from '@/lib/validators';
import { cancelAppointment } from '@/lib/services/bookingService';
import { authenticateRequest, authorizeRole, jsonSuccess, jsonError, handleRouteError } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = authenticateRequest(req);
    if (auth.response) return auth.response;

    const roleErr = authorizeRole(auth.user!, 'PATIENT', 'DOCTOR', 'ADMIN');
    if (roleErr) return roleErr;

    const body = await req.json().catch(() => ({}));
    const parsed = cancelAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Validation error', 400, {
        errors: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    const cancelled = await cancelAppointment({
      appointmentId: params.id,
      requesterId: auth.user!.id,
      requesterRole: auth.user!.role,
      reason: parsed.data.reason,
    });

    return jsonSuccess(cancelled);
  } catch (err: any) {
    return handleRouteError(err);
  }
}
