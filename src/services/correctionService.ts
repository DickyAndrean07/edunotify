import { db } from '@/db';
import {
  attendanceRecords,
  attendanceSessions,
  attendanceCorrections,
  auditLogs,
  classes,
  teachingSchedules,
  users,
  UserRole,
} from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getDayOfWeek, AttendanceStatus } from './attendanceService';

export class CorrectionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CorrectionValidationError';
  }
}

export class CorrectionAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CorrectionAuthorizationError';
  }
}

export type CorrectionWindow =
  | 'HARI_H'
  | 'H_MIN_1_TO_3'
  | 'MORE_THAN_H_MIN_3'
  | 'FUTURE_DATE';

export interface CorrectionEligibilityResult {
  isEligible: boolean;
  window: CorrectionWindow;
  diffDays: number;
  message?: string;
}

export interface CheckCorrectionParams {
  attendanceDate: string; // YYYY-MM-DD
  currentDate?: string; // YYYY-MM-DD (defaults to today)
  userRole: UserRole | string;
  userId: string;
  homeroomTeacherId: string | null;
  submittedByTeacherId?: string | null;
  allowAdminOverride?: boolean;
}

/**
 * Calculate difference in calendar days between attendance date and current date:
 * diffDays = currentDate - attendanceDate
 */
export function calculateCalendarDaysDiff(
  attendanceDateStr: string,
  currentDateStr: string
): number {
  const [ay, am, ad] = attendanceDateStr.split('-').map(Number);
  const [cy, cm, cd] = currentDateStr.split('-').map(Number);

  const attDate = new Date(Date.UTC(ay, am - 1, ad));
  const currDate = new Date(Date.UTC(cy, cm - 1, cd));

  const diffMs = currDate.getTime() - attDate.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Determine correction window and verify RBAC access:
 * - diffDays < 0: FUTURE_DATE (Forbidden)
 * - diffDays === 0: HARI_H (Guru Pengisi Asli OR Wali Kelas OR Admin)
 * - diffDays in [1, 3]: H_MIN_1_TO_3 (Hanya Wali Kelas; Admin allowed if override)
 * - diffDays > 3: MORE_THAN_H_MIN_3 (Hanya Admin Sekolah)
 */
export function verifyCorrectionAccess(
  params: CheckCorrectionParams
): CorrectionEligibilityResult {
  const currentDate =
    params.currentDate || new Date().toISOString().split('T')[0];
  const diffDays = calculateCalendarDaysDiff(
    params.attendanceDate,
    currentDate
  );

  const isHomeroom =
    Boolean(params.homeroomTeacherId) &&
    params.homeroomTeacherId === params.userId;
  const isOriginalTeacher =
    Boolean(params.submittedByTeacherId) &&
    params.submittedByTeacherId === params.userId;
  const isAdmin = params.userRole === 'ADMIN_SEKOLAH';

  if (diffDays < 0) {
    return {
      isEligible: false,
      window: 'FUTURE_DATE',
      diffDays,
      message: 'Presensi tanggal mendatang tidak dapat dikoreksi.',
    };
  }

  // Window 1: Hari H (Hari Pelaksanaan)
  if (diffDays === 0) {
    if (isHomeroom || isOriginalTeacher || isAdmin) {
      return {
        isEligible: true,
        window: 'HARI_H',
        diffDays,
      };
    }
    return {
      isEligible: false,
      window: 'HARI_H',
      diffDays,
      message:
        'Hanya Guru Pengisi atau Wali Kelas yang berwenang mengoreksi presensi pada Hari H.',
    };
  }

  // Window 2: H-1 s/d H-3 (3 Hari Kalender)
  if (diffDays >= 1 && diffDays <= 3) {
    if (isHomeroom) {
      return {
        isEligible: true,
        window: 'H_MIN_1_TO_3',
        diffDays,
      };
    }
    if (isAdmin && params.allowAdminOverride) {
      return {
        isEligible: true,
        window: 'H_MIN_1_TO_3',
        diffDays,
      };
    }
    return {
      isEligible: false,
      window: 'H_MIN_1_TO_3',
      diffDays,
      message:
        'Hanya Wali Kelas yang berwenang melakukan koreksi presensi H-1 s/d H-3.',
    };
  }

  // Window 3: Lebih dari H-3 (> 72 jam)
  if (diffDays > 3) {
    if (isAdmin) {
      return {
        isEligible: true,
        window: 'MORE_THAN_H_MIN_3',
        diffDays,
      };
    }
    return {
      isEligible: false,
      window: 'MORE_THAN_H_MIN_3',
      diffDays,
      message:
        'Koreksi presensi lebih dari 3 hari terkunci bagi guru dan hanya dapat dilakukan oleh Admin Sekolah.',
    };
  }

  return {
    isEligible: false,
    window: 'MORE_THAN_H_MIN_3',
    diffDays,
    message: 'Akses koreksi presensi tidak diizinkan.',
  };
}

export interface CorrectAttendanceInput {
  schoolId: string;
  attendanceRecordId: string;
  correctedByUserId: string;
  userRole: UserRole | string;
  newStatus: AttendanceStatus;
  reason: string;
  currentDate?: string; // Optional for testing/simulation
  allowAdminOverride?: boolean;
}

/**
 * Perform encapsulated attendance correction with audit logging.
 * Preserves oldStatus in attendance_corrections table (no data deleted).
 */
export async function correctAttendanceRecord(input: CorrectAttendanceInput) {
  // 1. Validate reason: Minimum 10 characters
  if (!input.reason || input.reason.trim().length < 10) {
    throw new CorrectionValidationError(
      'Alasan koreksi wajib diisi minimal 10 karakter.'
    );
  }

  const validStatuses: AttendanceStatus[] = [
    'PRESENT',
    'SICK',
    'PERMIT',
    'ABSENT_ALPA',
  ];
  if (!validStatuses.includes(input.newStatus)) {
    throw new CorrectionValidationError(
      `Status presensi baru "${input.newStatus}" tidak valid.`
    );
  }

  // 2. Fetch attendance record with related session and class
  const [recordWithContext] = await db
    .select({
      recordId: attendanceRecords.id,
      schoolId: attendanceRecords.schoolId,
      oldStatus: attendanceRecords.status,
      sessionId: attendanceRecords.sessionId,
      studentId: attendanceRecords.studentId,
      sessionDate: attendanceSessions.date,
      submittedByTeacherId: attendanceSessions.submittedByTeacherId,
      classId: attendanceSessions.classId,
      homeroomTeacherId: classes.homeroomTeacherId,
      className: classes.name,
    })
    .from(attendanceRecords)
    .innerJoin(
      attendanceSessions,
      eq(attendanceRecords.sessionId, attendanceSessions.id)
    )
    .innerJoin(classes, eq(attendanceSessions.classId, classes.id))
    .where(
      and(
        eq(attendanceRecords.id, input.attendanceRecordId),
        eq(attendanceRecords.schoolId, input.schoolId)
      )
    )
    .limit(1);

  if (!recordWithContext) {
    throw new CorrectionValidationError('Data presensi tidak ditemukan.');
  }

  if (recordWithContext.oldStatus === input.newStatus) {
    throw new CorrectionValidationError(
      'Status baru tidak boleh sama dengan status saat ini.'
    );
  }

  // Also check if user is a scheduled teacher for that class on that day
  let isScheduledTeacher = false;
  if (
    !recordWithContext.homeroomTeacherId ||
    recordWithContext.homeroomTeacherId !== input.correctedByUserId
  ) {
    const dayOfWeek = getDayOfWeek(recordWithContext.sessionDate);
    const scheduled = await db
      .select({ id: teachingSchedules.id })
      .from(teachingSchedules)
      .where(
        and(
          eq(teachingSchedules.schoolId, input.schoolId),
          eq(teachingSchedules.classId, recordWithContext.classId),
          eq(teachingSchedules.teacherId, input.correctedByUserId),
          eq(teachingSchedules.dayOfWeek, dayOfWeek)
        )
      )
      .limit(1);

    if (scheduled.length > 0) {
      isScheduledTeacher = true;
    }
  }

  // 3. Verify RBAC access
  const accessCheck = verifyCorrectionAccess({
    attendanceDate: recordWithContext.sessionDate,
    currentDate: input.currentDate,
    userRole: input.userRole,
    userId: input.correctedByUserId,
    homeroomTeacherId: recordWithContext.homeroomTeacherId,
    submittedByTeacherId:
      recordWithContext.submittedByTeacherId || (isScheduledTeacher ? input.correctedByUserId : null),
    allowAdminOverride: input.allowAdminOverride,
  });

  if (!accessCheck.isEligible) {
    throw new CorrectionAuthorizationError(
      accessCheck.message || 'Anda tidak memiliki hak untuk mengoreksi presensi ini.'
    );
  }

  // 4. Atomic Transaction: update record, insert correction, insert audit log
  return await db.transaction(async (tx) => {
    // A. Update attendance record status
    const [updatedRecord] = await tx
      .update(attendanceRecords)
      .set({
        status: input.newStatus,
        updatedAt: new Date(),
      })
      .where(eq(attendanceRecords.id, input.attendanceRecordId))
      .returning();

    // B. Insert attendance correction entry
    const [correctionEntry] = await tx
      .insert(attendanceCorrections)
      .values({
        schoolId: input.schoolId,
        attendanceRecordId: input.attendanceRecordId,
        correctedByUserId: input.correctedByUserId,
        oldStatus: recordWithContext.oldStatus,
        newStatus: input.newStatus,
        reason: input.reason.trim(),
      })
      .returning();

    // C. Insert encapsulated audit log entry
    const isPostDay = accessCheck.diffDays > 0;
    const actionName = isPostDay
      ? 'ATTENDANCE_CORRECTION_POST_DAY'
      : 'ATTENDANCE_CORRECTION';

    await tx.insert(auditLogs).values({
      schoolId: input.schoolId,
      userId: input.correctedByUserId,
      action: actionName,
      entityType: 'attendance_record',
      entityId: input.attendanceRecordId,
      detailsJson: JSON.stringify({
        oldStatus: recordWithContext.oldStatus,
        newStatus: input.newStatus,
        reason: input.reason.trim(),
        diffDays: accessCheck.diffDays,
        window: accessCheck.window,
        isPostDay,
        className: recordWithContext.className,
        sessionDate: recordWithContext.sessionDate,
      }),
    });

    return {
      success: true,
      updatedRecord,
      correction: correctionEntry,
      accessWindow: accessCheck.window,
      diffDays: accessCheck.diffDays,
    };
  });
}

/**
 * Fetch full correction history for an attendance record.
 */
export async function getCorrectionHistory(
  schoolId: string,
  attendanceRecordId: string
) {
  return await db
    .select({
      id: attendanceCorrections.id,
      attendanceRecordId: attendanceCorrections.attendanceRecordId,
      oldStatus: attendanceCorrections.oldStatus,
      newStatus: attendanceCorrections.newStatus,
      reason: attendanceCorrections.reason,
      createdAt: attendanceCorrections.createdAt,
      correctedBy: {
        id: users.id,
        name: users.name,
        role: users.role,
      },
    })
    .from(attendanceCorrections)
    .innerJoin(users, eq(attendanceCorrections.correctedByUserId, users.id))
    .where(
      and(
        eq(attendanceCorrections.schoolId, schoolId),
        eq(attendanceCorrections.attendanceRecordId, attendanceRecordId)
      )
    )
    .orderBy(desc(attendanceCorrections.createdAt));
}
