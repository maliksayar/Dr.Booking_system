'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import Link from 'next/link';
import { Search, Star, DollarSign, Filter, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Doctor {
  id: string;
  specialization: string;
  experienceYears: number;
  bio: string;
  consultationFee: string;
  avatarUrl?: string | null;
  qualifications?: string | null;
  user: { name: string; email: string; phone?: string };
  availability: Array<{ dayOfWeek: number; startTime: string; endTime: string }>;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function SearchContent() {
  const searchParams = useSearchParams();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSpec, setSelectedSpec] = useState(searchParams.get('specialization') || '');
  const [total, setTotal] = useState(0);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('name', search);
      if (selectedSpec) params.set('specialization', selectedSpec);
      const { data } = await api.get(`/doctors?${params}`);
      setDoctors(data.data);
      setTotal(data.pagination.total);
    } catch {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }, [search, selectedSpec]);

  useEffect(() => {
    api.get('/doctors/specializations').then(r => setSpecializations(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchDoctors, 400);
    return () => clearTimeout(timer);
  }, [fetchDoctors]);

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Find a Doctor</h1>
        <p className="text-slate-400 mt-1">{total} verified doctors available</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            className="input-field pl-10 h-11"
            placeholder="Search by doctor name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="relative sm:w-56">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select
            className="input-field pl-10 h-11 appearance-none cursor-pointer"
            value={selectedSpec}
            onChange={e => setSelectedSpec(e.target.value)}
          >
            <option value="">All Specializations</option>
            {specializations.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filter */}
      {selectedSpec && (
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-slate-400">Showing:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/20 border border-primary-500/30 text-primary-400 text-sm">
            {selectedSpec}
            <button onClick={() => setSelectedSpec('')} className="hover:text-white ml-1">
              <X className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      ) : doctors.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No doctors found. Try a different search.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {doctors.map((doc) => (
            <div key={doc.id} className="glass-card p-6 hover:bg-white/8 hover:border-primary-500/30 transition-all duration-300 group flex flex-col">
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden shadow-md">
                  {doc.avatarUrl ? (
                    <img src={doc.avatarUrl} alt={doc.user.name} className="w-full h-full object-cover" />
                  ) : (
                    doc.user.name.split(' ').pop()?.[0] ?? 'D'
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white group-hover:text-primary-300 transition-colors truncate">{doc.user.name}</h3>
                  <p className="text-sm text-primary-400 font-medium">{doc.specialization}</p>
                  {doc.qualifications && (
                    <p className="text-xs text-slate-400 truncate mt-0.5">{doc.qualifications}</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  {doc.experienceYears}y exp
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  ₹{Number(doc.consultationFee).toLocaleString()}
                </span>
              </div>

              {/* Bio */}
              {doc.bio && (
                <p className="text-xs text-slate-400 mb-4 line-clamp-2 flex-1">{doc.bio}</p>
              )}

              {/* Availability */}
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-2">Available on</p>
                <div className="flex gap-1 flex-wrap">
                  {Array.from(new Set((doc.availability || []).map(a => a.dayOfWeek))).sort((a, b) => a - b).map(d => (
                    <span key={d} className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {DAY_NAMES[d]}
                    </span>
                  ))}
                  {(!doc.availability || doc.availability.length === 0) && (
                    <span className="text-xs text-slate-500">Schedule not set</span>
                  )}
                </div>
              </div>

              <Link
                href={`/patient/book/${doc.id}`}
                className="btn-primary w-full text-sm py-2.5 mt-auto"
              >
                Book Appointment
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="page-container flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      }>
        <SearchContent />
      </Suspense>
    </DashboardLayout>
  );
}
