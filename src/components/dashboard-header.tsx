'use client';

import { logoutAction } from '@/app/(auth)/login/actions';
import { ROLE_LABELS } from '@/lib/auth/rbac';
import { UserRole } from '@/db/schema';
import { School, LogOut, Shield } from 'lucide-react';

interface Props {
  user: {
    name: string;
    email: string;
    role: UserRole;
    schoolId: string;
  };
}

export function DashboardHeader({ user }: Props) {
  const roleColors: Record<UserRole, string> = {
    ADMIN_SEKOLAH: 'bg-red-500/10 text-red-400 border-red-500/30',
    GURU_MAPEL: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    WALI_KELAS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    KEPALA_SEKOLAH: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };

  return (
    <header className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <School className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base text-neutral-100 tracking-tight">
              EduNotify
            </span>
            <span className="text-xs text-neutral-400 block -mt-1">
              Portal Kehadiran Siswa
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-neutral-200">{user.name}</div>
            <div className="text-xs text-neutral-400">{user.email}</div>
          </div>

          <span
            className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1.5 ${
              roleColors[user.role]
            }`}
          >
            <Shield className="w-3 h-3" />
            {ROLE_LABELS[user.role]}
          </span>

          <form action={logoutAction}>
            <button
              type="submit"
              title="Keluar"
              className="p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800/80 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
