import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { UserCheck, MessageSquare, AlertTriangle, FileEdit } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomeroomDashboardPage() {
  const session = await getSession();
  if (
    !session ||
    (session.role !== 'WALI_KELAS' && session.role !== 'ADMIN_SEKOLAH')
  ) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      <DashboardHeader user={session} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-100">
            Dashboard Wali Kelas
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Monitoring presensi kelas binaan, intervensi Alpa via WhatsApp Click-to-Chat, dan Early Warning System.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <UserCheck className="w-6 h-6 text-emerald-400 mb-3" />
            <div className="text-sm font-semibold text-neutral-200">
              Monitoring Kehadiran
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Rekap real-time status Hadir, Sakit, Izin, Alpa
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <MessageSquare className="w-6 h-6 text-green-400 mb-3" />
            <div className="text-sm font-semibold text-neutral-200">
              WhatsApp Click-to-Chat
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Tindak lanjut instan orang tua siswa Alpa tanpa API berbayar
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <AlertTriangle className="w-6 h-6 text-amber-400 mb-3" />
            <div className="text-sm font-semibold text-neutral-200">
              Early Warning System
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Deteksi alpa beruntun & pola absensi kronis
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <FileEdit className="w-6 h-6 text-blue-400 mb-3" />
            <div className="text-sm font-semibold text-neutral-200">
              Koreksi Presensi
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Koreksi status kehadiran berjenjang dengan alasan wajib
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
