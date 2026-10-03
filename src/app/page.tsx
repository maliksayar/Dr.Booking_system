'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  Heart, Search, Calendar, Shield, Clock, Star, 
  ArrowRight, CheckCircle, Users, Stethoscope
} from 'lucide-react';

const SPECIALIZATIONS = [
  { icon: '🫀', name: 'Cardiology' },
  { icon: '🦴', name: 'Orthopedics' },
  { icon: '🧠', name: 'Neurology' },
  { icon: '👁️', name: 'Ophthalmology' },
  { icon: '🦷', name: 'Dental' },
  { icon: '🩺', name: 'General Practice' },
  { icon: '👶', name: 'Pediatrics' },
  { icon: '🌿', name: 'Dermatology' },
];

const FEATURES = [
  {
    icon: <Search className="w-6 h-6" />,
    title: 'Smart Doctor Search',
    desc: 'Find specialists by name, specialization, or availability — instantly filtered.',
  },
  {
    icon: <Calendar className="w-6 h-6" />,
    title: 'Real-Time Slot Booking',
    desc: 'View live available slots and book instantly. No double-booking, ever.',
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: 'Flexible Rescheduling',
    desc: 'Reschedule or cancel anytime within policy — we send you reminders.',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Secure & Private',
    desc: 'JWT-secured sessions, encrypted data, HIPAA-aligned design.',
  },
];

const STATS = [
  { value: '500+', label: 'Verified Doctors' },
  { value: '50k+', label: 'Appointments Booked' },
  { value: '4.9★', label: 'Patient Rating' },
  { value: '24/7', label: 'Support Available' },
];

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-violet-600 rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">HealthCart</span>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link
                    href={user?.role === 'ADMIN' ? '/admin/dashboard' : user?.role === 'DOCTOR' ? '/doctor/dashboard' : '/patient/dashboard'}
                    className="btn-primary text-sm py-2 px-4"
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-secondary text-sm py-2 px-4">Sign In</Link>
                  <Link href="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse-slow" />
            India&apos;s trusted health appointment platform
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6">
            Your health,{' '}
            <span className="gradient-text">booked</span>
            {' '}in seconds
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 text-balance">
            Connect with verified specialist doctors, view real-time availability,
            and book conflict-free appointments — all without leaving your home.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href={isAuthenticated ? '/patient/search' : '/register'} className="btn-primary text-base py-3.5 px-8">
              Book an Appointment <ArrowRight className="w-5 h-5" />
            </Link>
            {!isAuthenticated && (
              <Link href="/login" className="btn-secondary text-base py-3.5 px-8">
                Sign in to your account
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold gradient-text">{s.value}</div>
                <div className="text-sm text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Specializations ────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-3">Find by Specialization</h2>
          <p className="text-slate-400 text-center mb-12">Browse top doctors across all major medical specialties</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SPECIALIZATIONS.map((spec) => (
              <Link
                key={spec.name}
                href={`/patient/search?specialization=${encodeURIComponent(spec.name)}`}
                className="glass-card p-6 text-center hover:bg-white/10 transition-all duration-300 group hover:scale-[1.02] hover:border-primary-500/30"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {spec.icon}
                </div>
                <div className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                  {spec.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-3">Why HealthCart?</h2>
          <p className="text-slate-400 text-center mb-16">Built for modern healthcare — fast, reliable, conflict-free</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass-card p-6 hover:bg-white/10 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 mb-4 group-hover:bg-primary-500/20 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/50 to-violet-900/50" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to book your appointment?</h2>
          <p className="text-slate-300 mb-8 text-lg">
            Join thousands of patients who trust HealthCart for their healthcare needs.
          </p>
          <Link href="/register" className="btn-primary text-base py-4 px-10">
            Create Free Account <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          © 2026 HealthCart. Built with ❤️ for better healthcare access.
        </div>
      </footer>
    </div>
  );
}
