'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Calendar, Clock, ChevronLeft, ChevronRight, Loader2, Star, DollarSign } from 'lucide-react';
import { format, addDays, parseISO, startOfDay, isToday, isTomorrow } from 'date-fns';
import toast from 'react-hot-toast';

interface Slot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface Doctor {
  id: string;
  specialization: string;
  experienceYears: number;
  bio: string;
  consultationFee: string;
  avatarUrl?: string | null;
  qualifications?: string | null;
  user: { name: string; email: string; phone?: string };
}

export default function BookingPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [notes, setNotes] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    api.get(`/doctors/${doctorId}`).then(r => setDoctor(r.data.data)).catch(() => toast.error('Doctor not found'));
  }, [doctorId]);

  useEffect(() => {
    if (!doctorId) return;
    setSelectedSlot(null);
    setLoadingSlots(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    api.get(`/doctors/${doctorId}/slots?date=${dateStr}`)
      .then(r => setSlots(r.data.data.slots))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [doctorId, selectedDate]);

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBooking(true);
    try {
      await api.post('/appointments', {
        doctorId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: selectedSlot.startTime,
        notes: notes || undefined,
      });
      setConfirmed(true);
      toast.success('Appointment booked successfully! 🎉');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const dateLabel = (d: Date) => {
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'EEE, MMM d');
  };

  const availableSlots = slots.filter(s => s.isAvailable);

  if (confirmed) {
    return (
      <DashboardLayout>
        <div className="page-container flex items-center justify-center min-h-[60vh]">
          <div className="glass-card p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Appointment Confirmed!</h2>
            <p className="text-slate-400 mb-2">
              Your appointment with <strong className="text-white">{doctor?.user.name}</strong>
            </p>
            <p className="text-primary-400 font-semibold mb-6">
              {format(selectedDate, 'EEEE, MMM d, yyyy')} at {selectedSlot?.startTime}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => router.push('/patient/appointments')} className="btn-primary flex-1 text-sm py-2.5">
                View My Appointments
              </button>
              <button onClick={() => { setConfirmed(false); setSelectedSlot(null); }} className="btn-secondary flex-1 text-sm py-2.5">
                Book Another
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Search
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Doctor Info */}
          <div className="lg:col-span-1">
            {doctor ? (
              <div className="glass-card p-6 sticky top-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 overflow-hidden shadow-lg border border-white/10">
                  {doctor.avatarUrl ? (
                    <img src={doctor.avatarUrl} alt={doctor.user.name} className="w-full h-full object-cover" />
                  ) : (
                    doctor.user.name.split(' ').pop()?.[0] ?? 'D'
                  )}
                </div>
                <h2 className="text-xl font-bold text-white text-center">{doctor.user.name}</h2>
                <p className="text-primary-400 text-center text-sm font-medium">{doctor.specialization}</p>
                {doctor.qualifications && (
                  <p className="text-xs text-slate-400 text-center mt-1 mb-4">{doctor.qualifications}</p>
                )}

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Star className="w-4 h-4 text-amber-400" />
                    {doctor.experienceYears} years experience
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    ₹{Number(doctor.consultationFee).toLocaleString()} consultation fee
                  </div>
                </div>

                {doctor.bio && (
                  <p className="text-xs text-slate-400 leading-relaxed">{doctor.bio}</p>
                )}
              </div>
            ) : (
              <div className="glass-card p-6 flex justify-center">
                <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
              </div>
            )}
          </div>

          {/* Slot Picker */}
          <div className="lg:col-span-2">
            {/* Date Navigation */}
            <div className="glass-card p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">Select Date</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedDate(d => addDays(d, -1))}
                    disabled={selectedDate <= new Date()}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium text-white min-w-[140px] text-center">
                    {dateLabel(selectedDate)}
                  </span>
                  <button
                    onClick={() => setSelectedDate(d => addDays(d, 1))}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Date scroll pills */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {Array.from({ length: 14 }).map((_, i) => {
                  const d = addDays(new Date(), i);
                  const isSelected = format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(d)}
                      className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs transition-all ${
                        isSelected
                          ? 'bg-primary-600 text-white'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="font-medium">{format(d, 'EEE')}</span>
                      <span className="font-bold text-sm">{format(d, 'd')}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slots Grid */}
            <div className="glass-card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">
                  Available Slots
                  {!loadingSlots && <span className="ml-2 text-sm text-slate-400">({availableSlots.length} open)</span>}
                </h3>
                <span className="text-xs text-slate-500">
                  {format(selectedDate, 'EEEE, MMM d, yyyy')}
                </span>
              </div>

              {loadingSlots ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No slots available on this day.</p>
                  <p className="text-xs text-slate-500 mt-1">Doctor may not work on this day or is on leave.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.startTime}
                      disabled={!slot.isAvailable}
                      onClick={() => setSelectedSlot(slot)}
                      className={`
                        py-2.5 px-2 rounded-xl text-sm font-medium transition-all
                        ${!slot.isAvailable
                          ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed line-through'
                          : selectedSlot?.startTime === slot.startTime
                          ? 'bg-primary-600 text-white border border-primary-400 scale-105'
                          : 'bg-white/5 text-slate-300 hover:bg-primary-500/20 hover:text-primary-300 hover:border-primary-500/40 border border-white/10'
                        }
                      `}
                    >
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notes & Confirm */}
            {selectedSlot && (
              <div className="glass-card p-6 animate-slide-up">
                <h3 className="font-semibold text-white mb-4">Confirm Booking</h3>

                <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 text-primary-300">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">{format(selectedDate, 'EEEE, MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-primary-300 mt-1">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">{selectedSlot.startTime} – {selectedSlot.endTime}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="input-label">Notes for doctor (optional)</label>
                  <textarea
                    className="input-field h-20 resize-none"
                    placeholder="Describe your symptoms or reason for visit..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    maxLength={1000}
                  />
                </div>

                <button onClick={handleBook} disabled={booking} className="btn-primary w-full">
                  {booking ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {booking ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
