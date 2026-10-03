'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  User,
  Camera,
  Upload,
  Trash2,
  Stethoscope,
  Briefcase,
  DollarSign,
  GraduationCap,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  Clock,
  Save,
  Loader2,
  Eye,
  ShieldCheck,
  Star,
} from 'lucide-react';

const COMMON_SPECIALIZATIONS = [
  'Cardiology',
  'Orthopedics',
  'Dermatology',
  'Neurology',
  'Pediatrics',
  'General Practice',
  'Ophthalmology',
  'Dental Surgery',
  'Gynecology',
  'Psychiatry',
  'ENT',
  'Gastroenterology',
];

export default function DoctorProfilePage() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctorId, setDoctorId] = useState<string>('');

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [experienceYears, setExperienceYears] = useState<number>(0);
  const [consultationFee, setConsultationFee] = useState<number>(0);
  const [bio, setBio] = useState('');
  const [isApprovalRequired, setIsApprovalRequired] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Quick URL input toggle
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/doctors/me');
        const doc = data.data;
        setDoctorId(doc.id);
        setName(doc.user?.name || '');
        setEmail(doc.user?.email || '');
        setPhone(doc.user?.phone || '');
        setSpecialization(doc.specialization || '');
        setQualifications(doc.qualifications || '');
        setExperienceYears(doc.experienceYears || 0);
        setConsultationFee(doc.consultationFee || 0);
        setBio(doc.bio || '');
        setIsApprovalRequired(Boolean(doc.isApprovalRequired));
        setAvatarUrl(doc.avatarUrl || null);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to load doctor profile');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorProfile();
  }, []);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WebP)');
      return;
    }

    // Limit to 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatarUrl(base64);
      toast.success('Image selected! Click "Save Changes" to apply.');
    };
    reader.readAsDataURL(file);
  };

  const handleSetUrl = () => {
    if (!customUrl.trim()) return;
    setAvatarUrl(customUrl.trim());
    setCustomUrl('');
    setShowUrlInput(false);
    toast.success('Profile picture updated from URL! Click "Save Changes" to apply.');
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success('Profile picture removed. Click "Save Changes" to apply.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Doctor name is required');
      return;
    }
    if (!specialization.trim()) {
      toast.error('Specialization is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim() || null,
        specialization: specialization.trim(),
        qualifications: qualifications.trim() || null,
        experienceYears: Number(experienceYears),
        consultationFee: Number(consultationFee),
        bio: bio.trim() || null,
        isApprovalRequired,
        avatarUrl: avatarUrl || null,
      };

      const targetId = doctorId || user?.doctorId;
      if (!targetId) {
        throw new Error('Doctor profile ID not found');
      }

      await api.put(`/doctors/${targetId}`, payload);

      // Update AuthContext so top bar and sidebar reflect changes instantly
      updateUser({
        name: name.trim(),
        phone: phone.trim() || undefined,
        avatarUrl: avatarUrl || null,
        qualifications: qualifications.trim() || null,
      });

      toast.success('Doctor profile updated successfully! 🎉');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="page-container flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-container max-w-6xl pb-16">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Stethoscope className="w-8 h-8 text-primary-400" />
              Doctor Profile & Details
            </h1>
            <p className="text-slate-400 mt-1">
              Manage your professional credentials, medical bio, and patient-facing profile picture.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary py-2.5 px-6 self-start sm:self-auto"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Changes
              </>
            )}
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Left Column: Form Details (2 cols) ────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture Card */}
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary-400" />
                  Doctor Profile Picture
                </h2>
                <p className="text-xs text-slate-400 mb-6">
                  This picture is visible to all patients when searching doctors, viewing doctor cards, and booking appointments.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Avatar preview */}
                  <div className="relative group">
                    <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary-500/20 to-violet-600/30 border-2 border-primary-500/40 flex items-center justify-center text-white font-bold text-3xl overflow-hidden shadow-xl shadow-primary-500/10">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={name || 'Doctor'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          <Stethoscope className="w-10 h-10 text-primary-300 mx-auto mb-1" />
                          <span className="text-xs font-normal text-slate-400">No Photo</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex flex-wrap gap-2.5">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleImageFileChange}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-secondary text-sm py-2 px-4 gap-2"
                      >
                        <Upload className="w-4 h-4 text-primary-400" /> Upload Photo
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className="btn-secondary text-sm py-2 px-4 gap-2"
                      >
                        Use Image URL
                      </button>

                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="btn-danger text-sm py-2 px-3 gap-1.5"
                        >
                          <Trash2 className="w-4 h-4" /> Remove
                        </button>
                      )}
                    </div>

                    {showUrlInput && (
                      <div className="flex gap-2 pt-2 animate-fade-in">
                        <input
                          type="url"
                          placeholder="https://example.com/photo.jpg"
                          value={customUrl}
                          onChange={(e) => setCustomUrl(e.target.value)}
                          className="input-field text-sm py-2 flex-1"
                        />
                        <button
                          type="button"
                          onClick={handleSetUrl}
                          className="btn-primary text-xs py-2 px-3"
                        >
                          Apply
                        </button>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-500">
                      Recommended: Square photo (JPG, PNG, WebP) under 2MB. Clear headshot with professional attire looks best.
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary-400" />
                  Personal Information
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Full Name *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Dr. Full Name"
                        required
                        className="input-field pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="input-label">Phone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91-9876543210"
                        className="input-field pl-10"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="input-label">Email Address (Account Login)</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="input-field pl-10 opacity-70 cursor-not-allowed bg-slate-900/60"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Account email is fixed for authentication security.
                    </p>
                  </div>
                </div>
              </div>

              {/* Professional Credentials */}
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary-400" />
                  Medical Credentials & Practice
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="input-label">Specialization *</label>
                    <input
                      type="text"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="e.g. Cardiology, Orthopedics"
                      required
                      className="input-field mb-2"
                    />

                    {/* Quick selection pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {COMMON_SPECIALIZATIONS.map((spec) => (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => setSpecialization(spec)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                            specialization === spec
                              ? 'bg-primary-600 border-primary-500 text-white'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {spec}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="input-label">Medical Qualifications & Degrees</label>
                    <div className="relative">
                      <GraduationCap className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={qualifications}
                        onChange={(e) => setQualifications(e.target.value)}
                        placeholder="e.g. MBBS, MD Cardiology, DM (AIIMS), FRCS"
                        className="input-field pl-10"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Years of Experience</label>
                      <div className="relative">
                        <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          min="0"
                          max="60"
                          value={experienceYears}
                          onChange={(e) => setExperienceYears(Math.max(0, parseInt(e.target.value) || 0))}
                          className="input-field pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="input-label">Consultation Fee (₹)</label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={consultationFee}
                          onChange={(e) => setConsultationFee(Math.max(0, parseInt(e.target.value) || 0))}
                          className="input-field pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="input-label">Professional Bio & About Me</label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                      <textarea
                        rows={4}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Share your medical background, treatment philosophies, clinical focus areas, and hospital affiliations..."
                        className="input-field pl-10 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Preferences */}
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary-400" />
                  Appointment Preferences
                </h2>
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <p className="font-medium text-white text-sm">
                      Require manual approval for booking requests
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      When enabled, new patient bookings will remain in &quot;PENDING&quot; status until you manually confirm or decline them from your schedule.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={isApprovalRequired}
                      onChange={(e) => setIsApprovalRequired(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary py-3 px-8 text-base shadow-lg shadow-primary-500/20"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Saving Profile...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ── Right Column: Live Patient Preview (1 col) ─────────────── */}
          <div className="space-y-6">
            <div className="sticky top-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary-400 uppercase tracking-wider mb-3">
                <Eye className="w-4 h-4" /> Live Patient Preview
              </div>

              {/* Card preview as patients see it */}
              <div className="glass-card p-6 border-primary-500/40 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 px-3 py-1 bg-primary-600/30 border-b border-l border-primary-500/30 rounded-bl-xl text-[10px] text-primary-300 font-semibold tracking-wide">
                  Patient View
                </div>

                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 overflow-hidden shadow-lg border border-white/10">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      name.split(' ').pop()?.[0] ?? 'D'
                    )}
                  </div>
                  <div className="min-w-0 pr-12">
                    <h3 className="font-semibold text-white truncate text-base">
                      {name || 'Dr. Doctor Name'}
                    </h3>
                    <p className="text-sm text-primary-400 font-medium">
                      {specialization || 'Specialization'}
                    </p>
                    {qualifications && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {qualifications}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-slate-400 mb-4 pb-3 border-b border-white/10">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    {experienceYears}y exp
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    ₹{Number(consultationFee).toLocaleString()} fee
                  </span>
                </div>

                {/* Bio preview */}
                <p className="text-xs text-slate-400 line-clamp-3 mb-5 leading-relaxed">
                  {bio || 'Your medical bio will be displayed here for patients to read before booking.'}
                </p>

                {/* Simulated booking button */}
                <div className="btn-primary w-full text-sm py-2.5 text-center cursor-default pointer-events-none opacity-90">
                  Book Appointment
                </div>
              </div>

              {/* Info note */}
              <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 space-y-1.5">
                <p className="font-medium text-slate-300">💡 Profile Visibility Tips:</p>
                <p>• High-resolution headshots increase patient booking trust by over 40%.</p>
                <p>• Adding degrees (e.g. MD, DM, FRCS) builds immediate clinical credibility.</p>
                <p>• Changes made here update immediately across search results and booking pages.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
