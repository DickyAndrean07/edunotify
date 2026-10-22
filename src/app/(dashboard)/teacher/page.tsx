import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { TeacherAttendancePortal } from '@/components/attendance/TeacherAttendancePortal';
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
            Jadwal mengajar aktif hari ini dan pengisian presensi estafet terproteksi.
          </p>
        </div>

        <TeacherAttendancePortal user={session} />
      </main>
    </div>
  );
}
