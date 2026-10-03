import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { doctorProfileSchema } from '@/lib/validators';
import { authenticateRequest, authorizeRole, jsonSuccess, jsonError, handleRouteError } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
        availability: { orderBy: { dayOfWeek: 'asc' } },
        leaves: {
          where: { date: { gte: new Date().toISOString().slice(0, 10) } },
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!doctor) {
      return jsonError('Doctor not found', 404);
    }

    return jsonSuccess(doctor);
  } catch (err: any) {
    return handleRouteError(err);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = authenticateRequest(req);
    if (auth.response) return auth.response;

    const roleErr = authorizeRole(auth.user!, 'DOCTOR', 'ADMIN');
    if (roleErr) return roleErr;

    const doctor = await prisma.doctor.findUnique({ where: { id: params.id } });
    if (!doctor) {
      return jsonError('Doctor not found', 404);
    }

    // Doctors can only update their own profile
    if (auth.user!.role === 'DOCTOR') {
      const selfDoctor = await prisma.doctor.findUnique({ where: { userId: auth.user!.id } });
      if (!selfDoctor || selfDoctor.id !== params.id) {
        return jsonError('Not authorized', 403);
      }
    }

    const body = await req.json();
    const parsed = doctorProfileSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Validation error', 400, {
        errors: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    const {
      name,
      phone,
      specialization,
      experienceYears,
      bio,
      consultationFee,
      isApprovalRequired,
      avatarUrl,
      qualifications,
    } = parsed.data;

    const doctorData: any = {};
    if (specialization !== undefined) doctorData.specialization = specialization;
    if (experienceYears !== undefined) doctorData.experienceYears = experienceYears;
    if (bio !== undefined) doctorData.bio = bio;
    if (consultationFee !== undefined) doctorData.consultationFee = consultationFee;
    if (isApprovalRequired !== undefined) doctorData.isApprovalRequired = isApprovalRequired;
    if (avatarUrl !== undefined) doctorData.avatarUrl = avatarUrl;
    if (qualifications !== undefined) doctorData.qualifications = qualifications;

    const userData: any = {};
    if (name !== undefined) userData.name = name;
    if (phone !== undefined) userData.phone = phone;

    if (Object.keys(userData).length > 0) {
      await prisma.user.update({
        where: { id: doctor.userId },
        data: userData,
      });
    }

    const updated = await prisma.doctor.update({
      where: { id: params.id },
      data: doctorData,
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    });

    return jsonSuccess(updated, 'Doctor profile updated successfully');
  } catch (err: any) {
    return handleRouteError(err);
  }
}
