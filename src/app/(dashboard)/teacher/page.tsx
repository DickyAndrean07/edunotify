import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { TeacherAttendancePortal } from '@/components/attendance/TeacherAttendancePortal';

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
    <div className="min-h-screen bg-[#F3F7FE] dark:bg-[#071325] text-[#172944] dark:text-[#EAF5FF] flex flex-col transition-colors duration-200">
      <DashboardHeader user={session} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-[#172944] dark:text-[#EAF5FF] tracking-tight">
            Portal Guru Mata Pelajaran
          </h1>
          <p className="text-xs text-[#72849D] dark:text-[#91A9C6] mt-1">
            Jadwal mengajar aktif hari ini dan pengisian presensi estafet terproteksi.
          </p>
        </div>

        <TeacherAttendancePortal user={session} />
      </main>
    </div>
  );
}
