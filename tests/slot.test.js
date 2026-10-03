/**
 * Unit tests for the core slot generation algorithm (src/lib/services/slotService.ts)
 * Tests run against pure functions — no database required.
 */

const { generateSlotsFromData, timeToMinutes, minutesToTime } = require('../src/lib/services/slotService');

describe('timeToMinutes / minutesToTime utilities', () => {
  test('converts "09:00" to 540', () => {
    expect(timeToMinutes('09:00')).toBe(540);
  });

  test('converts "00:00" to 0', () => {
    expect(timeToMinutes('00:00')).toBe(0);
  });

  test('converts "23:59" to 1439', () => {
    expect(timeToMinutes('23:59')).toBe(1439);
  });

  test('converts 540 back to "09:00"', () => {
    expect(minutesToTime(540)).toBe('09:00');
  });

  test('converts 0 back to "00:00"', () => {
    expect(minutesToTime(0)).toBe('00:00');
  });

  test('round-trips "14:30"', () => {
    expect(minutesToTime(timeToMinutes('14:30'))).toBe('14:30');
  });
});

describe('generateSlotsFromData — basic slot generation', () => {
  const avail = [{ startTime: '09:00', endTime: '11:00', slotDurationMinutes: 30 }];

  test('generates correct number of slots for 2-hour window with 30-min slots', () => {
    const slots = generateSlotsFromData(avail);
    expect(slots).toHaveLength(4); // 09:00, 09:30, 10:00, 10:30
  });

  test('slots have correct start and end times', () => {
    const slots = generateSlotsFromData(avail);
    expect(slots[0]).toMatchObject({ startTime: '09:00', endTime: '09:30' });
    expect(slots[1]).toMatchObject({ startTime: '09:30', endTime: '10:00' });
    expect(slots[2]).toMatchObject({ startTime: '10:00', endTime: '10:30' });
    expect(slots[3]).toMatchObject({ startTime: '10:30', endTime: '11:00' });
  });

  test('all slots are available when no bookings exist', () => {
    const slots = generateSlotsFromData(avail, []);
    expect(slots.every((s) => s.isAvailable)).toBe(true);
  });

  test('does not create a partial slot at end of window', () => {
    // 90-min window with 60-min slots → only 1 slot (not 2)
    const avail60 = [{ startTime: '09:00', endTime: '10:30', slotDurationMinutes: 60 }];
    const slots = generateSlotsFromData(avail60);
    expect(slots).toHaveLength(1);
    expect(slots[0]).toMatchObject({ startTime: '09:00', endTime: '10:00' });
  });
});

describe('generateSlotsFromData — conflict subtraction', () => {
  const avail = [{ startTime: '09:00', endTime: '12:00', slotDurationMinutes: 30 }];

  test('marks booked slot as unavailable', () => {
    const booked = [{ startTime: '09:30' }];
    const slots = generateSlotsFromData(avail, booked);
    const slot0930 = slots.find((s) => s.startTime === '09:30');
    expect(slot0930?.isAvailable).toBe(false);
  });

  test('leaves other slots available when one is booked', () => {
    const booked = [{ startTime: '09:30' }];
    const slots = generateSlotsFromData(avail, booked);
    const availableSlots = slots.filter((s) => s.isAvailable);
    expect(availableSlots).toHaveLength(5);
    expect(availableSlots.map((s) => s.startTime)).toEqual([
      '09:00',
      '10:00',
      '10:30',
      '11:00',
      '11:30',
    ]);
  });

  test('marks all slots unavailable if all are booked', () => {
    const booked = [
      { startTime: '09:00' },
      { startTime: '09:30' },
      { startTime: '10:00' },
      { startTime: '10:30' },
      { startTime: '11:00' },
      { startTime: '11:30' },
    ];
    const slots = generateSlotsFromData(avail, booked);
    expect(slots.every((s) => !s.isAvailable)).toBe(true);
  });
});

describe('generateSlotsFromData — multiple availability windows', () => {
  const splitAvail = [
    { startTime: '09:00', endTime: '12:00', slotDurationMinutes: 30 }, // Morning: 6 slots
    { startTime: '14:00', endTime: '17:00', slotDurationMinutes: 30 }, // Afternoon: 6 slots
  ];

  test('generates slots across split morning and afternoon sessions', () => {
    const slots = generateSlotsFromData(splitAvail);
    expect(slots).toHaveLength(12);
  });

  test('no slots are generated during lunch break (12:00 – 14:00)', () => {
    const slots = generateSlotsFromData(splitAvail);
    const lunchSlots = slots.filter((s) => s.startTime >= '12:00' && s.startTime < '14:00');
    expect(lunchSlots).toHaveLength(0);
  });

  test('handles different slot durations in different windows', () => {
    const mixed = [
      { startTime: '09:00', endTime: '10:00', slotDurationMinutes: 30 }, // 2 slots: 09:00, 09:30
      { startTime: '10:00', endTime: '11:00', slotDurationMinutes: 20 }, // 3 slots: 10:00, 10:20, 10:40
    ];
    const slots = generateSlotsFromData(mixed);
    expect(slots).toHaveLength(5);
    expect(slots.map((s) => s.startTime)).toEqual(['09:00', '09:30', '10:00', '10:20', '10:40']);
  });
});

describe('generateSlotsFromData — edge cases', () => {
  test('returns empty array when doctor has no availability', () => {
    expect(generateSlotsFromData([])).toEqual([]);
  });

  test('handles midnight-spanning / zero duration gracefully', () => {
    const zeroDuration = [{ startTime: '09:00', endTime: '09:00', slotDurationMinutes: 30 }];
    expect(generateSlotsFromData(zeroDuration)).toEqual([]);
  });

  test('ignores booked slots outside availability windows', () => {
    const avail = [{ startTime: '09:00', endTime: '10:00', slotDurationMinutes: 30 }];
    const booked = [{ startTime: '15:00' }]; // outside window
    const slots = generateSlotsFromData(avail, booked);
    expect(slots).toHaveLength(2);
    expect(slots.every((s) => s.isAvailable)).toBe(true);
  });
});
