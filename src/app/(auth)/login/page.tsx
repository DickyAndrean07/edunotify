'use client';

import { useActionState, useState } from 'react';
import { loginAction } from './actions';
import {
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
  School,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const quickLogins = [
    {
      role: 'Admin Sekolah',
      email: 'admin@smanusantara1.sch.id',
      badge: 'bg-red-500/10 text-red-400 border-red-500/20',
    },
    {
      role: 'Guru Mapel',
      email: 'guru@smanusantara1.sch.id',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    {
      role: 'Wali Kelas',
      email: 'walikelas@smanusantara1.sch.id',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      role: 'Kepala Sekolah',
      email: 'kepsek@smanusantara1.sch.id',
      badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
  ];

  const handleQuickFill = (email: string) => {
    setEmailInput(email);
    setPasswordInput('EduNotify2026!Secure');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center items-center px-4 py-4 sm:py-6">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 mb-2 shadow-lg shadow-emerald-500/10">
            <School className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
            EduNotify
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Presensi Estafet & Sistem Peringatan Dini Kehadiran Siswa
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-neutral-100">
              Masuk ke Portal
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Gunakan email institusi terdaftar Anda untuk melanjutkan.
            </p>
          </div>

          {state?.error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="space-y-3.5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-neutral-300 mb-1"
              >
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="nama@sekolah.sch.id"
                  className="w-full pl-9 pr-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-neutral-300 mb-1"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-1.5 py-2.5 px-4 rounded-xl font-medium text-xs text-neutral-950 bg-emerald-400 hover:bg-emerald-300 active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Masuk</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-5 pt-4 border-t border-neutral-800/80">
            <p className="text-[11px] font-medium text-neutral-400 mb-2.5 text-center">
              Pintasan Uji Coba Cepat (4 Peran RBAC)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickLogins.map((item) => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleQuickFill(item.email)}
                  className={`text-[11px] px-2.5 py-1.5 rounded-lg border text-left transition-colors hover:brightness-125 ${item.badge}`}
                >
                  <span className="font-semibold block">{item.role}</span>
                  <span className="text-[10px] text-neutral-400 truncate block">
                    {item.email.split('@')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security Footer Notice */}
        <div className="mt-4 text-center text-[11px] text-neutral-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70" />
          <span>Sistem terisolasi per sekolah & sesi terenkripsi</span>
        </div>
      </div>
    </div>
  );
}
