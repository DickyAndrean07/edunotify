import { db } from '@/db';
import {
  attendanceSessions,
  attendanceRecords,
  teachingSchedules,
  academicCalendars,
  classes,
  students,
  classEnrollments,
  users,
  auditLogs,
  USER_ROLES,
  UserRole,
} from '@/db/schema';
import { eq, and, or, sql, asc, desc, inArray } from 'drizzle-orm';

// ==========================================
// 1. TYPES & ERROR CLASSES
// ==========================================

export type AttendanceStatus =
  | 'UNRECORDED'
  | 'PRESENT'
  | 'SICK'
  | 'PERMIT'
  | 'ABSENT_ALPA';

export type SessionStatus = 'DRAFT' | 'SUBMITTED' | 'UNCOMPLETED_ALERT';

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  UNRECORDED: 'Belum Diabsen',
  PRESENT: 'Hadir',
  SICK: 'Sakit',
  PERMIT: 'Izin',
  ABSENT_ALPA: 'Alpa',
};

export class AttendanceConcurrencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AttendanceConcurrencyError';
  }
}

export class AttendanceAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AttendanceAuthorizationError';
  }
}

export class AttendanceHolidayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AttendanceHolidayError';
  }
}

export class AttendanceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AttendanceValidationError';
  }
}

export interface StudentAttendanceRecord {
  id?: string;
  studentId: string;
  nis: string;
  nisn?: string | null;
  name: string;
  gender: string;
  guardianName?: string | null;
  guardianPhone?: string | null;
  status: AttendanceStatus;
  notes?: string | null;
}

export interface RecordSubmissionInput {
  studentId: string;
  status: AttendanceStatus;
  notes?: string | null;
}

export interface SubmitAttendanceParams {
  schoolId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  teacherUserId: string;
  records: RecordSubmissionInput[];
  options?: {
    currentTime?: string; // HH:mm for deterministic tests
    clientIp?: string;
    idempotencyKey?: string;
  };
}

export interface RelayAccessCheckResult {
  authorized: boolean;
  canEdit: boolean;
  isReadOnly: boolean;
  isLateSubmission: boolean;
  reason?:
    | 'AUTHORIZED'
    | 'ALREADY_SUBMITTED'
    | 'EARLIER_PERIOD_PENDING'
    | 'NOT_SCHEDULED_TEACHER'
    | 'NO_SCHEDULE'
    | 'HOLIDAY'
    | 'ADMIN_OVERRIDE';
  message?: string;
  session?: {
    id: string;
    status: string;
    submittedByTeacherId?: string | null;
    submittedAt?: Date | null;
    isLateSubmission: boolean;
  } | null;
  submittedByName?: string | null;
  activePeriod?: number | null;
  teacherPeriods?: number[];
  allPeriods?: Array<{
    periodOrder: number;
    subjectName: string;
    teacherId: string;
    teacherName?: string;
    startTime: string;
    endTime: string;
  }>;
}

export interface ClassAttendanceOverview {
  classId: string;
  className: string;
  date: string;
  isHoliday: boolean;
  holidayDescription?: string | null;
  sessionStatus: 'NOT_CREATED' | 'DRAFT' | 'SUBMITTED' | 'UNCOMPLETED_ALERT';
  isSubmitted: boolean;
  isWarning12pm: boolean;
  isUncompletedAlert: boolean;
  isLateSubmission: boolean;
  warningMessage?: string | null;
  submittedBy?: {
    id: string;
    name: string;
  } | null;
  submittedAt?: Date | null;
  earliestStartTime?: string | null;
  latestEndTime?: string | null;
  totalStudents: number;
  recordedCount: number;
  presentCount: number;
  sickCount: number;
  permitCount: number;
  alpaCount: number;
  unrecordedCount: number;
}

// ==========================================
// 2. HELPER UTILITIES
// ==========================================

/**
 * Returns Day of Week: 1 = Senin, 2 = Selasa, ..., 7 = Minggu
 */
export function getDayOfWeek(dateStr: string): number {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(Date.UTC(year, month, day));
  const utcDay = d.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  return utcDay === 0 ? 7 : utcDay;
}

/**
 * Formats date object to HH:mm in WIB (UTC+7) or local
 */
export function getCurrentTimeHHmm(date = new Date()): string {
  // Use Intl with Asia/Jakarta timezone
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const formatted = formatter.format(date);
  return formatted.replace('.', ':');
}

/**
 * Check if date is holiday in academic_calendars or Sunday
 */
export async function checkAcademicCalendar(
  schoolId: string,
  dateStr: string
): Promise<{ isHoliday: boolean; dayType: string; description?: string | null }> {
  const [calendar] = await db
    .select({
      id: academicCalendars.id,
      dayType: academicCalendars.dayType,
      description: academicCalendars.description,
    })
    .from(academicCalendars)
    .where(
      and(
        eq(academicCalendars.schoolId, schoolId),
        eq(academicCalendars.date, dateStr)
      )
    );

  if (calendar) {
    if (calendar.dayType === 'HOLIDAY') {
      return {
        isHoliday: true,
        dayType: 'HOLIDAY',
        description: calendar.description || 'Hari Libur Sekolah',
      };
    }
    return {
      isHoliday: false,
      dayType: calendar.dayType,
      description: calendar.description,
    };
  }

  // Fallback: check if Sunday (7)
  const dayOfWeek = getDayOfWeek(dateStr);
  if (dayOfWeek === 7) {
    return {
      isHoliday: true,
      dayType: 'HOLIDAY',
      description: 'Hari Minggu (Libur Mingguan)',
    };
  }

  return {
    isHoliday: false,
    dayType: 'ACTIVE_KBM',
    description: null,
  };
}

// ==========================================
// 3. RELAY AUTHORIZATION ENGINE
// ==========================================

/**
 * Verifies if a teacher has server-side authorization to view/fill attendance
 * for a specific class on a specific date under schedule relay rules.
 */
export async function verifyRelayAttendanceAccess(
  schoolId: string,
  classId: string,
  dateStr: string,
  userId: string,
  options?: {
    currentTime?: string;
  }
): Promise<RelayAccessCheckResult> {
  const currentTime = options?.currentTime || getCurrentTimeHHmm();

  // 1. Verify User existence & role
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      role: users.role,
      schoolId: users.schoolId,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user || user.schoolId !== schoolId || !user.isActive) {
    throw new AttendanceAuthorizationError(
      'Pengguna tidak ditemukan atau tidak aktif di sekolah ini.'
    );
  }

  // 2. Check Academic Calendar (Holiday rejection)
  const calendarInfo = await checkAcademicCalendar(schoolId, dateStr);
  if (calendarInfo.isHoliday) {
    return {
      authorized: false,
      canEdit: false,
      isReadOnly: true,
      isLateSubmission: false,
      reason: 'HOLIDAY',
      message: `Hari ini adalah hari libur (${calendarInfo.description || 'HOLIDAY'}). Presensi tidak dapat dilakukan.`,
    };
  }

  // 3. Check Existing Session
  const [existingSession] = await db
    .select({
      id: attendanceSessions.id,
      status: attendanceSessions.status,
      submittedByTeacherId: attendanceSessions.submittedByTeacherId,
      submittedAt: attendanceSessions.submittedAt,
      isLateSubmission: attendanceSessions.isLateSubmission,
    })
    .from(attendanceSessions)
    .where(
      and(
        eq(attendanceSessions.schoolId, schoolId),
        eq(attendanceSessions.classId, classId),
        eq(attendanceSessions.date, dateStr)
      )
    );

  let submitterName: string | null = null;
  if (existingSession?.submittedByTeacherId) {
    const [subUser] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, existingSession.submittedByTeacherId));
    submitterName = subUser?.name || null;
  }

  // If already SUBMITTED: locked / read-only for subsequent teachers
  if (existingSession && existingSession.status === 'SUBMITTED') {
    return {
      authorized: true,
      canEdit: false,
      isReadOnly: true,
      isLateSubmission: existingSession.isLateSubmission,
      reason: 'ALREADY_SUBMITTED',
      message: `Presensi kelas ini telah disubmit oleh ${submitterName || 'guru pengampu'}${
        existingSession.submittedAt
          ? ` pada ${new Date(existingSession.submittedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
          : ''
      }. Status terkunci (read-only).`,
      session: existingSession,
      submittedByName: submitterName,
    };
  }

  // 4. Admin Sekolah Override
  if (user.role === USER_ROLES.ADMIN_SEKOLAH) {
    return {
      authorized: true,
      canEdit: true,
      isReadOnly: false,
      isLateSubmission: false,
      reason: 'ADMIN_OVERRIDE',
      message: 'Otorisasi Admin Sekolah (Akses Penuh).',
      session: existingSession || null,
      submittedByName: submitterName,
    };
  }

  // 5. Query Teaching Schedules for this class on this day of week
  const dayOfWeek = getDayOfWeek(dateStr);
  const classSchedules = await db
    .select({
      id: teachingSchedules.id,
      periodOrder: teachingSchedules.periodOrder,
      subjectName: teachingSchedules.subjectName,
      teacherId: teachingSchedules.teacherId,
      startTime: teachingSchedules.startTime,
      endTime: teachingSchedules.endTime,
      teacherName: users.name,
    })
    .from(teachingSchedules)
    .innerJoin(users, eq(teachingSchedules.teacherId, users.id))
    .where(
      and(
        eq(teachingSchedules.schoolId, schoolId),
        eq(teachingSchedules.classId, classId),
        eq(teachingSchedules.dayOfWeek, dayOfWeek)
      )
    )
    .orderBy(asc(teachingSchedules.periodOrder), asc(teachingSchedules.startTime));

  if (classSchedules.length === 0) {
    return {
      authorized: false,
      canEdit: false,
      isReadOnly: false,
      isLateSubmission: false,
      reason: 'NO_SCHEDULE',
      message: 'Tidak ada jadwal pelajaran untuk kelas ini pada hari ini.',
    };
  }

  // Filter teacher's own schedules
  const teacherSchedules = classSchedules.filter((s) => s.teacherId === userId);
  if (teacherSchedules.length === 0) {
    return {
      authorized: false,
      canEdit: false,
      isReadOnly: false,
      isLateSubmission: false,
      reason: 'NOT_SCHEDULED_TEACHER',
      message: 'Anda tidak memiliki jadwal mengajar di kelas ini hari ini.',
      allPeriods: classSchedules,
    };
  }

  const teacherPeriods = teacherSchedules.map((s) => s.periodOrder);
  const earliestTeacherSchedule = teacherSchedules[0];
  const latestScheduleInClass = classSchedules[classSchedules.length - 1];

  // 6. Relay Schedule Logic:
  // Is this late submission? (after school / last schedule ended)
  const isAfterSchool = currentTime > latestScheduleInClass.endTime;

  // Period 1 vs Later Periods:
  // If teacher is period 1: can submit if currentTime >= period 1 start time (or after school)
  // If teacher is period > 1: can submit if period 1 did not submit AND currentTime >= this teacher's period start time (or after school)
  const hasTeacherPeriodStarted = currentTime >= earliestTeacherSchedule.startTime;

  if (!hasTeacherPeriodStarted && !isAfterSchool) {
    return {
      authorized: false,
      canEdit: false,
      isReadOnly: false,
      isLateSubmission: false,
      reason: 'EARLIER_PERIOD_PENDING',
      message: `Jam mengajar Anda belum dimulai (${earliestTeacherSchedule.startTime} - ${earliestTeacherSchedule.endTime}). Saat ini masih jam pelajaran sebelumnya.`,
      teacherPeriods,
      activePeriod: earliestTeacherSchedule.periodOrder,
      allPeriods: classSchedules,
      session: existingSession || null,
    };
  }

  // Relay handover is valid: earlier periods did not submit, and teacher's period has arrived or ended
  return {
    authorized: true,
    canEdit: true,
    isReadOnly: false,
    isLateSubmission: isAfterSchool,
    reason: 'AUTHORIZED',
    message: isAfterSchool
      ? 'Pengisian susulan setelah jam KBM selesai (is_late_submission = true).'
      : `Otorisasi estafet aktif untuk jam ke-${earliestTeacherSchedule.periodOrder} (${earliestTeacherSchedule.subjectName}).`,
    teacherPeriods,
    activePeriod: earliestTeacherSchedule.periodOrder,
    allPeriods: classSchedules,
    session: existingSession || null,
  };
}

// ==========================================
// 4. SESSION & STUDENT INITIALIZATION
// ==========================================

/**
 * Get or automatically initialize attendance session for a class on a date.
 * Enrolled students are initialized with status 'UNRECORDED' (Belum Diabsen).
 */
export async function getOrCreateAttendanceSession(
  schoolId: string,
  classId: string,
  dateStr: string,
  userId: string,
  options?: {
    currentTime?: string;
  }
) {
  // 1. Verify Access
  const access = await verifyRelayAttendanceAccess(
    schoolId,
    classId,
    dateStr,
    userId,
    options
  );

  if (access.reason === 'HOLIDAY') {
    throw new AttendanceHolidayError(access.message || 'Hari libur sekolah.');
  }

  if (
    !access.authorized &&
    access.reason !== 'ALREADY_SUBMITTED' &&
    access.reason !== 'EARLIER_PERIOD_PENDING'
  ) {
    throw new AttendanceAuthorizationError(
      access.message || 'Anda tidak diizinkan mengakses presensi kelas ini.'
    );
  }

  // 2. Fetch Class Details
  const [classInfo] = await db
    .select({
      id: classes.id,
      name: classes.name,
      gradeLevel: classes.gradeLevel,
      homeroomTeacherId: classes.homeroomTeacherId,
    })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.schoolId, schoolId)));

  if (!classInfo) {
    throw new AttendanceValidationError('Data kelas tidak ditemukan.');
  }

  // 3. Fetch Enrolled Active Students
  const enrolledStudents = await db
    .select({
      id: students.id,
      nis: students.nis,
      nisn: students.nisn,
      name: students.name,
      gender: students.gender,
      guardianName: students.guardianName,
      guardianPhone: students.guardianPhone,
    })
    .from(classEnrollments)
    .innerJoin(students, eq(classEnrollments.studentId, students.id))
    .where(
      and(
        eq(classEnrollments.schoolId, schoolId),
        eq(classEnrollments.classId, classId),
        eq(students.isActive, true)
      )
    )
    .orderBy(asc(students.name));

  // 4. Find or Create Attendance Session
  let [session] = await db
    .select()
    .from(attendanceSessions)
    .where(
      and(
        eq(attendanceSessions.schoolId, schoolId),
        eq(attendanceSessions.classId, classId),
        eq(attendanceSessions.date, dateStr)
      )
    );

  if (!session) {
    // Auto-create DRAFT session
    const [newSession] = await db
      .insert(attendanceSessions)
      .values({
        schoolId,
        classId,
        date: dateStr,
        status: 'DRAFT',
        isLateSubmission: access.isLateSubmission,
      })
      .returning();
    session = newSession;

    // Auto-initialize all enrolled students with UNRECORDED
    if (enrolledStudents.length > 0) {
      await db.insert(attendanceRecords).values(
        enrolledStudents.map((s) => ({
          schoolId,
          sessionId: session.id,
          studentId: s.id,
          status: 'UNRECORDED',
          notes: null,
        }))
      );
    }
  }

  // 5. Fetch existing attendance records
  const existingRecords = await db
    .select({
      id: attendanceRecords.id,
      studentId: attendanceRecords.studentId,
      status: attendanceRecords.status,
      notes: attendanceRecords.notes,
    })
    .from(attendanceRecords)
    .where(eq(attendanceRecords.sessionId, session.id));

  const recordMap = new Map(existingRecords.map((r) => [r.studentId, r]));

  // If new students were enrolled after draft creation, insert missing records as UNRECORDED
  const missingStudents = enrolledStudents.filter((s) => !recordMap.has(s.id));
  if (missingStudents.length > 0) {
    const insertedMissing = await db
      .insert(attendanceRecords)
      .values(
        missingStudents.map((s) => ({
          schoolId,
          sessionId: session.id,
          studentId: s.id,
          status: 'UNRECORDED',
          notes: null,
        }))
      )
      .returning();

    for (const r of insertedMissing) {
      recordMap.set(r.studentId, r);
    }
  }

  // Assemble full student records list
  const studentRecords: StudentAttendanceRecord[] = enrolledStudents.map((s) => {
    const rec = recordMap.get(s.id);
    return {
      id: rec?.id,
      studentId: s.id,
      nis: s.nis,
      nisn: s.nisn,
      name: s.name,
      gender: s.gender,
      guardianName: s.guardianName,
      guardianPhone: s.guardianPhone,
      status: (rec?.status as AttendanceStatus) || 'UNRECORDED',
      notes: rec?.notes || null,
    };
  });

  // Calculate Warning & Escalation indicators
  const stateOverview = await calculateClassAttendanceOverview(
    schoolId,
    classId,
    dateStr,
    options?.currentTime
  );

  return {
    session,
    classInfo,
    records: studentRecords,
    access,
    overview: stateOverview,
  };
}

// ==========================================
// 5. ATOMIC SAVE & CONCURRENCY PROTECTION
// ==========================================

/**
 * Submit official attendance with atomic concurrency protection, row-level locking,
 * idempotency, and late submission detection.
 */
export async function submitAttendanceSession(
  params: SubmitAttendanceParams
): Promise<{
  success: boolean;
  sessionId: string;
  isLateSubmission: boolean;
  submittedAt: Date;
  submittedByName: string;
  recordsCount: number;
  message: string;
}> {
  const { schoolId, classId, date, teacherUserId, records, options } = params;
  const currentTime = options?.currentTime || getCurrentTimeHHmm();

  if (!records || records.length === 0) {
    throw new AttendanceValidationError(
      'Daftar presensi siswa tidak boleh kosong.'
    );
  }

  // 1. Verify Teacher & Schedule server-side
  const [submittingTeacher] = await db
    .select({
      id: users.id,
      name: users.name,
      role: users.role,
      schoolId: users.schoolId,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, teacherUserId));

  if (
    !submittingTeacher ||
    submittingTeacher.schoolId !== schoolId ||
    !submittingTeacher.isActive
  ) {
    throw new AttendanceAuthorizationError(
      'Otorisasi gagal: Guru tidak terdaftar atau tidak aktif.'
    );
  }

  // 2. Check Holiday
  const calendarCheck = await checkAcademicCalendar(schoolId, date);
  if (calendarCheck.isHoliday) {
    throw new AttendanceHolidayError(
      `Presensi ditolak: Hari ini adalah hari libur (${calendarCheck.description || 'HOLIDAY'}).`
    );
  }

  // 3. Check Teacher Schedule & Relay Order (unless Admin)
  const dayOfWeek = getDayOfWeek(date);
  const classSchedules = await db
    .select({
      id: teachingSchedules.id,
      periodOrder: teachingSchedules.periodOrder,
      startTime: teachingSchedules.startTime,
      endTime: teachingSchedules.endTime,
      teacherId: teachingSchedules.teacherId,
    })
    .from(teachingSchedules)
    .where(
      and(
        eq(teachingSchedules.schoolId, schoolId),
        eq(teachingSchedules.classId, classId),
        eq(teachingSchedules.dayOfWeek, dayOfWeek)
      )
    )
    .orderBy(asc(teachingSchedules.periodOrder));

  let isLate = false;

  if (submittingTeacher.role !== USER_ROLES.ADMIN_SEKOLAH) {
    if (classSchedules.length === 0) {
      throw new AttendanceAuthorizationError(
        'Tidak ada jadwal pelajaran untuk kelas ini pada hari ini.'
      );
    }

    const teacherSchedules = classSchedules.filter(
      (s) => s.teacherId === teacherUserId
    );
    if (teacherSchedules.length === 0) {
      throw new AttendanceAuthorizationError(
        'Anda tidak memiliki jadwal mengajar di kelas ini hari ini.'
      );
    }

    const earliestTeacherPeriod = teacherSchedules[0];
    const latestSchedule = classSchedules[classSchedules.length - 1];

    if (currentTime > latestSchedule.endTime) {
      isLate = true;
    } else if (currentTime < earliestTeacherPeriod.startTime) {
      throw new AttendanceAuthorizationError(
        `Jam mengajar Anda belum dimulai (${earliestTeacherPeriod.startTime}).`
      );
    }
  } else {
    // Admin submitting after last schedule or evening
    if (classSchedules.length > 0) {
      const latestSchedule = classSchedules[classSchedules.length - 1];
      if (currentTime > latestSchedule.endTime) {
        isLate = true;
      }
    }
  }

  // 4. ATOMIC DATABASE TRANSACTION WITH ROW LOCKING
  try {
    const result = await db.transaction(async (tx) => {
      // Lock existing session row with SELECT ... FOR UPDATE
      const [lockedSession] = await tx
        .select()
        .from(attendanceSessions)
        .where(
          and(
            eq(attendanceSessions.schoolId, schoolId),
            eq(attendanceSessions.classId, classId),
            eq(attendanceSessions.date, date)
          )
        )
        .for('update');

      // CONCURRENCY CHECK: If already SUBMITTED, reject second submitter cleanly
      if (lockedSession && lockedSession.status === 'SUBMITTED') {
        let firstSubmitterName = 'guru lain';
        if (lockedSession.submittedByTeacherId) {
          const [firstTeacher] = await tx
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, lockedSession.submittedByTeacherId));
          if (firstTeacher?.name) {
            firstSubmitterName = firstTeacher.name;
          }
        }

        throw new AttendanceConcurrencyError(
          `Presensi untuk kelas ini telah disubmit oleh ${firstSubmitterName}. Data Anda tidak disimpan untuk mencegah duplikasi.`
        );
      }

      let activeSessionId: string;
      const submissionTimestamp = new Date();

      if (!lockedSession) {
        // Create new session as SUBMITTED
        const [insertedSession] = await tx
          .insert(attendanceSessions)
          .values({
            schoolId,
            classId,
            date,
            submittedByTeacherId: teacherUserId,
            status: 'SUBMITTED',
            submittedAt: submissionTimestamp,
            isLateSubmission: isLate,
          })
          .returning();
        activeSessionId = insertedSession.id;
      } else {
        // Update existing DRAFT or UNCOMPLETED_ALERT to SUBMITTED
        const [updatedSession] = await tx
          .update(attendanceSessions)
          .set({
            status: 'SUBMITTED',
            submittedByTeacherId: teacherUserId,
            submittedAt: submissionTimestamp,
            isLateSubmission: isLate || lockedSession.isLateSubmission,
          })
          .where(eq(attendanceSessions.id, lockedSession.id))
          .returning();
        activeSessionId = updatedSession.id;
      }

      // Upsert student attendance records
      for (const rec of records) {
        await tx
          .insert(attendanceRecords)
          .values({
            schoolId,
            sessionId: activeSessionId,
            studentId: rec.studentId,
            status: rec.status,
            notes: rec.notes || null,
          })
          .onConflictDoUpdate({
            target: [attendanceRecords.sessionId, attendanceRecords.studentId],
            set: {
              status: rec.status,
              notes: rec.notes || null,
              updatedAt: new Date(),
            },
          });
      }

      // Record Audit Log
      await tx.insert(auditLogs).values({
        schoolId,
        userId: teacherUserId,
        action: 'SUBMIT_ATTENDANCE',
        entityType: 'attendance_sessions',
        entityId: activeSessionId,
        detailsJson: JSON.stringify({
          classId,
          date,
          submittedBy: teacherUserId,
          isLateSubmission: isLate,
          totalRecords: records.length,
          idempotencyKey: options?.idempotencyKey || null,
        }),
        ipAddress: options?.clientIp || null,
      });

      return {
        sessionId: activeSessionId,
        isLateSubmission: isLate,
        submittedAt: submissionTimestamp,
        submittedByName: submittingTeacher.name,
      };
    });

    return {
      success: true,
      sessionId: result.sessionId,
      isLateSubmission: result.isLateSubmission,
      submittedAt: result.submittedAt,
      submittedByName: result.submittedByName,
      recordsCount: records.length,
      message: 'Presensi resmi berhasil disimpan.',
    };
  } catch (err: any) {
    // If unique constraint violation occurs during concurrent insert race
    if (
      err.code === '23505' ||
      err.message?.includes('attendance_sessions_school_class_date_idx')
    ) {
      throw new AttendanceConcurrencyError(
        'Presensi untuk kelas ini baru saja disubmit oleh guru lain. Data Anda tidak disimpan untuk mencegah duplikasi.'
      );
    }
    throw err;
  }
}

// ==========================================
// 6. DETERMINISTIC 12.00 WARNING & ESCALATION
// ==========================================

/**
 * Calculates deterministic attendance overview for a class:
 * - 12:00 Warning Banner
 * - End-of-Day Escalation (UNCOMPLETED_ALERT)
 * - Statistics (Present, Sick, Permit, Alpa, Unrecorded)
 */
export async function calculateClassAttendanceOverview(
  schoolId: string,
  classId: string,
  dateStr: string,
  currentTimeParam?: string
): Promise<ClassAttendanceOverview> {
  const currentTime = currentTimeParam || getCurrentTimeHHmm();

  // 1. Fetch Class Info
  const [classRow] = await db
    .select({
      id: classes.id,
      name: classes.name,
    })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.schoolId, schoolId)));

  const className = classRow?.name || 'Kelas';

  // 2. Check Calendar
  const cal = await checkAcademicCalendar(schoolId, dateStr);

  // 3. Fetch Class Schedules
  const dayOfWeek = getDayOfWeek(dateStr);
  const classSchedules = await db
    .select({
      periodOrder: teachingSchedules.periodOrder,
      startTime: teachingSchedules.startTime,
      endTime: teachingSchedules.endTime,
    })
    .from(teachingSchedules)
    .where(
      and(
        eq(teachingSchedules.schoolId, schoolId),
        eq(teachingSchedules.classId, classId),
        eq(teachingSchedules.dayOfWeek, dayOfWeek)
      )
    )
    .orderBy(asc(teachingSchedules.periodOrder));

  const earliestStartTime = classSchedules[0]?.startTime || null;
  const latestEndTime =
    classSchedules.length > 0
      ? classSchedules[classSchedules.length - 1].endTime
      : null;

  // 4. Fetch Session
  const [session] = await db
    .select()
    .from(attendanceSessions)
    .where(
      and(
        eq(attendanceSessions.schoolId, schoolId),
        eq(attendanceSessions.classId, classId),
        eq(attendanceSessions.date, dateStr)
      )
    );

  let submitter: { id: string; name: string } | null = null;
  if (session?.submittedByTeacherId) {
    const [u] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, session.submittedByTeacherId));
    if (u) submitter = u;
  }

  // 5. Fetch Record Counts
  let records: Array<{ status: string }> = [];
  if (session) {
    records = await db
      .select({ status: attendanceRecords.status })
      .from(attendanceRecords)
      .where(eq(attendanceRecords.sessionId, session.id));
  } else {
    // If no session, count enrolled students
    const [enrolledCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(classEnrollments)
      .innerJoin(students, eq(classEnrollments.studentId, students.id))
      .where(
        and(
          eq(classEnrollments.schoolId, schoolId),
          eq(classEnrollments.classId, classId),
          eq(students.isActive, true)
        )
      );
    const countNum = Number(enrolledCount?.count || 0);
    records = Array(countNum).fill({ status: 'UNRECORDED' });
  }

  const totalStudents = records.length;
  let presentCount = 0;
  let sickCount = 0;
  let permitCount = 0;
  let alpaCount = 0;
  let unrecordedCount = 0;

  for (const r of records) {
    if (r.status === 'PRESENT') presentCount++;
    else if (r.status === 'SICK') sickCount++;
    else if (r.status === 'PERMIT') permitCount++;
    else if (r.status === 'ABSENT_ALPA') alpaCount++;
    else unrecordedCount++;
  }

  const isSubmitted = session?.status === 'SUBMITTED';

  // 6. Deterministic Warnings Calculation
  let isWarning12pm = false;
  let isUncompletedAlert = false;
  let warningMessage: string | null = null;

  if (!cal.isHoliday && classSchedules.length > 0) {
    if (!isSubmitted) {
      // Has end of day passed?
      const isPastLastPeriod = latestEndTime ? currentTime > latestEndTime : false;

      if (isPastLastPeriod || session?.status === 'UNCOMPLETED_ALERT') {
        isUncompletedAlert = true;
        warningMessage = `Kelas ${className} belum mengisi presensi hingga akhir jam KBM (${latestEndTime || 'selesai'}).`;
      } else if (currentTime >= '12:00') {
        isWarning12pm = true;
        warningMessage = `Kelas ${className} belum mengisi presensi per 12.00 WIB.`;
      }
    }
  }

  const sessionStatus: ClassAttendanceOverview['sessionStatus'] = isSubmitted
    ? 'SUBMITTED'
    : isUncompletedAlert
    ? 'UNCOMPLETED_ALERT'
    : session
    ? 'DRAFT'
    : 'NOT_CREATED';

  return {
    classId,
    className,
    date: dateStr,
    isHoliday: cal.isHoliday,
    holidayDescription: cal.description,
    sessionStatus,
    isSubmitted,
    isWarning12pm,
    isUncompletedAlert,
    isLateSubmission: session?.isLateSubmission || false,
    warningMessage,
    submittedBy: submitter,
    submittedAt: session?.submittedAt || null,
    earliestStartTime,
    latestEndTime,
    totalStudents,
    recordedCount: totalStudents - unrecordedCount,
    presentCount,
    sickCount,
    permitCount,
    alpaCount,
    unrecordedCount,
  };
}

/**
 * Deterministically escalates all unsubmitted sessions for a date
 * to UNCOMPLETED_ALERT after the last teaching schedule of the day has ended.
 */
export async function escalateUncompletedSessions(
  schoolId: string,
  dateStr: string,
  currentTimeParam?: string
): Promise<{ escalatedClassIds: string[]; totalEscalated: number }> {
  const currentTime = currentTimeParam || getCurrentTimeHHmm();

  // If holiday, no escalation
  const cal = await checkAcademicCalendar(schoolId, dateStr);
  if (cal.isHoliday) {
    return { escalatedClassIds: [], totalEscalated: 0 };
  }

  const dayOfWeek = getDayOfWeek(dateStr);

  // Find all classes in school that have schedules today
  const schedules = await db
    .select({
      classId: teachingSchedules.classId,
      periodOrder: teachingSchedules.periodOrder,
      endTime: teachingSchedules.endTime,
    })
    .from(teachingSchedules)
    .where(
      and(
        eq(teachingSchedules.schoolId, schoolId),
        eq(teachingSchedules.dayOfWeek, dayOfWeek)
      )
    );

  // Group by classId to find max endTime
  const classEndTimeMap = new Map<string, string>();
  for (const s of schedules) {
    const currentMax = classEndTimeMap.get(s.classId);
    if (!currentMax || s.endTime > currentMax) {
      classEndTimeMap.set(s.classId, s.endTime);
    }
  }

  const escalatedClassIds: string[] = [];

  for (const [classId, maxEndTime] of classEndTimeMap.entries()) {
    if (currentTime > maxEndTime) {
      // Check session
      const [existing] = await db
        .select()
        .from(attendanceSessions)
        .where(
          and(
            eq(attendanceSessions.schoolId, schoolId),
            eq(attendanceSessions.classId, classId),
            eq(attendanceSessions.date, dateStr)
          )
        );

      if (!existing) {
        // Create session directly as UNCOMPLETED_ALERT
        await db.insert(attendanceSessions).values({
          schoolId,
          classId,
          date: dateStr,
          status: 'UNCOMPLETED_ALERT',
          isLateSubmission: true,
        });
        escalatedClassIds.push(classId);
      } else if (existing.status === 'DRAFT') {
        // Escalate draft to UNCOMPLETED_ALERT
        await db
          .update(attendanceSessions)
          .set({
            status: 'UNCOMPLETED_ALERT',
            isLateSubmission: true,
          })
          .where(eq(attendanceSessions.id, existing.id));
        escalatedClassIds.push(classId);
      }
    }
  }

  return {
    escalatedClassIds,
    totalEscalated: escalatedClassIds.length,
  };
}

/**
 * Get all today schedules for a specific teacher with attendance status.
 */
export async function getTeacherTodaySchedules(
  schoolId: string,
  teacherUserId: string,
  dateStr: string,
  options?: {
    currentTime?: string;
  }
) {
  const currentTime = options?.currentTime || getCurrentTimeHHmm();
  const dayOfWeek = getDayOfWeek(dateStr);
  const calendar = await checkAcademicCalendar(schoolId, dateStr);

  const schedules = await db
    .select({
      id: teachingSchedules.id,
      classId: teachingSchedules.classId,
      className: classes.name,
      gradeLevel: classes.gradeLevel,
      subjectName: teachingSchedules.subjectName,
      periodOrder: teachingSchedules.periodOrder,
      startTime: teachingSchedules.startTime,
      endTime: teachingSchedules.endTime,
    })
    .from(teachingSchedules)
    .innerJoin(classes, eq(teachingSchedules.classId, classes.id))
    .where(
      and(
        eq(teachingSchedules.schoolId, schoolId),
        eq(teachingSchedules.teacherId, teacherUserId),
        eq(teachingSchedules.dayOfWeek, dayOfWeek)
      )
    )
    .orderBy(asc(teachingSchedules.periodOrder), asc(teachingSchedules.startTime));

  const items = [];

  for (const s of schedules) {
    const access = await verifyRelayAttendanceAccess(
      schoolId,
      s.classId,
      dateStr,
      teacherUserId,
      { currentTime }
    );

    const overview = await calculateClassAttendanceOverview(
      schoolId,
      s.classId,
      dateStr,
      currentTime
    );

    items.push({
      schedule: s,
      access,
      overview,
    });
  }

  return {
    date: dateStr,
    dayOfWeek,
    isHoliday: calendar.isHoliday,
    holidayDescription: calendar.description,
    currentTime,
    schedules: items,
  };
}

// ==========================================
// Correction Hook Re-exports
// ==========================================
export {
  correctAttendanceRecord,
  getCorrectionHistory,
  verifyCorrectionAccess,
  calculateCalendarDaysDiff,
  CorrectionValidationError,
  CorrectionAuthorizationError,
} from './correctionService';
export type {
  CorrectionWindow,
  CorrectionEligibilityResult,
  CheckCorrectionParams,
  CorrectAttendanceInput,
} from './correctionService';

