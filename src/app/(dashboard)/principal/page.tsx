import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { getSchoolAttendanceSummary } from '@/services/reportService';
import {
  SchoolAttendanceTrendChart,
  ClassComparisonBarChart,
} from '@/components/charts';
import {
  ExecutiveAISummaryCard,
  ExportButtons,
} from '@/components/reports';
import {
  TrendingUp,
  Users,
  AlertOctagon,
  Trophy,
  Sparkles,
  BarChart3,
  FileSpreadsheet,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function getDefaultDates(): { today: string; thirtyDaysAgo: string } {
  const d = new Date();
  const today = d.toISOString().split('T')[0];
  const thirtyDaysBefore = new Date(d);
  thirtyDaysBefore.setDate(thirtyDaysBefore.getDate() - 30);
  return {
    today,
    thirtyDaysAgo: thirtyDaysBefore.toISOString().split('T')[0],
  };
}

interface PrincipalPageProps {
  searchParams?: Promise<{
    startDate?: string;
    endDate?: string;
    classId?: string;
  }>;
}

export default async function PrincipalDashboardPage({
  searchParams,
}: PrincipalPageProps) {
  const session = await getSession();
  if (
    !session ||
    (session.role !== 'KEPALA_SEKOLAH' && session.role !== 'ADMIN_SEKOLAH')
  ) {
    redirect('/login');
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const defaults = getDefaultDates();
  const startDate = resolvedSearchParams.startDate || defaults.thirtyDaysAgo;
  const endDate = resolvedSearchParams.endDate || defaults.today;

  // Fetch School Summary Data
  const summary = await getSchoolAttendanceSummary(session.schoolId, {
    startDate,
    endDate,
    classId: resolvedSearchParams.classId,
  });

  const bestClass =
    summary.classComparisons.length > 0
      ? summary.classComparisons[0]
      : null;

  return (
    <div className="min-h-screen bg-[#F3F7FE] dark:bg-[#071325] text-[#172944] dark:text-[#EAF5FF] flex flex-col transition-colors duration-200">
      <DashboardHeader user={session} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header & Range Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E4EBF6] dark:border-[#1D3756]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-2xl font-extrabold text-[#172944] dark:text-[#EAF5FF] tracking-tight">
                  Dashboard Eksekutif Kepala Sekolah
                </h1>
                <p className="text-xs text-[#72849D] dark:text-[#91A9C6] mt-0.5">
                  Pemantauan agregat kehadiran sekolah, perbandingan antarkelas, dan analisis naratif AI
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Export Buttons */}
            <ExportButtons
              startDate={startDate}
              endDate={endDate}
              classId={resolvedSearchParams.classId}
            />

            {/* Link to Detail Reports */}
            <Link
              href={`/admin/reports?startDate=${startDate}&endDate=${endDate}`}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0D2037] hover:bg-slate-50 dark:hover:bg-[#11233B] text-[#172944] dark:text-[#EAF5FF] border border-[#E4EBF6] dark:border-[#1D3756] text-xs font-bold transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-[#35E6BD]" />
              <span>Laporan Lengkap</span>
            </Link>
          </div>
        </div>

        {/* 1. KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tingkat Kehadiran Sekolah */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#72849D] dark:text-[#91A9C6]">
                Rata-rata Kehadiran
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-[#35E6BD] border border-emerald-200 dark:border-emerald-800">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-[#35E6BD] tracking-tight">
                {summary.overallStats.overallAttendanceRate.toFixed(1)}%
              </div>
              <div className="text-xs text-[#72849D] dark:text-[#91A9C6] mt-1 font-medium">
                Dari {summary.overallStats.totalRecords} total sesi presensi
              </div>
            </div>
          </div>

          {/* Total Siswa Aktif */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#72849D] dark:text-[#91A9C6]">
                Total Siswa Terdaftar
              </span>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-[#04B9E8] border border-blue-200 dark:border-blue-800">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold font-mono text-[#172944] dark:text-[#EAF5FF] tracking-tight">
                {summary.overallStats.totalEnrolledStudents}
              </div>
              <div className="text-xs text-[#72849D] dark:text-[#91A9C6] mt-1 font-medium">
                Dalam {summary.classComparisons.length} rombongan belajar
              </div>
            </div>
          </div>

          {/* Akumulasi Alpa */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#72849D] dark:text-[#91A9C6]">
                Ketidakhadiran (Alpa)
              </span>
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-[#FF7087] border border-rose-200 dark:border-rose-800">
                <AlertOctagon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div
                className={`text-3xl font-extrabold font-mono tracking-tight ${
                  summary.overallStats.totalAlpa > 0
                    ? 'text-rose-600 dark:text-[#FF7087]'
                    : 'text-[#172944] dark:text-[#EAF5FF]'
                }`}
              >
                {summary.overallStats.totalAlpa}
              </div>
              <div className="text-xs text-[#72849D] dark:text-[#91A9C6] mt-1 font-medium">
                Total kejadian alpa periode ini
              </div>
            </div>
          </div>

          {/* Kelas Terbaik */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#72849D] dark:text-[#91A9C6]">
                Performa Tertinggi
              </span>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-[#FFAA00] border border-amber-200 dark:border-amber-800">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl font-extrabold text-[#172944] dark:text-[#EAF5FF] tracking-tight">
                {bestClass ? `Kelas ${bestClass.className}` : '-'}
              </div>
              <div className="text-xs text-emerald-600 dark:text-[#35E6BD] font-mono mt-1 font-bold">
                {bestClass ? `${bestClass.attendanceRate.toFixed(1)}% Kehadiran` : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Kartu Ringkasan Eksekutif AI (DoD 1) */}
        <ExecutiveAISummaryCard
          attendanceRate={summary.overallStats.overallAttendanceRate}
          totalStudents={summary.overallStats.totalEnrolledStudents}
          totalAlpa={summary.overallStats.totalAlpa}
          startDate={startDate}
          endDate={endDate}
        />

        {/* 3. Grafik Tren Kehadiran Sekolah (DoD 1) */}
        <SchoolAttendanceTrendChart
          data={summary.dailyTrend}
          title={`Tren Persentase Kehadiran Harian Sekolah (${startDate} s/d ${endDate})`}
        />

        {/* 4. Grafik Komparasi Antarkelas (DoD 1) */}
        <ClassComparisonBarChart
          data={summary.classComparisons}
          title="Komparasi Persentase Kehadiran Antarkelas"
        />

        {/* 5. Tabel Detail Peringkat & Performa Rombel */}
        <div className="rounded-2xl border border-[#E4EBF6] dark:border-[#1D3756] bg-white dark:bg-[#0D2037] overflow-hidden shadow-sm transition-colors">
          <div className="p-4 border-b border-[#E4EBF6] dark:border-[#1D3756] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#1351C6] dark:text-[#04B9E8]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#172944] dark:text-[#EAF5FF]">
                Tabel Rincian Performa Kehadiran Seluruh Rombel
              </h3>
            </div>
            <span className="text-xs text-[#72849D] dark:text-[#91A9C6]">
              Periode: {startDate} s/d {endDate}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E4EBF6] dark:border-[#1D3756] bg-slate-50 dark:bg-[#071325]/80 text-[#72849D] dark:text-[#91A9C6] font-bold">
                  <th className="py-3 px-4 w-12 text-center">Rank</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Wali Kelas</th>
                  <th className="py-3 px-4 text-center">Siswa</th>
                  <th className="py-3 px-4 text-center">Hadir</th>
                  <th className="py-3 px-4 text-center">Sakit</th>
                  <th className="py-3 px-4 text-center">Izin</th>
                  <th className="py-3 px-4 text-center">Alpa</th>
                  <th className="py-3 px-4 text-center">Siswa EWS</th>
                  <th className="py-3 px-4 text-right">% Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4EBF6] dark:divide-[#1D3756]/60">
                {summary.classComparisons.map((cls) => {
                  const rate = cls.attendanceRate;
                  const isLow = rate < 80;
                  const isWarn = rate < 90 && rate >= 80;

                  return (
                    <tr
                      key={cls.classId}
                      className="hover:bg-slate-50 dark:hover:bg-[#11233B]/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-center font-mono font-bold text-[#72849D] dark:text-[#91A9C6]">
                        #{cls.rank}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#172944] dark:text-[#EAF5FF]">
                        Kelas {cls.className}
                      </td>
                      <td className="py-3 px-4 text-[#72849D] dark:text-[#91A9C6]">
                        {cls.homeroomTeacherName || '-'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[#172944] dark:text-[#EAF5FF]">
                        {cls.studentCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600 dark:text-[#35E6BD]">
                        {cls.hadirCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-blue-600 dark:text-[#04B9E8]">
                        {cls.sakitCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-amber-600 dark:text-[#FFAA00]">
                        {cls.izinCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-rose-600 dark:text-[#FF7087]">
                        {cls.alpaCount}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {cls.atRiskStudentsCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-[#FF7087] border border-rose-200 dark:border-rose-800 font-bold">
                            {cls.atRiskStudentsCount} Siswa
                          </span>
                        ) : (
                          <span className="text-[#94A3B8] text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            isLow
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-[#FF7087] border-rose-200 dark:border-rose-800'
                              : isWarn
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-[#FFAA00] border-amber-200 dark:border-amber-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-[#35E6BD] border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {rate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
