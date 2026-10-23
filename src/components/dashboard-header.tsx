'use client';

import React from 'react';
import { logoutAction } from '@/app/(auth)/login/actions';
import { ROLE_LABELS } from '@/lib/auth/rbac';
import { UserRole } from '@/db/schema';
import { LogOut, Shield, Bell } from 'lucide-react';
import { BrandLogo } from './brand-logo';
import { ThemeToggle } from './theme-toggle';

interface Props {
  user: {
    name: string;
    email: string;
    role: UserRole;
    schoolId: string;
  };
}

export function DashboardHeader({ user }: Props) {
  const roleStyles: Record<UserRole, string> = {
    ADMIN_SEKOLAH:
      'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 dark:border-rose-500/30',
    GURU_MAPEL:
      'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/30',
    WALI_KELAS:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30',
    KEPALA_SEKOLAH:
      'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/30',
  };

  // Extract initials (up to 2 chars)
  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 dark:bg-[#071321e8] border-b border-[#E4EBF6] dark:border-[#203249] transition-colors duration-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <BrandLogo
            size="md"
            subtitle="Portal Kehadiran Siswa"
            idPrefix="header-brand"
          />
        </div>

        {/* Right Actions: Theme Toggle, Notifications, User Badge, Logout */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Theme Switcher Toggle */}
          <ThemeToggle />

          {/* Notification Bell with indicator */}
          <button
            type="button"
            title="Notifikasi"
            aria-label="Lihat notifikasi"
            className="relative p-2 rounded-xl border border-[#E4EBF6] dark:border-[#1D3756] bg-white dark:bg-[#0D2037] text-[#72849D] dark:text-[#91A9C6] hover:text-[#172944] dark:hover:text-[#EAF5FF] transition-colors shadow-sm"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF7087] ring-2 ring-white dark:ring-[#0D2037]" />
          </button>

          {/* User Info (Desktop) */}
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-[#172944] dark:text-[#EAF5FF] leading-tight">
              {user.name}
            </div>
            <div className="text-[11px] text-[#72849D] dark:text-[#91A9C6] leading-tight mt-0.5">
              {user.email}
            </div>
          </div>

          {/* Role Badge */}
          <span
            className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold flex items-center gap-1.5 ${
              roleStyles[user.role]
            }`}
          >
            <Shield className="w-3 h-3" />
            <span className="hidden xs:inline">{ROLE_LABELS[user.role]}</span>
          </span>

          {/* User Avatar Initials */}
          <div className="w-8 h-8 rounded-full bg-[#1351C6]/15 dark:bg-[#112E58] border border-[#1351C6]/30 dark:border-[#1684FF]/40 text-[#1351C6] dark:text-[#04B9E8] font-bold text-xs flex items-center justify-center select-none shadow-sm">
            {initials}
          </div>

          {/* Logout Action */}
          <form action={logoutAction}>
            <button
              type="submit"
              title="Keluar dari sesi"
              aria-label="Keluar"
              className="p-2 rounded-xl text-[#72849D] dark:text-[#91A9C6] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
