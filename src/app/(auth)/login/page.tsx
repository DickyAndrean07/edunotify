'use client';

import { useActionState, useState } from 'react';
import { loginAction } from './actions';
import {
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const quickLogins = [
    {
      role: 'Admin Sekolah',
      email: 'admin@smanusantara1.sch.id',
      badge:
        'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 dark:border-rose-500/30 hover:border-rose-500/40',
    },
    {
      role: 'Guru Mapel',
      email: 'guru@smanusantara1.sch.id',
      badge:
        'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/30 hover:border-blue-500/40',
    },
    {
      role: 'Wali Kelas',
      email: 'walikelas@smanusantara1.sch.id',
      badge:
        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30 hover:border-emerald-500/40',
    },
    {
      role: 'Kepala Sekolah',
      email: 'kepsek@smanusantara1.sch.id',
      badge:
        'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/30 hover:border-purple-500/40',
    },
  ];

  const handleQuickFill = (email: string) => {
    setEmailInput(email);
    setPasswordInput('EduNotify2026!Secure');
  };

  return (
    <div className="min-h-screen bg-[#F3F7FE] dark:bg-[#071325] text-[#172944] dark:text-[#EAF5FF] flex flex-col justify-center items-center px-4 py-8 relative transition-colors duration-200">
      {/* Top right theme toggle */}
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <BrandLogo
            size="lg"
            subtitle="Presensi Estafet & Sistem Peringatan Dini Kehadiran Siswa"
            idPrefix="login-logo"
            className="flex-col items-center gap-3 text-center"
          />
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] rounded-2xl p-6 sm:p-7 shadow-xl dark:shadow-2xl transition-colors duration-200">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-[#172944] dark:text-[#EAF5FF]">
              Masuk ke Portal
            </h2>
            <p className="text-xs text-[#72849D] dark:text-[#91A9C6] mt-0.5">
              Gunakan email institusi terdaftar Anda untuk melanjutkan.
            </p>
          </div>

          {state?.error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-[#172944] dark:text-[#EAF5FF] mb-1.5"
              >
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#72849D] dark:text-[#91A9C6]">
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
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#F8FAFC] dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756] rounded-xl text-[#172944] dark:text-[#EAF5FF] placeholder-[#94A3B8] text-xs focus:outline-none focus:ring-2 focus:ring-[#1351C6]/40 dark:focus:ring-[#04B9E8]/40 focus:border-[#1351C6] dark:focus:border-[#04B9E8] transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-[#172944] dark:text-[#EAF5FF] mb-1.5"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#72849D] dark:text-[#91A9C6]">
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
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#F8FAFC] dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756] rounded-xl text-[#172944] dark:text-[#EAF5FF] placeholder-[#94A3B8] text-xs focus:outline-none focus:ring-2 focus:ring-[#1351C6]/40 dark:focus:ring-[#04B9E8]/40 focus:border-[#1351C6] dark:focus:border-[#04B9E8] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#1351C6] to-[#04B9E8] hover:opacity-95 active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#1351C6]/20"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Masuk ke Akun</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-5 pt-4 border-t border-[#E4EBF6] dark:border-[#1D3756]">
            <p className="text-[11px] font-semibold text-[#72849D] dark:text-[#91A9C6] mb-2.5 text-center">
              Pintasan Uji Coba Cepat (4 Peran RBAC)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickLogins.map((item) => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleQuickFill(item.email)}
                  className={`text-[11px] px-2.5 py-1.5 rounded-xl border text-left transition-all ${item.badge}`}
                >
                  <span className="font-bold block">{item.role}</span>
                  <span className="text-[10px] text-[#72849D] dark:text-[#91A9C6] truncate block">
                    {item.email.split('@')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security Footer Notice */}
        <div className="mt-5 text-center text-[11px] text-[#72849D] dark:text-[#91A9C6] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#35E6BD]" />
          <span>Sistem terisolasi per sekolah & sesi terenkripsi</span>
        </div>
      </div>
    </div>
  );
}
