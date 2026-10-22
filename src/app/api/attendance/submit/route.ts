import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  submitAttendanceSession,
  AttendanceConcurrencyError,
  AttendanceAuthorizationError,
  AttendanceHolidayError,
  AttendanceValidationError,
} from '@/services/attendanceService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Session verification (Strict Server-Side Session ID)
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: Sesi tidak valid atau telah berakhir.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { classId, date, records, idempotencyKey, currentTime } = body;

    if (!classId || !date || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: 'Format payload tidak valid: classId, date, dan records wajib disertakan.' },
        { status: 400 }
      );
    }

    // Client IP for audit logging
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : undefined;

    // 2. Submit attendance using session.id as authenticated teacher ID (NEVER trust body)
    const result = await submitAttendanceSession({
      schoolId: session.schoolId,
      classId,
      date,
      teacherUserId: session.id, // Authenticated user ID from secure HttpOnly session cookie
      records,
      options: {
        currentTime,
        clientIp,
        idempotencyKey,
      },
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    // Concurrency conflict (double submit or race condition)
    if (error instanceof AttendanceConcurrencyError) {
      return NextResponse.json(
        {
          error: error.message,
          concurrencyConflict: true,
        },
        { status: 409 }
      );
    }

    // Server-side authorization rejection
    if (error instanceof AttendanceAuthorizationError) {
      return NextResponse.json(
        {
          error: error.message,
          unauthorized: true,
        },
        { status: 403 }
      );
    }

    // School holiday rejection
    if (error instanceof AttendanceHolidayError) {
      return NextResponse.json(
        {
          error: error.message,
          isHoliday: true,
        },
        { status: 422 }
      );
    }

    if (error instanceof AttendanceValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Error submitting attendance:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan pada server saat menyimpan presensi.' },
      { status: 500 }
    );
  }
}
