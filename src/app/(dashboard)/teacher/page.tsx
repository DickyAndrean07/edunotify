import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { BookOpen, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TeacherDashboardPage() {
  const session = await getSession();
  if (
    !session ||
    (session.role !== 'GURU_MAPEL' &&
      session.role !== 'WALI_KELAS' &&
      session.role !== 'ADMIN_SEKOLAH')
  ) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      <DashboardHeader user={session} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-100">
            Portal Guru Mata Pelajaran
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Jadwal mengajar aktif hari ini dan pengisian presensi estafet.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <Clock className="w-6 h-6 text-blue-400 mb-3" />
            <div className="text-sm font-semibold text-neutral-200">
              Jadwal Mengajar Hari Ini
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Daftar jam pelajaran sesuai kalender aktif
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-3" />
            <div className="text-sm font-semibold text-neutral-200">
              Input Presensi Estafet
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Pengisian presensi resmi jam ke-1 atau jam estafet berikutnya
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <AlertCircle className="w-6 h-6 text-amber-400 mb-3" />
            <div className="text-sm font-semibold text-neutral-200">
              Riwayat Pengisian
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Status sesi yang telah disubmit dan terkunci
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
