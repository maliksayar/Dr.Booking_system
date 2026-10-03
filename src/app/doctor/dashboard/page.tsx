'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import api from '@/lib/api';
import { Calendar, Clock, Users, Loader2, CheckCircle, XCircle, ClipboardList, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  patient: { name: string; email: string; phone?: string };
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayStr] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/appointments?date=${todayStr}&limit=50`);
      setAppointments(data.data);
    } catch {
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, [todayStr]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      toast.success(`Appointment marked as ${status.toLowerCase()}`);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const today = appointments.filter(a => a.date === todayStr);
  const upcoming = appointments.filter(a => a.date > todayStr && ['CONFIRMED', 'PENDING'].includes(a.status));
  const todayDayName = DAYS[new Date().getDay()];

  const stats = [
    { label: "Today's Patients", value: today.length, icon: <Users className="w-5 h-5" />, color: 'text-blue-400' },
    { label: 'Confirmed', value: today.filter(a => a.status === 'CONFIRMED').length, icon: <CheckCircle className="w-5 h-5" />, color: 'text-emerald-400' },
    { label: 'Pending', value: today.filter(a => a.status === 'PENDING').length, icon: <Clock className="w-5 h-5" />, color: 'text-amber-400' },
    { label: 'Upcoming', value: upcoming.length, icon: <Calendar className="w-5 h-5" />, color: 'text-violet-400' },
  ];

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 overflow-hidden shadow-lg border border-white/10">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase() ?? 'D'
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {user?.name || `${todayDayName}&apos;s Schedule`}
              </h1>
              <p className="text-slate-400 mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')} • Doctor Dashboard</p>
            </div>
          </div>
          <Link
            href="/doctor/profile"
            className="btn-secondary text-sm py-2 px-4 gap-2 self-start sm:self-auto"
          >
            <User className="w-4 h-4 text-primary-400" />
            Edit Profile & Photo
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="stat-card">
              <div className={`mb-2 ${s.color}`}>{s.icon}</div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>
        ) : (
          <>
            {/* Today's Appointments */}
            <div className="mb-8">
              <h2 className="section-title">Today&apos;s Appointments</h2>
              {today.length === 0 ? (
                <div className="glass-card p-10 text-center">
                  <ClipboardList className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No appointments today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {today.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((appt) => (
                    <div key={appt.id} className="glass-card p-5 hover:bg-white/8 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {appt.patient.name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{appt.patient.name}</p>
                            {appt.patient.phone && <p className="text-xs text-slate-400">{appt.patient.phone}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <Clock className="w-4 h-4" />
                          <span>{appt.startTime} – {appt.endTime}</span>
                          <StatusBadge status={appt.status} />
                        </div>
                      </div>

                      {appt.notes && (
                        <p className="mt-2 text-xs text-slate-500 pl-13">Notes: {appt.notes}</p>
                      )}

                      {appt.status === 'CONFIRMED' && (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => updateStatus(appt.id, 'COMPLETED')}
                            disabled={updating === appt.id}
                            className="btn-success text-xs py-1.5 px-3"
                          >
                            {updating === appt.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                            Mark Completed
                          </button>
                          <button
                            onClick={() => updateStatus(appt.id, 'NO_SHOW')}
                            disabled={updating === appt.id}
                            className="btn-danger text-xs py-1.5 px-3"
                          >
                            <XCircle className="w-3 h-3" /> No Show
                          </button>
                        </div>
                      )}
                      {appt.status === 'PENDING' && (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => updateStatus(appt.id, 'CONFIRMED')}
                            disabled={updating === appt.id}
                            className="btn-success text-xs py-1.5 px-3"
                          >
                            {updating === appt.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                            Confirm
                          </button>
                          <button
                            onClick={() => updateStatus(appt.id, 'CANCELLED')}
                            disabled={updating === appt.id}
                            className="btn-danger text-xs py-1.5 px-3"
                          >
                            <XCircle className="w-3 h-3" /> Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div>
                <h2 className="section-title">Upcoming Appointments</h2>
                <div className="space-y-3">
                  {upcoming.slice(0, 5).map((appt) => (
                    <div key={appt.id} className="glass-card p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
                          {appt.patient.name[0]}
                        </div>
                        <span className="text-sm font-medium text-white">{appt.patient.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        <span>{format(parseISO(appt.date), 'MMM d')}</span>
                        <span>{appt.startTime}</span>
                        <StatusBadge status={appt.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
