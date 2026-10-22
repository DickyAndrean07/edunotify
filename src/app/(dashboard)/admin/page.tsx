import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import {
  Users,
  GraduationCap,
  DoorOpen,
  Calendar,
  Clock,
  Database,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import {
  getStudents,
  getTeachers,
  getClasses,
  getTeachingSchedules,
  getActiveAcademicYear,
} from '@/services/masterDataService';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN_SEKOLAH') {
    redirect('/login');
  }

  // Fetch quick metrics for admin overview
  const [studentsData, teachersData, classesData, schedulesData, activeAy] =
    await Promise.all([
      getStudents(session.schoolId, { limit: 1 }),
      getTeachers(session.schoolId, { limit: 1 }),
      getClasses(session.schoolId, { limit: 1 }),
      getTeachingSchedules(session.schoolId),
      getActiveAcademicYear(session.schoolId),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">
            Ringkasan Administrator Sekolah
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Tahun Ajaran Aktif:{' '}
            <span className="text-emerald-400 font-semibold">
              {activeAy ? `${activeAy.name} (${activeAy.semester})` : 'Belum ditentukan'}
            </span>
          </p>
        </div>

        {/* Multitenant context badge */}
        <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center gap-3">
          <Database className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
              School ID
            </div>
            <div className="font-mono text-xs text-neutral-200">{session.schoolId}</div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            Terisolasi
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/students"
          className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-colors group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-neutral-400">Total Siswa</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-100">
            {studentsData.total}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 group-hover:text-blue-400 flex items-center gap-1 transition-colors">
            <span>Kelola data siswa</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        <Link
          href="/admin/teachers"
          className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-colors group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-neutral-400">Guru & Staf</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-100">
            {teachersData.total}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 group-hover:text-emerald-400 flex items-center gap-1 transition-colors">
            <span>Kelola guru & staf</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        <Link
          href="/admin/classes"
          className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-colors group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-neutral-400">Kelas / Rombel</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <DoorOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-100">
            {classesData.total}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 group-hover:text-purple-400 flex items-center gap-1 transition-colors">
            <span>Kelola rombel</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        <Link
          href="/admin/schedules"
          className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-colors group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-neutral-400">Jadwal Pelajaran</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-100">
            {schedulesData.length}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 group-hover:text-amber-400 flex items-center gap-1 transition-colors">
            <span>Kelola jadwal mingguan</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>
      </div>

      {/* Feature Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/students"
          className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all flex items-start gap-4"
        >
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-200">
              Modul Siswa & Impor CSV/Excel
            </h3>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              Manajemen biodata siswa, NIS, NISN, kontak wali murid untuk WhatsApp, dan impor massal dari template Excel dengan proteksi duplikasi NIS.
            </p>
          </div>
        </Link>

        <Link
          href="/admin/teachers"
          className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all flex items-start gap-4"
        >
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-200">
              Guru, Wali Kelas & Kepsek
            </h3>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              Manajemen akun pengguna sekolah, penetapan peran (Guru Mapel, Wali Kelas, Kepala Sekolah), dan impor massal data staf pendidik.
            </p>
          </div>
        </Link>

        <Link
          href="/admin/schedules"
          className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all flex items-start gap-4"
        >
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-200">
              Jadwal Mengajar Mingguan
            </h3>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              Pemetaan jam pelajaran, kelas, hari, mata pelajaran, dan guru pengampu sebagai dasar otomasi mesin presensi estafet.
            </p>
          </div>
        </Link>

        <Link
          href="/admin/calendar"
          className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all flex items-start gap-4"
        >
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-200">
              Kalender Akademik Sekolah
            </h3>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              Penetapan status hari belajar aktif (ACTIVE_KBM), hari libur nasional/sekolah (HOLIDAY), dan agenda kegiatan khusus (SPECIAL_EVENT).
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
