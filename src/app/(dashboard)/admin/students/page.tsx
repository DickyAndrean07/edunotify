import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getStudents, getClasses } from '@/services/masterDataService';
import { StudentManager } from '@/components/master-data/StudentManager';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    search?: string;
    classId?: string;
    page?: string;
  }>;
}

export default async function AdminStudentsPage(props: PageProps) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN_SEKOLAH') {
    redirect('/login');
  }

  const searchParams = await props.searchParams;
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const search = searchParams.search || '';
  const classId = searchParams.classId || '';

  const [studentsData, classesData] = await Promise.all([
    getStudents(session.schoolId, {
      search,
      classId,
      page,
      limit: 10,
    }),
    getClasses(session.schoolId, { limit: 100 }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-100">
          Manajemen Data Siswa
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Kelola data induk siswa, penempatan rombongan belajar, kontak orang tua/wali, serta impor berkas CSV/Excel.
        </p>
      </div>

      <StudentManager
        initialData={studentsData}
        classes={classesData.classes.map((c) => ({ id: c.id, name: c.name }))}
        searchQuery={search}
        currentClassId={classId}
      />
    </div>
  );
}
