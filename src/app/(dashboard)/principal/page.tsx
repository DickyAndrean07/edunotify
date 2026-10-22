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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      <DashboardHeader user={session} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header & Range Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-neutral-100">
                  Dashboard Eksekutif Kepala Sekolah
                </h1>
                <p className="text-xs text-neutral-400 mt-0.5">
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
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xs font-semibold transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Laporan Lengkap</span>
            </Link>
          </div>
        </div>

        {/* 1. KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tingkat Kehadiran Sekolah */}
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-neutral-400">Rata-rata Kehadiran</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold font-mono text-emerald-400">
                {summary.overallStats.overallAttendanceRate.toFixed(1)}%
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                Dari {summary.overallStats.totalRecords} total sesi presensi
              </div>
            </div>
          </div>

          {/* Total Siswa Aktif */}
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-neutral-400">Total Siswa Terdaftar</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold font-mono text-neutral-100">
                {summary.overallStats.totalEnrolledStudents}
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                Dalam {summary.classComparisons.length} rombongan belajar
              </div>
            </div>
          </div>

          {/* Akumulasi Alpa */}
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-neutral-400">Ketidakhadiran (Alpa)</span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertOctagon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div
                className={`text-3xl font-bold font-mono ${
                  summary.overallStats.totalAlpa > 0
                    ? 'text-rose-400'
                    : 'text-neutral-100'
                }`}
              >
                {summary.overallStats.totalAlpa}
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                Total kejadian alpa periode ini
              </div>
            </div>
          </div>

          {/* Kelas Terbaik */}
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-neutral-400">Performa Tertinggi</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Trophy className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-xl font-bold text-neutral-100">
                {bestClass ? `Kelas ${bestClass.className}` : '-'}
              </div>
              <div className="text-xs text-emerald-400 font-mono mt-1 font-semibold">
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
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
                Tabel Rincian Performa Kehadiran Seluruh Rombel
              </h3>
            </div>
            <span className="text-xs text-neutral-400">
              Periode: {startDate} s/d {endDate}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 font-semibold">
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
              <tbody className="divide-y divide-neutral-800/60">
                {summary.classComparisons.map((cls) => {
                  const rate = cls.attendanceRate;
                  const isLow = rate < 80;
                  const isWarn = rate < 90 && rate >= 80;

                  return (
                    <tr
                      key={cls.classId}
                      className="hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-center font-mono font-bold text-neutral-400">
                        #{cls.rank}
                      </td>
                      <td className="py-3 px-4 font-semibold text-neutral-200">
                        Kelas {cls.className}
                      </td>
                      <td className="py-3 px-4 text-neutral-400">
                        {cls.homeroomTeacherName || '-'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-neutral-300">
                        {cls.studentCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-emerald-400">
                        {cls.hadirCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-blue-400">
                        {cls.sakitCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-amber-400">
                        {cls.izinCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-rose-400">
                        {cls.alpaCount}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {cls.atRiskStudentsCount > 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                            {cls.atRiskStudentsCount} Siswa
                          </span>
                        ) : (
                          <span className="text-neutral-500 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            isLow
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : isWarn
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
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
