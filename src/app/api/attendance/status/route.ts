import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  calculateClassAttendanceOverview,
  escalateUncompletedSessions,
} from '@/services/attendanceService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const currentTime = searchParams.get('currentTime') || undefined;
    const shouldEscalate = searchParams.get('escalate') === 'true';

    if (shouldEscalate) {
      const escalation = await escalateUncompletedSessions(
        session.schoolId,
        date,
        currentTime
      );
      return NextResponse.json(escalation);
    }

    if (classId) {
      const overview = await calculateClassAttendanceOverview(
        session.schoolId,
        classId,
        date,
        currentTime
      );
      return NextResponse.json(overview);
    }

    return NextResponse.json(
      { error: 'Parameter classId atau escalate=true wajib disertakan.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error fetching attendance status:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memeriksa status presensi.' },
      { status: 500 }
    );
  }
}
