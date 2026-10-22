import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getTeachers } from '@/services/masterDataService';
import { TeacherManager } from '@/components/master-data/TeacherManager';
import { UserRole } from '@/db/schema';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    search?: string;
    role?: string;
    page?: string;
  }>;
}

export default async function AdminTeachersPage(props: PageProps) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN_SEKOLAH') {
    redirect('/login');
  }

  const searchParams = await props.searchParams;
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const search = searchParams.search || '';
  const role = (searchParams.role as UserRole) || undefined;

  const teachersData = await getTeachers(session.schoolId, {
    search,
    role,
    page,
    limit: 10,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-100">
          Manajemen Guru & Staf Pendidik
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Kelola data pendidik, penugasan peran (Guru Mapel, Wali Kelas, Kepala Sekolah), dan akun akses portal.
        </p>
      </div>

      <TeacherManager
        initialData={teachersData}
        searchQuery={search}
        currentRole={searchParams.role || ''}
      />
    </div>
  );
}
