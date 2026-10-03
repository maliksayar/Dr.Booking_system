import prisma from '../prisma';
import { parseISO, getDay } from 'date-fns';

/**
 * Convert "HH:MM" string to total minutes from midnight
 */
export const timeToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Convert total minutes from midnight to "HH:MM" string
 */
export const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export interface SlotResult {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  slotDurationMinutes?: number;
}

/**
 * Generate all theoretical slots from availability windows,
 * then subtract booked slots and return only open ones.
 */
export const getAvailableSlots = async (
  doctorId: string,
  date: string,
  options: { includeBooked?: boolean } = {}
): Promise<SlotResult[]> => {
  const { includeBooked = false } = options;

  // 1. Check if doctor is on leave for this date
  const leave = await prisma.doctorLeave.findUnique({
    where: { doctorId_date: { doctorId, date } },
  });
  if (leave) {
    return []; // Doctor is on leave — no slots
  }

  // 2. Get day of week for the given date (0=Sun … 6=Sat)
  const dayOfWeek = getDay(parseISO(date));

  // 3. Fetch doctor's availability windows for this day
  const availabilities = await prisma.doctorAvailability.findMany({
    where: { doctorId, dayOfWeek },
    orderBy: { startTime: 'asc' },
  });

  if (availabilities.length === 0) {
    return []; // Doctor doesn't work on this day
  }

  // 4. Fetch existing bookings for this doctor on this date (active only)
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      date,
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    select: { startTime: true, endTime: true },
  });

  // Build a set of booked start times for O(1) lookup
  const bookedStartTimes = new Set(existingAppointments.map((a) => a.startTime));

  // 5. Generate slots for each availability window
  const allSlots: SlotResult[] = [];

  for (const avail of availabilities) {
    const slotDuration = avail.slotDurationMinutes;
    let current = timeToMinutes(avail.startTime);
    const end = timeToMinutes(avail.endTime);

    while (current + slotDuration <= end) {
      const slotStart = minutesToTime(current);
      const slotEnd = minutesToTime(current + slotDuration);
      const isAvailable = !bookedStartTimes.has(slotStart);

      if (isAvailable || includeBooked) {
        allSlots.push({
          startTime: slotStart,
          endTime: slotEnd,
          isAvailable,
          slotDurationMinutes: slotDuration,
        });
      }

      current += slotDuration;
    }
  }

  return allSlots;
};

/**
 * Check if a specific slot is available for a doctor on a date.
 * Used for conflict detection before booking.
 */
export const checkSlotAvailability = async (
  doctorId: string,
  date: string,
  startTime: string
): Promise<{ available: boolean; reason?: string; endTime?: string; slotDurationMinutes?: number }> => {
  // 1. Leave check
  const leave = await prisma.doctorLeave.findUnique({
    where: { doctorId_date: { doctorId, date } },
  });
  if (leave) {
    return { available: false, reason: 'Doctor is on leave on this date' };
  }

  // 2. Day of week availability check
  const dayOfWeek = getDay(parseISO(date));
  const availabilities = await prisma.doctorAvailability.findMany({
    where: { doctorId, dayOfWeek },
  });
  if (availabilities.length === 0) {
    return { available: false, reason: 'Doctor does not work on this day' };
  }

  // 3. Validate slot falls within at least one availability window
  const requestedMinutes = timeToMinutes(startTime);
  const matchingAvail = availabilities.find((avail) => {
    const availStart = timeToMinutes(avail.startTime);
    const availEnd = timeToMinutes(avail.endTime);
    const slotEnd = requestedMinutes + avail.slotDurationMinutes;
    return (
      requestedMinutes >= availStart &&
      slotEnd <= availEnd &&
      (requestedMinutes - availStart) % avail.slotDurationMinutes === 0
    );
  });

  if (!matchingAvail) {
    return {
      available: false,
      reason: 'Requested time is outside doctor availability window or does not align with slot grid',
    };
  }

  // 4. Conflict check — existing booking at same time
  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId,
      date,
      startTime,
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
  });
  if (conflict) {
    return { available: false, reason: 'Slot is already booked' };
  }

  const endTime = minutesToTime(requestedMinutes + matchingAvail.slotDurationMinutes);
  return { available: true, endTime, slotDurationMinutes: matchingAvail.slotDurationMinutes };
};

/**
 * Pure function — Generate slots from availability windows without DB.
 */
export const generateSlotsFromData = (
  availabilities: Array<{ startTime: string; endTime: string; slotDurationMinutes: number }>,
  bookedSlots: Array<{ startTime: string }> = []
): Array<{ startTime: string; endTime: string; isAvailable: boolean }> => {
  const bookedSet = new Set(bookedSlots.map((s) => s.startTime));
  const result: Array<{ startTime: string; endTime: string; isAvailable: boolean }> = [];

  for (const avail of availabilities) {
    const slotDuration = avail.slotDurationMinutes;
    let current = timeToMinutes(avail.startTime);
    const end = timeToMinutes(avail.endTime);

    while (current + slotDuration <= end) {
      const slotStart = minutesToTime(current);
      const slotEnd = minutesToTime(current + slotDuration);
      result.push({
        startTime: slotStart,
        endTime: slotEnd,
        isAvailable: !bookedSet.has(slotStart),
      });
      current += slotDuration;
    }
  }

  return result;
};
