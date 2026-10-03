'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import api from '@/lib/api';
import Link from 'next/link';
import { Calendar, Clock, Search, Bell, ArrowRight, Loader2, User2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  doctor: { user: { name: string }; specialization: string };
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [apptRes, notifRes] = await Promise.all([
          api.get('/appointments?limit=5'),
          api.get('/notifications?limit=5'),
        ]);
        setAppointments(apptRes.data.data);
        setNotifications(notifRes.data.data);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const upcoming = appointments.filter(a => ['CONFIRMED', 'PENDING'].includes(a.status));
  const past = appointments.filter(a => ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status));

  return (
    <DashboardLayout>
      <div className="page-container">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-400 mt-1">Here&apos;s an overview of your health appointments.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Link href="/patient/search" className="glass-card p-5 hover:bg-white/10 transition-all duration-300 group hover:border-primary-500/30">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 mb-3 group-hover:bg-primary-500/20">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white mb-1">Find a Doctor</h3>
            <p className="text-xs text-slate-400">Search by specialization or name</p>
          </Link>

          <Link href="/patient/appointments" className="glass-card p-5 hover:bg-white/10 transition-all duration-300 group hover:border-violet-500/30">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-3 group-hover:bg-violet-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white mb-1">My Appointments</h3>
            <p className="text-xs text-slate-400">View, cancel or reschedule</p>
          </Link>

          <Link href="/notifications" className="glass-card p-5 hover:bg-white/10 transition-all duration-300 group hover:border-amber-500/30">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 group-hover:bg-amber-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white mb-1">Notifications</h3>
            <p className="text-xs text-slate-400">Stay updated on bookings</p>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Upcoming Appointments */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title mb-0">Upcoming Appointments</h2>
                <Link href="/patient/appointments" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {upcoming.length === 0 ? (
                <div className="glass-card p-10 text-center">
                  <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No upcoming appointments</p>
                  <Link href="/patient/search" className="btn-primary mt-4 text-sm py-2 inline-flex">
                    Book your first appointment
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((appt) => (
                    <div key={appt.id} className="glass-card p-5 hover:bg-white/8 transition-all duration-200">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {appt.doctor.user.name.split(' ').pop()?.[0] ?? 'D'}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{appt.doctor.user.name}</p>
                            <p className="text-xs text-slate-400">{appt.doctor.specialization}</p>
                          </div>
                        </div>
                        <StatusBadge status={appt.status} />
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(parseISO(appt.date), 'EEE, MMM d, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {appt.startTime} – {appt.endTime}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div>
              <h2 className="section-title">Recent Notifications</h2>
              {notifications.length === 0 ? (
                <div className="glass-card p-6 text-center">
                  <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div key={n.id} className={`glass-card p-4 transition-all ${!n.isRead ? 'border-primary-500/30 bg-primary-500/5' : ''}`}>
                      <p className="text-sm text-slate-300">{n.message}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(parseISO(n.createdAt), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  ))}
                  <Link href="/notifications" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 pt-1">
                    See all notifications <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
