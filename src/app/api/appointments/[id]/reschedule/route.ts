import { NextRequest } from 'next/server';
import { rescheduleAppointmentSchema } from '@/lib/validators';
import { rescheduleAppointment } from '@/lib/services/bookingService';
import { authenticateRequest, authorizeRole, jsonSuccess, jsonError, handleRouteError } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = authenticateRequest(req);
    if (auth.response) return auth.response;

    const roleErr = authorizeRole(auth.user!, 'PATIENT');
    if (roleErr) return roleErr;

    const body = await req.json();
    const parsed = rescheduleAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Validation error', 400, {
        errors: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    const { date, startTime, notes } = parsed.data;

    const result = await rescheduleAppointment({
      appointmentId: params.id,
      patientId: auth.user!.id,
      newDate: date,
      newStartTime: startTime,
      notes,
    });

    return jsonSuccess(result);
  } catch (err: any) {
    return handleRouteError(err);
  }
}
