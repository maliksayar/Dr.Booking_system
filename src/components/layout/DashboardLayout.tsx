'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Heart, LayoutDashboard, Calendar, Search, User, 
  Bell, LogOut, Settings, ChevronRight, Stethoscope,
  Users, BarChart3, ClipboardList, Menu, X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const patientNav: NavItem[] = [
  { href: '/patient/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: '/patient/search', label: 'Find Doctors', icon: <Search className="w-5 h-5" /> },
  { href: '/patient/appointments', label: 'My Appointments', icon: <Calendar className="w-5 h-5" /> },
];

const doctorNav: NavItem[] = [
  { href: '/doctor/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: '/doctor/appointments', label: 'Schedule', icon: <ClipboardList className="w-5 h-5" /> },
  { href: '/doctor/availability', label: 'Availability', icon: <Calendar className="w-5 h-5" /> },
  { href: '/doctor/profile', label: 'My Profile', icon: <User className="w-5 h-5" /> },
];

const adminNav: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: '/admin/doctors', label: 'Doctors', icon: <Stethoscope className="w-5 h-5" /> },
  { href: '/admin/users', label: 'Users', icon: <Users className="w-5 h-5" /> },
  { href: '/admin/analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = user?.role === 'ADMIN' ? adminNav : user?.role === 'DOCTOR' ? doctorNav : patientNav;

  useEffect(() => {
    api.get('/notifications?limit=1').then(r => setUnreadCount(r.data.unreadCount)).catch(() => {});
  }, []);

  const RoleIcon = () => {
    if (user?.role === 'ADMIN') return <Settings className="w-4 h-4" />;
    if (user?.role === 'DOCTOR') return <Stethoscope className="w-4 h-4" />;
    return <User className="w-4 h-4" />;
  };

  const roleBadgeColor = user?.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' 
    : user?.role === 'DOCTOR' ? 'bg-blue-500/20 text-blue-400'
    : 'bg-emerald-500/20 text-emerald-400';

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className={`
        fixed top-0 left-0 h-full z-40 w-64 
        bg-slate-900/90 backdrop-blur-xl border-r border-white/10
        flex flex-col transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">HealthCart</span>
          </Link>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase() ?? '?'
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${roleBadgeColor}`}>
                <RoleIcon />
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 group
                  ${active
                    ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <span className={active ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-300'}>
                  {item.icon}
                </span>
                {item.label}
                {active && <ChevronRight className="w-4 h-4 ml-auto text-primary-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-4 border-t border-white/10 space-y-1">
          <Link
            href="/notifications"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Bell className="w-5 h-5" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-auto flex items-center justify-center w-5 h-5 text-xs font-bold bg-primary-600 text-white rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden sticky top-0 z-20 bg-slate-900/90 backdrop-blur-xl border-b border-white/10 px-4 h-14 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-lg font-bold gradient-text">HealthCart</span>
          <Link href="/notifications" className="text-slate-400 relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 text-xs bg-primary-600 rounded-full flex items-center justify-center text-white">{unreadCount}</span>}
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
