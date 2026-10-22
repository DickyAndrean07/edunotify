import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getAttendanceReportData } from '@/services/reportService';
import { getClasses, getStudents } from '@/services/masterDataService';
import {
  ReportFilterBar,
  ReportSummaryCards,
  ExportButtons,
  ReportTable,
} from '@/components/reports';
import { FileSpreadsheet } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ReportsPageProps {
  searchParams?: Promise<{
    startDate?: string;
    endDate?: string;
    classId?: string;
    studentId?: string;
    status?: string;
  }>;
}

export default async function AdminReportsPage({
  searchParams,
}: ReportsPageProps) {
  const session = await getSession();
  if (
    !session ||
    (session.role !== 'ADMIN_SEKOLAH' &&
      session.role !== 'KEPALA_SEKOLAH' &&
      session.role !== 'WALI_KELAS')
  ) {
    redirect('/login');
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  )
    .toISOString()
    .split('T')[0];

  const startDate = resolvedSearchParams.startDate || firstDayOfMonth;
  const endDate = resolvedSearchParams.endDate || today;
  const classId = resolvedSearchParams.classId || undefined;
  const studentId = resolvedSearchParams.studentId || undefined;
  const status = resolvedSearchParams.status || undefined;

  // Fetch classes and students for dropdown filter
  const [classesRes, studentsRes] = await Promise.all([
    getClasses(session.schoolId, { limit: 100 }),
    getStudents(session.schoolId, { limit: 500 }),
  ]);

  const availableClasses = classesRes.classes.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const availableStudents = studentsRes.students.map((s) => ({
    id: s.id,
    name: `${s.name} (${s.nis})`,
  }));

  // Fetch Report Data
  let reportData;
  let validationError: string | null = null;

  try {
    reportData = await getAttendanceReportData(session.schoolId, {
      startDate,
      endDate,
      classId,
      studentId,
      status,
    });
  } catch (err: unknown) {
    validationError =
      err instanceof Error ? err.message : 'Gagal memuat data laporan presensi.';
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Export Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-neutral-100">
                Pelaporan Agregat Presensi & Ekspor Dokumen
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                Filter multi-dimensi presensi siswa dan generator berkas formal Excel (.xlsx) dan PDF siap cetak
              </p>
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <ExportButtons
          startDate={startDate}
          endDate={endDate}
          classId={classId}
          studentId={studentId}
          status={status}
        />
      </div>

      {/* Filter Bar (DoD 3) */}
      <ReportFilterBar
        initialStartDate={startDate}
        initialEndDate={endDate}
        initialClassId={classId}
        initialStudentId={studentId}
        initialStatus={status}
        availableClasses={availableClasses}
        availableStudents={availableStudents}
      />

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          <strong>Perhatian:</strong> {validationError}
        </div>
      )}

      {/* Report Data Views */}
      {reportData && (
        <>
          {/* Summary KPI Cards */}
          <ReportSummaryCards summary={reportData.summary} />

          {/* Detailed Data Table */}
          <ReportTable
            students={reportData.students}
            logs={reportData.logs}
          />
        </>
      )}
    </div>
  );
}
