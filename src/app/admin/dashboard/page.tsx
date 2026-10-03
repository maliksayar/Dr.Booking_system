'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, Stethoscope, Calendar, TrendingUp, Loader2, Activity } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface Analytics {
  summary: {
    totalAppointments: number;
    todayAppointments: number;
    weekAppointments: number;
    monthAppointments: number;
    totalDoctors: number;
    totalPatients: number;
    cancellationRate: string;
  };
  statusBreakdown: Array<{ status: string; count: number }>;
  specializationStats: Array<{ specialization: string; count: number }>;
  dailyStats: Array<{ date: string; count: number; status: string }>;
}

export default function AdminDashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics')
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const summary = data?.summary;

  const stats = [
    { label: 'Total Appointments', value: summary?.totalAppointments ?? 0, icon: <Calendar className="w-5 h-5" />, color: 'text-primary-400', bg: 'bg-primary-500/10 border-primary-500/20' },
    { label: 'Today', value: summary?.todayAppointments ?? 0, icon: <Activity className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'This Week', value: summary?.weekAppointments ?? 0, icon: <TrendingUp className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'This Month', value: summary?.monthAppointments ?? 0, icon: <Calendar className="w-5 h-5" />, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
    { label: 'Total Doctors', value: summary?.totalDoctors ?? 0, icon: <Stethoscope className="w-5 h-5" />, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
    { label: 'Total Patients', value: summary?.totalPatients ?? 0, icon: <Users className="w-5 h-5" />, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
    { label: 'Cancellation Rate', value: summary?.cancellationRate ?? '0%', icon: <TrendingUp className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  ];

  // Aggregate daily stats for chart
  const dailyMap = new Map<string, number>();
  (data?.dailyStats ?? []).forEach((s: any) => {
    if (!['CANCELLED', 'NO_SHOW'].includes(s.status)) {
      dailyMap.set(s.date, (dailyMap.get(s.date) || 0) + Number(s.count));
    }
  });
  const dailyChartData = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, count]) => ({ date: date.slice(5), count }));

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 mt-1">System-wide analytics and management</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {stats.slice(0, 4).map((s) => (
            <div key={s.label} className={`glass-card p-5 border ${s.bg}`}>
              <div className={`mb-2 ${s.color}`}>{s.icon}</div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {stats.slice(4).map((s) => (
            <div key={s.label} className={`glass-card p-5 border ${s.bg}`}>
              <div className={`mb-2 ${s.color}`}>{s.icon}</div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Appointments Bar Chart */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-6">Daily Appointments (Last 14 days)</h3>
            {dailyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Appointments" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-slate-500 text-sm">No data yet</div>
            )}
          </div>

          {/* Status Breakdown Pie Chart */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-6">Appointment Status Breakdown</h3>
            {(data?.statusBreakdown ?? []).length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={data?.statusBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    nameKey="status"
                    label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data?.statusBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }}
                  />
                  <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-slate-500 text-sm">No data yet</div>
            )}
          </div>
        </div>

        {/* Specialization Stats */}
        {(data?.specializationStats ?? []).length > 0 && (
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-6">Doctors by Specialization</h3>
            <div className="space-y-3">
              {data?.specializationStats.map((s, i) => {
                const max = data.specializationStats[0]?.count ?? 1;
                return (
                  <div key={s.specialization} className="flex items-center gap-3">
                    <span className="text-sm text-slate-400 w-36 truncate">{s.specialization}</span>
                    <div className="flex-1 bg-white/5 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(s.count / max) * 100}%`, background: COLORS[i % COLORS.length] }}
                      />
                    </div>
                    <span className="text-sm font-medium text-white w-6 text-right">{s.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
