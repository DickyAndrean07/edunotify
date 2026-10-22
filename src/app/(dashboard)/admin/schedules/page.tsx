import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import {
  getTeachingSchedules,
  getClasses,
  getTeachers,
} from '@/services/masterDataService';
import { ScheduleManager } from '@/components/master-data/ScheduleManager';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    classId?: string;
    day?: string;
  }>;
}

export default async function AdminSchedulesPage(props: PageProps) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN_SEKOLAH') {
    redirect('/login');
  }

  const searchParams = await props.searchParams;
  const classId = searchParams.classId || '';
  const day = searchParams.day ? parseInt(searchParams.day, 10) : 1;

  const [schedules, classesData, teachersData] = await Promise.all([
    getTeachingSchedules(session.schoolId, {
      classId: classId || undefined,
    }),
    getClasses(session.schoolId, { limit: 100 }),
    getTeachers(session.schoolId, { limit: 100 }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-100">
          Jadwal Pelajaran Mingguan
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Pemetaan jam mengajar per kelas, hari, urutan jam pelajaran, dan guru pengampu yang terintegrasi langsung dengan sistem presensi estafet.
        </p>
      </div>

      <ScheduleManager
        initialSchedules={schedules}
        classes={classesData.classes.map((c) => ({ id: c.id, name: c.name }))}
        teachers={teachersData.teachers.map((t) => ({
          id: t.id,
          name: t.name,
          role: t.role,
        }))}
        selectedClassId={classId}
        selectedDay={day}
      />
    </div>
  );
}
