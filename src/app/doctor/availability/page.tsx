'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Plus, Trash2, Loader2, Calendar, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface Availability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

interface Leave {
  id: string;
  date: string;
  reason?: string;
}

export default function AvailabilityPage() {
  const { user } = useAuth();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAvail, setShowAddAvail] = useState(false);
  const [showAddLeave, setShowAddLeave] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newAvail, setNewAvail] = useState({
    dayOfWeek: '1',
    startTime: '09:00',
    endTime: '17:00',
    slotDurationMinutes: '30',
  });
  const [newLeave, setNewLeave] = useState({ date: '', reason: '' });

  const loadData = useCallback(async (dId: string) => {
    try {
      const [availRes, leaveRes] = await Promise.all([
        api.get(`/doctors/${dId}/availability`),
        api.get(`/doctors/${dId}/availability/leaves`),
      ]);
      setAvailability(availRes.data.data);
      setLeaves(leaveRes.data.data);
    } catch {
      toast.error('Failed to load availability data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.get('/auth/me').then(r => {
      const id = r.data.data.doctorId;
      if (id) { setDoctorId(id); loadData(id); }
    });
  }, [loadData]);

  const addAvailability = async () => {
    if (!doctorId) return;
    if (newAvail.startTime >= newAvail.endTime) {
      toast.error('Start time must be before end time');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/doctors/${doctorId}/availability`, {
        dayOfWeek: Number(newAvail.dayOfWeek),
        startTime: newAvail.startTime,
        endTime: newAvail.endTime,
        slotDurationMinutes: Number(newAvail.slotDurationMinutes),
      });
      toast.success('Availability added!');
      setShowAddAvail(false);
      loadData(doctorId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add');
    } finally {
      setSaving(false);
    }
  };

  const deleteAvailability = async (id: string) => {
    if (!doctorId || !confirm('Remove this availability window?')) return;
    try {
      await api.delete(`/doctors/${doctorId}/availability/${id}`);
      toast.success('Removed');
      loadData(doctorId);
    } catch {
      toast.error('Failed to remove');
    }
  };

  const addLeave = async () => {
    if (!doctorId || !newLeave.date) return;
    setSaving(true);
    try {
      await api.post(`/doctors/${doctorId}/availability/leaves`, {
        date: newLeave.date,
        reason: newLeave.reason || undefined,
      });
      toast.success('Leave marked!');
      setShowAddLeave(false);
      setNewLeave({ date: '', reason: '' });
      loadData(doctorId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const deleteLeave = async (id: string) => {
    if (!doctorId) return;
    try {
      await api.delete(`/doctors/${doctorId}/availability/leaves/${id}`);
      toast.success('Leave cancelled');
      loadData(doctorId);
    } catch {
      toast.error('Failed');
    }
  };

  // Group availability by day
  const byDay = DAY_NAMES.reduce((acc, _, i) => {
    acc[i] = availability.filter(a => a.dayOfWeek === i);
    return acc;
  }, {} as Record<number, Availability[]>);

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Availability Management</h1>
          <p className="text-slate-400 mt-1">Set your weekly schedule and mark leave days</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Weekly Schedule */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Weekly Schedule</h2>
                <button onClick={() => setShowAddAvail(true)} className="btn-primary text-sm py-2 px-4">
                  <Plus className="w-4 h-4" /> Add Window
                </button>
              </div>

              <div className="space-y-3">
                {DAY_NAMES.map((day, idx) => (
                  <div key={day} className={`glass-card p-4 ${byDay[idx].length > 0 ? 'border-primary-500/20' : 'opacity-60'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white text-sm">{day}</span>
                      {byDay[idx].length === 0 && <span className="text-xs text-slate-500">Not available</span>}
                    </div>
                    {byDay[idx].map(avail => (
                      <div key={avail.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 mt-2">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-primary-400" />
                          {avail.startTime} – {avail.endTime}
                          <span className="text-xs text-slate-500">({avail.slotDurationMinutes}min slots)</span>
                        </div>
                        <button onClick={() => deleteAvailability(avail.id)} className="text-red-400 hover:text-red-300 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Leave Management */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Leave / Holidays</h2>
                <button onClick={() => setShowAddLeave(true)} className="btn-secondary text-sm py-2 px-4">
                  <Plus className="w-4 h-4" /> Mark Leave
                </button>
              </div>

              {leaves.length === 0 ? (
                <div className="glass-card p-10 text-center">
                  <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No leave days marked</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaves.map(leave => (
                    <div key={leave.id} className="glass-card p-4 flex items-center justify-between border-amber-500/20">
                      <div>
                        <p className="font-medium text-white text-sm">{leave.date}</p>
                        {leave.reason && <p className="text-xs text-slate-400 mt-0.5">{leave.reason}</p>}
                      </div>
                      <button onClick={() => deleteLeave(leave.id)} className="text-red-400 hover:text-red-300 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Availability Modal */}
        {showAddAvail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-card p-6 w-full max-w-sm animate-slide-up">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-white">Add Availability</h3>
                <button onClick={() => setShowAddAvail(false)}><X className="w-5 h-5 text-slate-500 hover:text-white" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="input-label">Day of Week</label>
                  <select className="input-field" value={newAvail.dayOfWeek} onChange={e => setNewAvail(p => ({ ...p, dayOfWeek: e.target.value }))}>
                    {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">Start Time</label>
                    <input type="time" className="input-field" value={newAvail.startTime} onChange={e => setNewAvail(p => ({ ...p, startTime: e.target.value }))} />
                  </div>
                  <div>
                    <label className="input-label">End Time</label>
                    <input type="time" className="input-field" value={newAvail.endTime} onChange={e => setNewAvail(p => ({ ...p, endTime: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="input-label">Slot Duration (minutes)</label>
                  <select className="input-field" value={newAvail.slotDurationMinutes} onChange={e => setNewAvail(p => ({ ...p, slotDurationMinutes: e.target.value }))}>
                    {[15, 20, 30, 45, 60].map(m => <option key={m} value={m}>{m} minutes</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAddAvail(false)} className="btn-secondary flex-1 text-sm py-2.5">Cancel</button>
                <button onClick={addAvailability} disabled={saving} className="btn-primary flex-1 text-sm py-2.5">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Leave Modal */}
        {showAddLeave && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-card p-6 w-full max-w-sm animate-slide-up">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-white">Mark Leave Day</h3>
                <button onClick={() => setShowAddLeave(false)}><X className="w-5 h-5 text-slate-500 hover:text-white" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="input-label">Date</label>
                  <input type="date" className="input-field" value={newLeave.date} min={new Date().toISOString().slice(0, 10)} onChange={e => setNewLeave(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div>
                  <label className="input-label">Reason (optional)</label>
                  <input type="text" className="input-field" placeholder="e.g. Conference, Holiday" value={newLeave.reason} onChange={e => setNewLeave(p => ({ ...p, reason: e.target.value }))} />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAddLeave(false)} className="btn-secondary flex-1 text-sm py-2.5">Cancel</button>
                <button onClick={addLeave} disabled={saving || !newLeave.date} className="btn-primary flex-1 text-sm py-2.5">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Mark Leave
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
