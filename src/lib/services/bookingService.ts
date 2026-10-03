import prisma from '../prisma';
import config from '../config';
import { checkSlotAvailability } from './slotService';
import {
  notifyBookingConfirmed,
  notifyBookingCancelled,
  notifyBookingRescheduled,
  notifyWaitlistAvailable,
} from './notificationService';
import { parseISO, differenceInHours, startOfDay, isBefore } from 'date-fns';

function createCustomError(statusCode: number, message: string) {
  const err: any = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/**
 * Book an appointment atomically.
 * Uses a DB transaction + unique constraint to prevent double-booking.
 */
export const createAppointment = async ({
  doctorId,
  patientId,
  date,
  startTime,
  notes,
}: {
  doctorId: string;
  patientId: string;
  date: string;
  startTime: string;
  notes?: string;
}) => {
  // 1. Validate date is not in the past
  const today = startOfDay(new Date());
  const appointmentDate = parseISO(date);
  if (isBefore(appointmentDate, today)) {
    throw createCustomError(400, 'Cannot book an appointment in the past');
  }

  // 2. Check slot availability (leave, day-of-week, grid alignment)
  const slotCheck = await checkSlotAvailability(doctorId, date, startTime);
  if (!slotCheck.available) {
    throw createCustomError(409, slotCheck.reason || 'Slot not available');
  }

  const { endTime } = slotCheck;

  // 3. Fetch doctor info for notification
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: { user: true },
  });
  if (!doctor) throw createCustomError(404, 'Doctor not found');

  const patient = await prisma.user.findUnique({ where: { id: patientId } });
  if (!patient) throw createCustomError(404, 'Patient not found');

  // 4. Atomic insert — unique constraint on (doctorId, date, startTime) will catch races
  const status = doctor.isApprovalRequired ? 'PENDING' : 'CONFIRMED';

  let appointment;
  try {
    appointment = await prisma.appointment.create({
      data: { doctorId, patientId, date, startTime, endTime: endTime!, status, notes },
      include: {
        doctor: { include: { user: true } },
        patient: true,
      },
    });
  } catch (err: any) {
    if (err.code === 'P2002') {
      throw createCustomError(409, 'This slot was just booked by another patient. Please choose another slot.');
    }
    throw err;
  }

  // 5. Send notifications (fire-and-forget)
  notifyBookingConfirmed(appointment, patient, doctor, doctor.user).catch(console.error);

  return appointment;
};

/**
 * Cancel an appointment with cutoff enforcement.
 */
export const cancelAppointment = async ({
  appointmentId,
  requesterId,
  requesterRole,
  reason,
}: {
  appointmentId: string;
  requesterId: string;
  requesterRole: string;
  reason?: string;
}) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      doctor: { include: { user: true } },
      patient: true,
    },
  });
  if (!appointment) throw createCustomError(404, 'Appointment not found');

  // Authorization check
  const isPatient = requesterRole === 'PATIENT' && appointment.patientId === requesterId;
  const isDoctor = requesterRole === 'DOCTOR' && appointment.doctor.userId === requesterId;
  const isAdmin = requesterRole === 'ADMIN';

  if (!isPatient && !isDoctor && !isAdmin) {
    throw createCustomError(403, 'Not authorized to cancel this appointment');
  }

  // Status check
  if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status)) {
    throw createCustomError(400, `Appointment is already ${appointment.status.toLowerCase()}`);
  }

  // Cutoff check for patients
  if (isPatient) {
    const appointmentDateTime = parseISO(`${appointment.date}T${appointment.startTime}`);
    const hoursUntil = differenceInHours(appointmentDateTime, new Date());
    if (hoursUntil < config.CANCELLATION_CUTOFF_HOURS) {
      throw createCustomError(
        400,
        `Cancellations must be made at least ${config.CANCELLATION_CUTOFF_HOURS} hours before the appointment`
      );
    }
  }

  // Update status
  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: 'CANCELLED', cancelReason: reason },
    include: { doctor: { include: { user: true } }, patient: true },
  });

  // Notify
  notifyBookingCancelled(appointment, appointment.patient, appointment.doctor.user, reason).catch(console.error);

  // Process waitlist
  processWaitlist(appointment.doctorId, appointment.date).catch(console.error);

  return updated;
};

/**
 * Reschedule an appointment = cancel + rebook in one transaction.
 */
export const rescheduleAppointment = async ({
  appointmentId,
  patientId,
  newDate,
  newStartTime,
  notes,
}: {
  appointmentId: string;
  patientId: string;
  newDate: string;
  newStartTime: string;
  notes?: string;
}) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      doctor: { include: { user: true } },
      patient: true,
    },
  });
  if (!appointment) throw createCustomError(404, 'Appointment not found');
  if (appointment.patientId !== patientId) throw createCustomError(403, 'Not authorized');
  if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status)) {
    throw createCustomError(400, 'Cannot reschedule a completed or cancelled appointment');
  }

  // Cutoff check
  const appointmentDateTime = parseISO(`${appointment.date}T${appointment.startTime}`);
  const hoursUntil = differenceInHours(appointmentDateTime, new Date());
  if (hoursUntil < config.CANCELLATION_CUTOFF_HOURS) {
    throw createCustomError(
      400,
      `Rescheduling must be done at least ${config.CANCELLATION_CUTOFF_HOURS} hours before the appointment`
    );
  }

  // Validate new slot
  const slotCheck = await checkSlotAvailability(appointment.doctorId, newDate, newStartTime);
  if (!slotCheck.available) {
    throw createCustomError(409, slotCheck.reason || 'Slot not available');
  }

  // Atomic: cancel old + create new
  const [cancelled, newAppointment] = await prisma.$transaction([
    prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED', cancelReason: 'Rescheduled by patient' },
    }),
    prisma.appointment.create({
      data: {
        doctorId: appointment.doctorId,
        patientId,
        date: newDate,
        startTime: newStartTime,
        endTime: slotCheck.endTime!,
        status: 'CONFIRMED',
        notes: notes ?? appointment.notes,
      },
    }),
  ]);

  notifyBookingRescheduled(appointment, newAppointment, appointment.patient, appointment.doctor.user).catch(
    console.error
  );

  return { cancelled, newAppointment };
};

/**
 * When a slot frees up, notify waiting patients.
 */
export const processWaitlist = async (doctorId: string, date: string) => {
  const waiting = await prisma.waitlist.findMany({
    where: { doctorId, requestedDate: date, status: 'WAITING' },
    include: { patient: true, doctor: { include: { user: true } } },
    orderBy: { createdAt: 'asc' },
    take: 3, // Notify first 3 in queue
  });

  for (const entry of waiting) {
    await prisma.waitlist.update({ where: { id: entry.id }, data: { status: 'NOTIFIED' } });
    notifyWaitlistAvailable(entry, entry.doctor.user).catch(console.error);
  }
};
