import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getTeacherTodaySchedules } from '@/services/attendanceService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const currentTime = searchParams.get('currentTime') || undefined;

    const data = await getTeacherTodaySchedules(
      session.schoolId,
      session.id,
      date,
      { currentTime }
    );

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching today teacher schedules:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mengambil jadwal hari ini' },
      { status: 500 }
    );
  }
}
