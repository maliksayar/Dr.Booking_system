'use client';

import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Plus, Trash2, Loader2, Search, X, Stethoscope, Star, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

interface Doctor {
  id: string;
  specialization: string;
  experienceYears: number;
  consultationFee: string;
  bio?: string;
  user: { id: string; name: string; email: string; phone?: string; isActive: boolean };
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    specialization: '', experienceYears: '0',
    consultationFee: '0', bio: '',
  });

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/doctors?limit=100${search ? `&name=${search}` : ''}`);
      setDoctors(data.data);
    } catch {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 400);
    return () => clearTimeout(t);
  }, [load]);

  const createDoctor = async () => {
    setCreating(true);
    try {
      await api.post('/admin/doctors', {
        ...form,
        experienceYears: Number(form.experienceYears),
        consultationFee: Number(form.consultationFee),
      });
      toast.success('Doctor account created!');
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', phone: '', specialization: '', experienceYears: '0', consultationFee: '0', bio: '' });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (userId: string) => {
    try {
      const { data } = await api.patch(`/admin/users/${userId}/deactivate`);
      toast.success(data.message);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const deleteDoctor = async (id: string) => {
    if (!confirm('Permanently delete this doctor account?')) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/doctors/${id}`);
      toast.success('Doctor removed');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Doctor Management</h1>
            <p className="text-slate-400 mt-1">{doctors.length} doctors registered</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm py-2.5 px-5">
            <Plus className="w-4 h-4" /> Add Doctor
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            className="input-field pl-10"
            placeholder="Search doctors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {doctors.map((doc) => (
              <div key={doc.id} className="glass-card p-5 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-semibold">
                      {doc.user.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{doc.user.name}</p>
                      <p className="text-xs text-primary-400">{doc.specialization}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${doc.user.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {doc.user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" />{doc.experienceYears}y</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-emerald-400" />₹{Number(doc.consultationFee).toLocaleString()}</span>
                </div>

                <p className="text-xs text-slate-500 mb-4">{doc.user.email}</p>

                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => toggleActive(doc.user.id)}
                    className={`flex-1 text-xs py-1.5 px-3 rounded-lg border transition-all ${
                      doc.user.isActive
                        ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    }`}
                  >
                    {doc.user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => deleteDoctor(doc.id)}
                    disabled={deleting === doc.id}
                    className="btn-danger text-xs py-1.5 px-2"
                  >
                    {deleting === doc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Doctor Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="glass-card p-6 w-full max-w-md my-8 animate-slide-up">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-white">Create Doctor Account</h3>
                <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-slate-500 hover:text-white" /></button>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Dr. Jane Doe' },
                  { label: 'Email', key: 'email', type: 'email', placeholder: 'doctor@example.com' },
                  { label: 'Password', key: 'password', type: 'password', placeholder: 'Min 8 chars' },
                  { label: 'Phone', key: 'phone', type: 'tel', placeholder: '+91-9000000000' },
                  { label: 'Specialization', key: 'specialization', type: 'text', placeholder: 'Cardiology' },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label className="input-label">{label}</label>
                    <input
                      type={type}
                      className="input-field"
                      placeholder={placeholder}
                      value={(form as any)[key]}
                      onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">Experience (years)</label>
                    <input type="number" className="input-field" min="0" value={form.experienceYears} onChange={e => setForm(p => ({ ...p, experienceYears: e.target.value }))} />
                  </div>
                  <div>
                    <label className="input-label">Fee (₹)</label>
                    <input type="number" className="input-field" min="0" value={form.consultationFee} onChange={e => setForm(p => ({ ...p, consultationFee: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="input-label">Bio (optional)</label>
                  <textarea className="input-field h-16 resize-none" value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1 text-sm py-2.5">Cancel</button>
                <button onClick={createDoctor} disabled={creating} className="btn-primary flex-1 text-sm py-2.5">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
