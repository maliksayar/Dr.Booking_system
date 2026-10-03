'use client';

import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import api from '@/lib/api';
import { Calendar, Clock, Filter, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
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

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (filter) params.set('status', filter);
      if (dateFilter) params.set('date', dateFilter);
      const { data } = await api.get(`/appointments?${params}`);
      setAppointments(data.data);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [filter, dateFilter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      toast.success(`Marked as ${status.toLowerCase()}`);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setUpdating(null);
    }
  };

  const statuses = ['CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED'];

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">My Schedule</h1>
          <p className="text-slate-400 mt-1">Manage all patient appointments</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="date"
            className="input-field h-10 sm:w-48"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          />
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFilter('')} className={`text-xs px-3 py-1.5 rounded-full border transition-all ${!filter ? 'bg-primary-600 border-primary-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}>All</button>
            {statuses.map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`text-xs px-3 py-1.5 rounded-full border transition-all ${filter === s ? 'bg-primary-600 border-primary-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}>{s}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>
        ) : appointments.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No appointments found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map(appt => (
              <div key={appt.id} className="glass-card p-5 hover:bg-white/8 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                      {appt.patient.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{appt.patient.name}</p>
                      <p className="text-xs text-slate-400">{appt.patient.email}</p>
                      {appt.patient.phone && <p className="text-xs text-slate-500">{appt.patient.phone}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-400 text-right">
                      <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(parseISO(appt.date), 'MMM d, yyyy')}</div>
                      <div className="flex items-center gap-1 mt-0.5"><Clock className="w-3.5 h-3.5" />{appt.startTime} – {appt.endTime}</div>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                </div>
                {appt.notes && <p className="mt-2 text-xs text-slate-500 italic">Notes: {appt.notes}</p>}
                {['CONFIRMED', 'PENDING'].includes(appt.status) && (
                  <div className="mt-3 flex gap-2">
                    {appt.status === 'PENDING' && (
                      <button onClick={() => updateStatus(appt.id, 'CONFIRMED')} disabled={updating === appt.id} className="btn-success text-xs py-1.5 px-3">
                        {updating === appt.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Confirm
                      </button>
                    )}
                    {appt.status === 'CONFIRMED' && (
                      <button onClick={() => updateStatus(appt.id, 'COMPLETED')} disabled={updating === appt.id} className="btn-success text-xs py-1.5 px-3">
                        <CheckCircle className="w-3 h-3" /> Complete
                      </button>
                    )}
                    <button onClick={() => updateStatus(appt.id, 'CANCELLED')} disabled={updating === appt.id} className="btn-danger text-xs py-1.5 px-3">
                      <XCircle className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
