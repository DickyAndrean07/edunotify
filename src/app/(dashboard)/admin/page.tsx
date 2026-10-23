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
  FileSpreadsheet,
} from 'lucide-react';
import Link from 'next/link';
import {
  getStudents,
  getTeachers,
  getClasses,
  getTeachingSchedules,
  getActiveAcademicYear,
} from '@/services/masterDataService';
import { getDailyAttendanceCompleteness } from '@/services/reportService';
import { DailyCompletionSection } from '@/components/reports';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN_SEKOLAH') {
    redirect('/login');
  }

  // Fetch quick metrics and daily completeness for admin overview
  const [
    studentsData,
    teachersData,
    classesData,
    schedulesData,
    activeAy,
    dailyCompleteness,
  ] = await Promise.all([
    getStudents(session.schoolId, { limit: 1 }),
    getTeachers(session.schoolId, { limit: 1 }),
    getClasses(session.schoolId, { limit: 1 }),
    getTeachingSchedules(session.schoolId),
    getActiveAcademicYear(session.schoolId),
    getDailyAttendanceCompleteness(session.schoolId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#172944] dark:text-[#EAF5FF] tracking-tight">
            Ringkasan Administrator Sekolah
          </h1>
          <p className="text-xs text-[#72849D] dark:text-[#91A9C6] mt-1">
            Tahun Ajaran Aktif:{' '}
            <span className="text-emerald-600 dark:text-[#35E6BD] font-bold">
              {activeAy ? `${activeAy.name} (${activeAy.semester})` : 'Belum ditentukan'}
            </span>
          </p>
        </div>

        {/* Multitenant context badge */}
        <div className="p-3 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] flex items-center gap-3 shadow-sm">
          <Database className="w-4 h-4 text-[#1351C6] dark:text-[#04B9E8] shrink-0" />
          <div>
            <div className="text-[10px] text-[#72849D] dark:text-[#91A9C6] uppercase tracking-wider font-bold">
              School ID
            </div>
            <div className="font-mono text-xs text-[#172944] dark:text-[#EAF5FF] font-semibold">
              {session.schoolId}
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-[#35E6BD] border border-emerald-200 dark:border-emerald-800 font-bold">
            Terisolasi
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/students"
          className="p-5 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] hover:border-[#1351C6] dark:hover:border-[#04B9E8] transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#72849D] dark:text-[#91A9C6]">
              Total Siswa
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-[#04B9E8] border border-blue-200 dark:border-blue-800">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-[#172944] dark:text-[#EAF5FF] tracking-tight">
            {studentsData.total}
          </div>
          <div className="text-[11px] text-[#72849D] dark:text-[#91A9C6] mt-1 group-hover:text-[#1351C6] dark:group-hover:text-[#04B9E8] flex items-center gap-1 transition-colors font-medium">
            <span>Kelola data siswa</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        <Link
          href="/admin/teachers"
          className="p-5 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] hover:border-[#1351C6] dark:hover:border-[#04B9E8] transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#72849D] dark:text-[#91A9C6]">
              Guru & Staf
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-[#35E6BD] border border-emerald-200 dark:border-emerald-800">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-[#172944] dark:text-[#EAF5FF] tracking-tight">
            {teachersData.total}
          </div>
          <div className="text-[11px] text-[#72849D] dark:text-[#91A9C6] mt-1 group-hover:text-emerald-600 dark:group-hover:text-[#35E6BD] flex items-center gap-1 transition-colors font-medium">
            <span>Kelola guru & staf</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        <Link
          href="/admin/classes"
          className="p-5 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] hover:border-[#1351C6] dark:hover:border-[#04B9E8] transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#72849D] dark:text-[#91A9C6]">
              Kelas / Rombel
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
              <DoorOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-[#172944] dark:text-[#EAF5FF] tracking-tight">
            {classesData.total}
          </div>
          <div className="text-[11px] text-[#72849D] dark:text-[#91A9C6] mt-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 flex items-center gap-1 transition-colors font-medium">
            <span>Kelola rombel</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        <Link
          href="/admin/schedules"
          className="p-5 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] hover:border-[#1351C6] dark:hover:border-[#04B9E8] transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#72849D] dark:text-[#91A9C6]">
              Jadwal Pelajaran
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-[#FFAA00] border border-amber-200 dark:border-amber-800">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-[#172944] dark:text-[#EAF5FF] tracking-tight">
            {schedulesData.length}
          </div>
          <div className="text-[11px] text-[#72849D] dark:text-[#91A9C6] mt-1 group-hover:text-amber-600 dark:group-hover:text-[#FFAA00] flex items-center gap-1 transition-colors font-medium">
            <span>Kelola jadwal mingguan</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>
      </div>

      {/* Indikator Kelengkapan Presensi Harian Seluruh Kelas (DoD 2) */}
      <DailyCompletionSection overview={dailyCompleteness} />

      {/* Feature Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/admin/reports"
          className="p-5 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] hover:border-[#1351C6] dark:hover:border-[#04B9E8] transition-all flex items-start gap-4 shadow-sm"
        >
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-[#35E6BD] border border-emerald-200 dark:border-emerald-800 shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#172944] dark:text-[#EAF5FF]">
              Pelaporan & Ekspor (.xlsx / .pdf)
            </h3>
            <p className="text-xs text-[#72849D] dark:text-[#91A9C6] mt-1 leading-relaxed">
              Tabel rekapitulasi presensi multi-dimensi (tanggal, kelas, siswa, status) dan unduh dokumen formal Excel dan PDF siap cetak.
            </p>
          </div>
        </Link>

        <Link
          href="/admin/students"
          className="p-5 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] hover:border-[#1351C6] dark:hover:border-[#04B9E8] transition-all flex items-start gap-4 shadow-sm"
        >
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-[#04B9E8] border border-blue-200 dark:border-blue-800 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#172944] dark:text-[#EAF5FF]">
              Modul Siswa & Impor Massal
            </h3>
            <p className="text-xs text-[#72849D] dark:text-[#91A9C6] mt-1 leading-relaxed">
              Manajemen biodata siswa, NIS, NISN, kontak wali murid untuk WhatsApp, dan impor massal dari template Excel dengan proteksi duplikasi NIS.
            </p>
          </div>
        </Link>

        <Link
          href="/admin/teachers"
          className="p-5 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] hover:border-[#1351C6] dark:hover:border-[#04B9E8] transition-all flex items-start gap-4 shadow-sm"
        >
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-[#35E6BD] border border-emerald-200 dark:border-emerald-800 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#172944] dark:text-[#EAF5FF]">
              Guru, Wali Kelas & Kepsek
            </h3>
            <p className="text-xs text-[#72849D] dark:text-[#91A9C6] mt-1 leading-relaxed">
              Manajemen akun pengguna sekolah, penetapan peran (Guru Mapel, Wali Kelas, Kepala Sekolah), dan impor massal data staf pendidik.
            </p>
          </div>
        </Link>

        <Link
          href="/admin/schedules"
          className="p-5 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] hover:border-[#1351C6] dark:hover:border-[#04B9E8] transition-all flex items-start gap-4 shadow-sm"
        >
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-[#FFAA00] border border-amber-200 dark:border-amber-800 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#172944] dark:text-[#EAF5FF]">
              Jadwal Mengajar Mingguan
            </h3>
            <p className="text-xs text-[#72849D] dark:text-[#91A9C6] mt-1 leading-relaxed">
              Pemetaan jam pelajaran, kelas, hari, mata pelajaran, dan guru pengampu sebagai dasar otomasi mesin presensi estafet.
            </p>
          </div>
        </Link>

        <Link
          href="/admin/calendar"
          className="p-5 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] hover:border-[#1351C6] dark:hover:border-[#04B9E8] transition-all flex items-start gap-4 shadow-sm"
        >
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-[#FF7087] border border-rose-200 dark:border-rose-800 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#172944] dark:text-[#EAF5FF]">
              Kalender Akademik Sekolah
            </h3>
            <p className="text-xs text-[#72849D] dark:text-[#91A9C6] mt-1 leading-relaxed">
              Penetapan status hari belajar aktif (ACTIVE_KBM), hari libur nasional/sekolah (HOLIDAY), dan agenda kegiatan khusus (SPECIAL_EVENT).
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
