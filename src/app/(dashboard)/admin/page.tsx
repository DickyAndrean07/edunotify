import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { Settings, Users, BookOpen, Calendar, ShieldCheck, Database } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN_SEKOLAH') {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      <DashboardHeader user={session} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-100">
            Dashboard Administrator Sekolah
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Kelola data master, tahun akademik, kalender sekolah, akun pengguna, dan pemantauan sistem.
          </p>
        </div>

        {/* Multitenant context badge */}
        <div className="mb-6 p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-xs text-neutral-400">School ID (Multitenancy):</div>
              <div className="font-mono text-xs text-neutral-200">{session.schoolId}</div>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Isolasi Aktif
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <Users className="w-6 h-6 text-blue-400 mb-3" />
            <div className="text-sm font-semibold text-neutral-200">Data Master</div>
            <p className="text-xs text-neutral-400 mt-1">
              Siswa, Guru, Kelas, dan Rombongan Belajar
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <Calendar className="w-6 h-6 text-purple-400 mb-3" />
            <div className="text-sm font-semibold text-neutral-200">Kalender Akademik</div>
            <p className="text-xs text-neutral-400 mt-1">
              Hari Belajar Aktif, Libur, dan Kegiatan Khusus
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <BookOpen className="w-6 h-6 text-emerald-400 mb-3" />
            <div className="text-sm font-semibold text-neutral-200">Jadwal Pelajaran</div>
            <p className="text-xs text-neutral-400 mt-1">
              Pemetaan Kelas, Hari, Jam, dan Guru Pengampu
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <ShieldCheck className="w-6 h-6 text-amber-400 mb-3" />
            <div className="text-sm font-semibold text-neutral-200">Audit & Log</div>
            <p className="text-xs text-neutral-400 mt-1">
              Riwayat Koreksi Presensi & Aktivitas Pengguna
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
