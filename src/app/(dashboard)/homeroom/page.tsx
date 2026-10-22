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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      <DashboardHeader user={session} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-100">
            Dashboard Wali Kelas
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Monitoring presensi kelas binaan, intervensi Alpa via WhatsApp Click-to-Chat, dan audit log koreksi.
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
