'use client';

import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import api from '@/lib/api';
import { Calendar, Clock, Filter, Loader2, X, RotateCcw, XCircle, ChevronRight } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import toast from 'react-hot-toast';

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  cancelReason?: string;
  createdAt: string;
  doctor: { id: string; specialization: string; avatarUrl?: string | null; qualifications?: string | null; user: { name: string } };
}

interface Slot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null);
  const [rescheduleSlots, setRescheduleSlots] = useState<Slot[]>([]);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState<Slot | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = filter ? `?status=${filter}` : '';
      const { data } = await api.get(`/appointments${params}`);
      setAppointments(data.data);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    setCancelling(id);
    try {
      await api.patch(`/appointments/${id}/cancel`, { reason: 'Patient requested cancellation' });
      toast.success('Appointment cancelled');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cannot cancel this appointment');
    } finally {
      setCancelling(null);
    }
  };

  const openReschedule = async (appt: Appointment) => {
    setRescheduling(appt);
    const newDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    setRescheduleDate(newDate);
    loadSlotsForReschedule(appt.doctor.id, newDate);
  };

  const loadSlotsForReschedule = async (doctorId: string, date: string) => {
    try {
      const { data } = await api.get(`/doctors/${doctorId}/slots?date=${date}`);
      setRescheduleSlots(data.data.slots.filter((s: Slot) => s.isAvailable));
    } catch {
      setRescheduleSlots([]);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduling || !rescheduleSlot) return;
    setSubmitting(true);
    try {
      await api.patch(`/appointments/${rescheduling.id}/reschedule`, {
        date: rescheduleDate,
        startTime: rescheduleSlot.startTime,
      });
      toast.success('Appointment rescheduled!');
      setRescheduling(null);
      setRescheduleSlot(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Reschedule failed');
    } finally {
      setSubmitting(false);
    }
  };

  const statuses = ['CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Appointments</h1>
            <p className="text-slate-400 mt-1">Manage your bookings</p>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setFilter('')}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${!filter ? 'bg-primary-600 border-primary-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
          >
            All
          </button>
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${filter === s ? 'bg-primary-600 border-primary-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>
        ) : appointments.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No appointments {filter ? `with status "${filter}"` : 'found'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appt) => (
              <div key={appt.id} className="glass-card p-5 hover:bg-white/8 transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden shadow-md">
                      {appt.doctor.avatarUrl ? (
                        <img src={appt.doctor.avatarUrl} alt={appt.doctor.user.name} className="w-full h-full object-cover" />
                      ) : (
                        appt.doctor.user.name.split(' ').pop()?.[0] ?? 'D'
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{appt.doctor.user.name}</p>
                      <p className="text-xs text-primary-400 font-medium">{appt.doctor.specialization}</p>
                    </div>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {format(parseISO(appt.date), 'EEE, MMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {appt.startTime} – {appt.endTime}
                  </span>
                </div>

                {appt.notes && (
                  <p className="mt-2 text-xs text-slate-500 italic">Notes: {appt.notes}</p>
                )}
                {appt.cancelReason && (
                  <p className="mt-2 text-xs text-red-400">Reason: {appt.cancelReason}</p>
                )}

                {/* Actions */}
                {['CONFIRMED', 'PENDING'].includes(appt.status) && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => openReschedule(appt)}
                      className="btn-success text-xs py-1.5 px-3"
                    >
                      <RotateCcw className="w-3 h-3" /> Reschedule
                    </button>
                    <button
                      onClick={() => handleCancel(appt.id)}
                      disabled={cancelling === appt.id}
                      className="btn-danger text-xs py-1.5 px-3"
                    >
                      {cancelling === appt.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reschedule Modal */}
        {rescheduling && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-card p-6 w-full max-w-md animate-slide-up">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-white text-lg">Reschedule Appointment</h3>
                <button onClick={() => setRescheduling(null)} className="text-slate-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-slate-400 mb-4">
                Rescheduling with <strong className="text-white">{rescheduling.doctor.user.name}</strong>
              </p>

              <div className="mb-4">
                <label className="input-label">New Date</label>
                <input
                  type="date"
                  className="input-field"
                  min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                  value={rescheduleDate}
                  onChange={e => {
                    setRescheduleDate(e.target.value);
                    setRescheduleSlot(null);
                    if (e.target.value) loadSlotsForReschedule(rescheduling.doctor.id, e.target.value);
                  }}
                />
              </div>

              {rescheduleSlots.length > 0 ? (
                <div className="mb-4">
                  <label className="input-label">Available Slots</label>
                  <div className="grid grid-cols-4 gap-2">
                    {rescheduleSlots.map(s => (
                      <button
                        key={s.startTime}
                        onClick={() => setRescheduleSlot(s)}
                        className={`py-2 rounded-xl text-xs font-medium transition-all border ${
                          rescheduleSlot?.startTime === s.startTime
                            ? 'bg-primary-600 text-white border-primary-400'
                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {s.startTime}
                      </button>
                    ))}
                  </div>
                </div>
              ) : rescheduleDate ? (
                <p className="text-sm text-slate-400 mb-4">No slots available on this day.</p>
              ) : null}

              <div className="flex gap-3">
                <button onClick={() => setRescheduling(null)} className="btn-secondary flex-1 text-sm py-2.5">Cancel</button>
                <button
                  onClick={handleReschedule}
                  disabled={!rescheduleSlot || submitting}
                  className="btn-primary flex-1 text-sm py-2.5"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
