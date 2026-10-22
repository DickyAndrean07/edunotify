import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import {
  getClasses,
  getTeachers,
  getAcademicYears,
} from '@/services/masterDataService';
import { ClassManager } from '@/components/master-data/ClassManager';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}

export default async function AdminClassesPage(props: PageProps) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN_SEKOLAH') {
    redirect('/login');
  }

  const searchParams = await props.searchParams;
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const search = searchParams.search || '';

  const [classesData, teachersData, academicYears] = await Promise.all([
    getClasses(session.schoolId, { search, page, limit: 10 }),
    getTeachers(session.schoolId, { limit: 100 }),
    getAcademicYears(session.schoolId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-100">
          Manajemen Kelas & Rombongan Belajar
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Daftar kelas, pemetaan tingkat kelas, tahun akademik aktif, dan penugasan Wali Kelas resmi.
        </p>
      </div>

      <ClassManager
        initialData={classesData}
        teachers={teachersData.teachers.map((t) => ({
          id: t.id,
          name: t.name,
          role: t.role,
        }))}
        academicYears={academicYears.map((ay) => ({
          id: ay.id,
          name: ay.name,
          semester: ay.semester,
          isActive: ay.isActive,
        }))}
        searchQuery={search}
      />
    </div>
  );
}
