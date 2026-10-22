import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getAcademicCalendars } from '@/services/masterDataService';
import { CalendarManager } from '@/components/master-data/CalendarManager';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    month?: string; // YYYY-MM
  }>;
}

export default async function AdminCalendarPage(props: PageProps) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN_SEKOLAH') {
    redirect('/login');
  }

  const searchParams = await props.searchParams;
  const month = searchParams.month || undefined;

  const entries = await getAcademicCalendars(session.schoolId, {
    month,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-100">
          Kalender Akademik Sekolah
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Atur jadwal hari belajar aktif (ACTIVE_KBM), hari libur nasional/sekolah (HOLIDAY), dan kegiatan khusus/non-KBM (SPECIAL_EVENT).
        </p>
      </div>

      <CalendarManager
        initialEntries={entries.map((e) => ({
          id: e.id,
          date: e.date,
          dayType: e.dayType as any,
          description: e.description,
        }))}
        currentYearMonth={month}
      />
    </div>
  );
}
