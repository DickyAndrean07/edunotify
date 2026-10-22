import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  getOrCreateAttendanceSession,
  AttendanceAuthorizationError,
  AttendanceHolidayError,
  AttendanceValidationError,
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

    if (!classId) {
      return NextResponse.json(
        { error: 'Parameter classId wajib disertakan.' },
        { status: 400 }
      );
    }

    const sessionData = await getOrCreateAttendanceSession(
      session.schoolId,
      classId,
      date,
      session.id,
      { currentTime }
    );

    return NextResponse.json(sessionData);
  } catch (error: any) {
    if (error instanceof AttendanceHolidayError) {
      return NextResponse.json(
        { error: error.message, isHoliday: true },
        { status: 422 }
      );
    }
    if (error instanceof AttendanceAuthorizationError) {
      return NextResponse.json(
        { error: error.message, unauthorized: true },
        { status: 403 }
      );
    }
    if (error instanceof AttendanceValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Error fetching attendance session:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memuat sesi presensi.' },
      { status: 500 }
    );
  }
}
