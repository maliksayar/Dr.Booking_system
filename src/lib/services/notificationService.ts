import prisma from '../prisma';
import { sendEmail, emailTemplates } from './mailer';

export interface CreateNotificationParams {
  userId: string;
  message: string;
  type?: 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED' | 'BOOKING_RESCHEDULED' | 'APPOINTMENT_REMINDER' | 'WAITLIST_AVAILABLE' | 'GENERAL';
  metadata?: any;
  email?: string | null;
  emailData?: any;
  emailTemplate?: string | null;
}

export const createNotification = async ({
  userId,
  message,
  type = 'GENERAL',
  metadata = null,
  email = null,
  emailData = null,
  emailTemplate = null,
}: CreateNotificationParams) => {
  // 1. Persist in-app notification
  const notification = await prisma.notification.create({
    data: { userId, message, type, metadata },
  });

  // 2. Send email (non-blocking, best-effort)
  if (email && emailTemplate && emailData && emailTemplates[emailTemplate]) {
    const { subject, html } = emailTemplates[emailTemplate](emailData);
    sendEmail({ to: email, subject, html }).catch(() => {});
  }

  return notification;
};

export const notifyBookingConfirmed = async (
  appointment: any,
  patient: any,
  doctor: any,
  doctorUser: any
) => {
  const msg = `Your appointment with Dr. ${doctorUser.name} on ${appointment.date} at ${appointment.startTime} is confirmed.`;
  await createNotification({
    userId: patient.id,
    message: msg,
    type: 'BOOKING_CONFIRMED',
    metadata: { appointmentId: appointment.id },
    email: patient.email,
    emailTemplate: 'bookingConfirmed',
    emailData: {
      patientName: patient.name,
      doctorName: doctorUser.name,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      specialization: doctor.specialization,
    },
  });

  await createNotification({
    userId: doctorUser.id,
    message: `New appointment: ${patient.name} on ${appointment.date} at ${appointment.startTime}`,
    type: 'BOOKING_CONFIRMED',
    metadata: { appointmentId: appointment.id },
  });
};

export const notifyBookingCancelled = async (
  appointment: any,
  patient: any,
  doctorUser: any,
  reason?: string | null
) => {
  const msg = `Appointment with Dr. ${doctorUser.name} on ${appointment.date} at ${appointment.startTime} has been cancelled.`;
  await createNotification({
    userId: patient.id,
    message: msg,
    type: 'BOOKING_CANCELLED',
    metadata: { appointmentId: appointment.id, reason },
    email: patient.email,
    emailTemplate: 'bookingCancelled',
    emailData: {
      patientName: patient.name,
      doctorName: doctorUser.name,
      date: appointment.date,
      startTime: appointment.startTime,
      reason,
    },
  });

  await createNotification({
    userId: doctorUser.id,
    message: `Appointment cancelled: ${patient.name} on ${appointment.date} at ${appointment.startTime}`,
    type: 'BOOKING_CANCELLED',
    metadata: { appointmentId: appointment.id },
  });
};

export const notifyBookingRescheduled = async (
  oldAppointment: any,
  newAppointment: any,
  patient: any,
  doctorUser: any
) => {
  await createNotification({
    userId: patient.id,
    message: `Appointment rescheduled from ${oldAppointment.date} ${oldAppointment.startTime} to ${newAppointment.date} ${newAppointment.startTime}.`,
    type: 'BOOKING_RESCHEDULED',
    metadata: { oldAppointmentId: oldAppointment.id, newAppointmentId: newAppointment.id },
    email: patient.email,
    emailTemplate: 'bookingRescheduled',
    emailData: {
      patientName: patient.name,
      doctorName: doctorUser.name,
      oldDate: oldAppointment.date,
      oldTime: oldAppointment.startTime,
      newDate: newAppointment.date,
      newTime: newAppointment.startTime,
    },
  });

  await createNotification({
    userId: doctorUser.id,
    message: `Appointment rescheduled: ${patient.name} from ${oldAppointment.date} ${oldAppointment.startTime} to ${newAppointment.date} ${newAppointment.startTime}`,
    type: 'BOOKING_RESCHEDULED',
    metadata: { newAppointmentId: newAppointment.id },
  });
};

export const notifyWaitlistAvailable = async (waitlistEntry: any, doctorUser: any) => {
  await createNotification({
    userId: waitlistEntry.patientId,
    message: `A slot is now available with Dr. ${doctorUser.name} on ${waitlistEntry.requestedDate}. Book quickly before it fills!`,
    type: 'WAITLIST_AVAILABLE',
    metadata: { doctorId: waitlistEntry.doctorId, date: waitlistEntry.requestedDate },
  });
};
