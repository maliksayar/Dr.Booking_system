'use client';

import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Search, X, Loader2, Users, User, Stethoscope, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

const roleIcon = (role: string) => {
  if (role === 'ADMIN') return <ShieldCheck className="w-4 h-4 text-red-400" />;
  if (role === 'DOCTOR') return <Stethoscope className="w-4 h-4 text-blue-400" />;
  return <User className="w-4 h-4 text-emerald-400" />;
};

const roleColor = (role: string) => {
  if (role === 'ADMIN') return 'bg-red-500/20 text-red-400';
  if (role === 'DOCTOR') return 'bg-blue-500/20 text-blue-400';
  return 'bg-emerald-500/20 text-emerald-400';
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.data);
      setTotal(data.pagination.total);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    const t = setTimeout(load, 400);
    return () => clearTimeout(t);
  }, [load]);

  const toggleUser = async (id: string, name: string) => {
    setToggling(id);
    try {
      const { data } = await api.patch(`/admin/users/${id}/deactivate`);
      toast.success(data.message);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setToggling(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 mt-1">{total} total users</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              className="input-field pl-10 h-10"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {['', 'PATIENT', 'DOCTOR', 'ADMIN'].map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`text-xs px-3 py-2 rounded-lg border transition-all ${
                  roleFilter === r ? 'bg-primary-600 border-primary-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {r || 'All'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>
        ) : (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-slate-400 font-medium">User</th>
                  <th className="text-left p-4 text-slate-400 font-medium hidden sm:table-cell">Role</th>
                  <th className="text-left p-4 text-slate-400 font-medium hidden md:table-cell">Joined</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Status</th>
                  <th className="text-right p-4 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${i % 2 === 0 ? '' : 'bg-white/2'}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                          {u.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-white">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${roleColor(u.role)}`}>
                        {roleIcon(u.role)}
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 hidden md:table-cell text-slate-400">
                      {format(parseISO(u.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => toggleUser(u.id, u.name)}
                          disabled={toggling === u.id}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                            u.isActive
                              ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                        >
                          {toggling === u.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : null}
                          {u.isActive ? ' Deactivate' : ' Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="p-12 text-center text-slate-400">
                <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                No users found
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
