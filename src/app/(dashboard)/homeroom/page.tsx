import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { HomeroomPortal } from '@/components/homeroom/HomeroomPortal';
import { getHomeroomClassesAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function HomeroomDashboardPage() {
  const session = await getSession();
  if (
    !session ||
    (session.role !== 'WALI_KELAS' && session.role !== 'ADMIN_SEKOLAH')
  ) {
    redirect('/login');
  }

  const classes = await getHomeroomClassesAction();

  return (
    <div className="min-h-screen bg-[#F3F7FE] dark:bg-[#071325] text-[#172944] dark:text-[#EAF5FF] flex flex-col transition-colors duration-200">
      <DashboardHeader user={session} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32 md:pb-8">
        <div className="mb-6 hidden md:block">
          <h1 className="text-2xl font-extrabold text-[#172944] dark:text-[#EAF5FF] tracking-tight">
            Dashboard Wali Kelas
          </h1>
          <p className="text-xs text-[#72849D] dark:text-[#91A9C6] mt-1">
            Monitoring presensi kelas binaan, intervensi Alpa via WhatsApp Click-to-Chat, dan audit log koreksi terproteksi.
          </p>
        </div>

        <HomeroomPortal
          initialClasses={classes}
          currentUserId={session.id}
          currentUserRole={session.role}
        />
      </main>
    </div>
  );
}
