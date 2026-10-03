/**
 * Prisma Seed Script
 * Creates demo data: 1 admin, 3 doctors, 3 patients, appointments
 * Run: node prisma/seed.js  (or npm run seed)
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const hash = (p) => bcrypt.hash(p, 12);

async function main() {
  console.log('🌱 Seeding database...');

  // ── Cleanup ──────────────────────────────────────────────────────────────────
  await prisma.notification.deleteMany();
  await prisma.waitlist.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctorLeave.deleteMany();
  await prisma.doctorAvailability.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  console.log('  ✓ Cleared existing data');

  // ── Admin ─────────────────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@healthcart.com',
      passwordHash: await hash('Admin@123'),
      role: 'ADMIN',
      phone: '+91-9000000000',
    },
  });
  console.log(`  ✓ Admin: ${admin.email}`);

  // ── Doctors ───────────────────────────────────────────────────────────────────
  const doctorData = [
    {
      name: 'Dr. Priya Sharma',
      email: 'priya.sharma@healthcart.com',
      specialization: 'Cardiology',
      qualifications: 'MBBS, MD (Cardiology), DM (AIIMS Delhi)',
      avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300',
      experienceYears: 12,
      consultationFee: 1500,
      bio: 'Senior cardiologist with expertise in interventional cardiology and heart failure management. MBBS, MD, DM Cardiology from AIIMS Delhi.',
      availability: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30 }, // Monday
        { dayOfWeek: 1, startTime: '14:00', endTime: '17:00', slotDurationMinutes: 30 },
        { dayOfWeek: 3, startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30 }, // Wednesday
        { dayOfWeek: 5, startTime: '10:00', endTime: '14:00', slotDurationMinutes: 30 }, // Friday
      ],
    },
    {
      name: 'Dr. Arjun Mehta',
      email: 'arjun.mehta@healthcart.com',
      specialization: 'Orthopedics',
      qualifications: 'MBBS, MS (Orthopedics), MCh, FRCS',
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300&h=300',
      experienceYears: 8,
      consultationFee: 1200,
      bio: 'Orthopedic surgeon specializing in sports medicine, joint replacement, and spine surgery. Fellowship trained at Royal London Hospital.',
      availability: [
        { dayOfWeek: 2, startTime: '08:00', endTime: '12:00', slotDurationMinutes: 45 }, // Tuesday
        { dayOfWeek: 4, startTime: '08:00', endTime: '12:00', slotDurationMinutes: 45 }, // Thursday
        { dayOfWeek: 6, startTime: '09:00', endTime: '13:00', slotDurationMinutes: 45 }, // Saturday
      ],
    },
    {
      name: 'Dr. Meera Nair',
      email: 'meera.nair@healthcart.com',
      specialization: 'Dermatology',
      qualifications: 'MBBS, MD (Dermatology, Venereology)',
      avatarUrl: 'https://images.unsplash.com/photo-1594824813637-67c87c7bb613?auto=format&fit=crop&q=80&w=300&h=300',
      experienceYears: 6,
      consultationFee: 800,
      bio: 'Cosmetic and medical dermatologist. Specializes in acne, pigmentation, hair loss, and skin cancer screening. MD Dermatology, Venereology.',
      availability: [
        { dayOfWeek: 1, startTime: '10:00', endTime: '14:00', slotDurationMinutes: 20 }, // Monday
        { dayOfWeek: 2, startTime: '14:00', endTime: '18:00', slotDurationMinutes: 20 }, // Tuesday
        { dayOfWeek: 4, startTime: '10:00', endTime: '14:00', slotDurationMinutes: 20 }, // Thursday
        { dayOfWeek: 5, startTime: '14:00', endTime: '18:00', slotDurationMinutes: 20 }, // Friday
      ],
    },
  ];

  const doctors = [];
  for (const d of doctorData) {
    const user = await prisma.user.create({
      data: {
        name: d.name,
        email: d.email,
        passwordHash: await hash('Doctor@123'),
        role: 'DOCTOR',
        phone: `+91-900000000${doctors.length + 1}`,
      },
    });

    const doctor = await prisma.doctor.create({
      data: {
        userId: user.id,
        specialization: d.specialization,
        experienceYears: d.experienceYears,
        consultationFee: d.consultationFee,
        bio: d.bio,
        avatarUrl: d.avatarUrl,
        qualifications: d.qualifications,
        availability: { create: d.availability },
      },
    });

    doctors.push({ user, doctor });
    console.log(`  ✓ Doctor: ${user.email} (${d.specialization})`);
  }

  // ── Doctor Leave (Dr. Priya on a future date) ─────────────────────────────────
  const leaveDate = new Date();
  leaveDate.setDate(leaveDate.getDate() + 10);
  const leaveDateStr = leaveDate.toISOString().slice(0, 10);
  await prisma.doctorLeave.create({
    data: { doctorId: doctors[0].doctor.id, date: leaveDateStr, reason: 'Conference' },
  });

  // ── Patients ──────────────────────────────────────────────────────────────────
  const patientData = [
    { name: 'Rahul Kumar', email: 'rahul@example.com', phone: '+91-9111111111' },
    { name: 'Sunita Patel', email: 'sunita@example.com', phone: '+91-9222222222' },
    { name: 'Amir Khan', email: 'amir@example.com', phone: '+91-9333333333' },
  ];

  const patients = [];
  for (const p of patientData) {
    const user = await prisma.user.create({
      data: {
        name: p.name,
        email: p.email,
        passwordHash: await hash('Patient@123'),
        role: 'PATIENT',
        phone: p.phone,
      },
    });
    patients.push(user);
    console.log(`  ✓ Patient: ${user.email}`);
  }

  // ── Appointments ───────────────────────────────────────────────────────────────
  // Get upcoming weekday dates for appointments
  const getNextWeekday = (dayOfWeek, weeksAhead = 0) => {
    const d = new Date();
    const diff = (dayOfWeek - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff + weeksAhead * 7);
    return d.toISOString().slice(0, 10);
  };

  const appointmentSeed = [
    {
      doctorId: doctors[0].doctor.id,  // Priya - Cardiology (Mon)
      patientId: patients[0].id,
      date: getNextWeekday(1),
      startTime: '09:00', endTime: '09:30',
      status: 'CONFIRMED',
      notes: 'Follow-up for blood pressure management',
    },
    {
      doctorId: doctors[0].doctor.id,  // Priya - (Mon)
      patientId: patients[1].id,
      date: getNextWeekday(1),
      startTime: '09:30', endTime: '10:00',
      status: 'PENDING',
      notes: 'First consultation - chest pain evaluation',
    },
    {
      doctorId: doctors[1].doctor.id,  // Arjun - Orthopedics (Tue)
      patientId: patients[1].id,
      date: getNextWeekday(2),
      startTime: '08:00', endTime: '08:45',
      status: 'CONFIRMED',
      notes: 'Knee pain - possible meniscus tear',
    },
    {
      doctorId: doctors[2].doctor.id,  // Meera - Dermatology (Thu)
      patientId: patients[2].id,
      date: getNextWeekday(4),
      startTime: '10:00', endTime: '10:20',
      status: 'CONFIRMED',
      notes: 'Acne treatment follow-up',
    },
    {
      doctorId: doctors[2].doctor.id,  // Meera - (past)
      patientId: patients[0].id,
      date: '2026-07-01',
      startTime: '10:20', endTime: '10:40',
      status: 'COMPLETED',
      notes: 'Completed skin screening',
    },
    {
      doctorId: doctors[1].doctor.id,
      patientId: patients[2].id,
      date: '2026-07-03',
      startTime: '08:00', endTime: '08:45',
      status: 'CANCELLED',
      cancelReason: 'Patient requested cancellation',
    },
  ];

  for (const appt of appointmentSeed) {
    await prisma.appointment.create({ data: appt });
  }
  console.log(`  ✓ Created ${appointmentSeed.length} appointments`);

  // ── Notifications ─────────────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        userId: patients[0].id,
        message: 'Your appointment with Dr. Priya Sharma on Monday at 09:00 is confirmed.',
        type: 'BOOKING_CONFIRMED',
      },
      {
        userId: patients[1].id,
        message: 'Your appointment request is pending approval.',
        type: 'BOOKING_CONFIRMED',
      },
      {
        userId: patients[0].id,
        message: 'Welcome to HealthCart! Book your first appointment with top doctors.',
        type: 'GENERAL',
      },
    ],
  });
  console.log('  ✓ Sample notifications created');

  // ── Waitlist entry ────────────────────────────────────────────────────────────
  await prisma.waitlist.create({
    data: {
      doctorId: doctors[0].doctor.id,
      patientId: patients[2].id,
      requestedDate: getNextWeekday(3), // Wed
      status: 'WAITING',
    },
  });
  console.log('  ✓ Waitlist entry created');

  console.log('\n✅ Database seeded successfully!\n');
  console.log('Login credentials:');
  console.log('  Admin:   admin@healthcart.com    / Admin@123');
  console.log('  Doctor1: priya.sharma@healthcart.com / Doctor@123');
  console.log('  Doctor2: arjun.mehta@healthcart.com  / Doctor@123');
  console.log('  Doctor3: meera.nair@healthcart.com   / Doctor@123');
  console.log('  Patient1: rahul@example.com       / Patient@123');
  console.log('  Patient2: sunita@example.com      / Patient@123');
  console.log('  Patient3: amir@example.com        / Patient@123\n');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
