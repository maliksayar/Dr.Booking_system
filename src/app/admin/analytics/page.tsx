'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Loader2, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics').then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div></DashboardLayout>;

  const dailyMap = new Map<string, number>();
  (data?.dailyStats ?? []).forEach((s: any) => {
    dailyMap.set(s.date, (dailyMap.get(s.date) || 0) + Number(s.count));
  });
  const dailyData = Array.from(dailyMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date: date.slice(5), count }));

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 mt-1">System-wide metrics and trends</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary-400" />Daily Appointments</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Appointments" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4">Specialization Distribution</h3>
            <div className="space-y-3 mt-2">
              {(data?.specializationStats ?? []).map((s: any, i: number) => {
                const max = data.specializationStats[0]?.count ?? 1;
                const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
                return (
                  <div key={s.specialization} className="flex items-center gap-3">
                    <span className="text-sm text-slate-400 w-32 truncate">{s.specialization}</span>
                    <div className="flex-1 bg-white/5 rounded-full h-2.5">
                      <div className="h-2.5 rounded-full" style={{ width: `${(s.count / max) * 100}%`, background: colors[i % colors.length] }} />
                    </div>
                    <span className="text-sm font-medium text-white w-6 text-right">{s.count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card p-6 lg:col-span-2">
            <h3 className="font-semibold text-white mb-4">Appointment Trend (Line)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }} />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} name="Appointments" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
