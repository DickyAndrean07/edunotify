import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { AdminNav } from '@/components/master-data/AdminNav';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN_SEKOLAH') {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[#F3F7FE] dark:bg-[#071325] text-[#172944] dark:text-[#EAF5FF] flex flex-col transition-colors duration-200">
      <DashboardHeader user={session} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdminNav />
        {children}
      </main>
    </div>
  );
}
