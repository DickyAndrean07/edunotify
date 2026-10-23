'use server';

import { getSession } from '@/lib/auth/session';
import { db } from '@/db';
import {
  classes,
  schools,
  users,
  students,
  classEnrollments,
  attendanceSessions,
  attendanceRecords,
  academicYears,
} from '@/db/schema';
import { AttendanceStatus } from '@/components/homeroom/types';
import { eq, and, asc, desc, inArray } from 'drizzle-orm';
import {
  calculateClassAttendanceOverview,
  ClassAttendanceOverview,
} from '@/services/attendanceService';
import {
  generateWhatsAppUrl,
  recordWhatsAppOpened,
  markAsContacted,
  getInterventionStatuses,
  sanitizePhoneNumber,
  InterventionStatus,
} from '@/services/whatsappService';
import {
  correctAttendanceRecord,
  getCorrectionHistory,
  verifyCorrectionAccess,
  CorrectionEligibilityResult,
} from '@/services/correctionService';
import { evaluateClassEWS } from '@/services/earlyWarningService';
import { revalidatePath } from 'next/cache';

export interface AlpaStudentItem {
  attendanceRecordId: string;
  studentId: string;
  nis: string;
  name: string;
  gender: string;
  guardianName: string | null;
  guardianPhone: string | null;
  sanitizedPhone: string | null;
  whatsAppUrl: string | null;
  interventionStatus: InterventionStatus;
  interventionLabel: string;
  interventionUpdatedAt?: Date | string;
  isMultiStudentContact: boolean;
  sharedWithStudents: string[];
}

export interface ClassStudentAttendanceItem {
  studentId: string;
  nis: string;
  name: string;
  gender: string;
  guardianName: string | null;
  guardianPhone: string | null;
  attendanceRecordId: string | null;
  status: AttendanceStatus;
  notes: string | null;
  correctionEligibility?: CorrectionEligibilityResult;
}

export interface HomeroomDashboardData {
  school: {
    id: string;
    name: string;
  };
  classInfo: {
    id: string;
    name: string;
    gradeLevel: string;
    homeroomTeacherId: string | null;
    homeroomTeacherName: string | null;
  };
  currentUser: {
    id: string;
    name: string;
    role: string;
    isHomeroom: boolean;
  };
  date: string;
  overview: ClassAttendanceOverview;
  alpaStudents: AlpaStudentItem[];
  allStudents: ClassStudentAttendanceItem[];
}

/**
 * Helper to authenticate and verify user role (WALI_KELAS or ADMIN_SEKOLAH)
 */
async function requireHomeroomOrAdminSession() {
  const session = await getSession();
  if (
    !session ||
    (session.role !== 'WALI_KELAS' && session.role !== 'ADMIN_SEKOLAH')
  ) {
    throw new Error('Akses ditolak: Anda harus login sebagai Wali Kelas atau Admin Sekolah.');
  }
  return session;
}

/**
 * Verify strict homeroom authorization: Wali kelas can ONLY access their own class.
 * Admin can access any class in their school.
 */
async function verifyClassHomeroomAccess(schoolId: string, classId: string, session: { id: string; role: string }) {
  const [cls] = await db
    .select({
      id: classes.id,
      name: classes.name,
      gradeLevel: classes.gradeLevel,
      homeroomTeacherId: classes.homeroomTeacherId,
      schoolId: classes.schoolId,
    })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.schoolId, schoolId)))
    .limit(1);

  if (!cls) {
    throw new Error('Kelas tidak ditemukan.');
  }

  if (session.role === 'WALI_KELAS') {
    if (!cls.homeroomTeacherId || cls.homeroomTeacherId !== session.id) {
      throw new Error('Akses ditolak: Anda bukan Wali Kelas dari kelas ini.');
    }
  }

  return cls;
}

/**
 * Get classes managed by current user (if Wali Kelas) or all classes in school (if Admin).
 */
export async function getHomeroomClassesAction() {
  const session = await requireHomeroomOrAdminSession();

  if (session.role === 'WALI_KELAS') {
    return await db
      .select({
        id: classes.id,
        name: classes.name,
        gradeLevel: classes.gradeLevel,
        homeroomTeacherId: classes.homeroomTeacherId,
      })
      .from(classes)
      .where(
        and(
          eq(classes.schoolId, session.schoolId),
          eq(classes.homeroomTeacherId, session.id)
        )
      )
      .orderBy(asc(classes.name));
  }

  // Admin Sekolah gets all classes
  return await db
    .select({
      id: classes.id,
      name: classes.name,
      gradeLevel: classes.gradeLevel,
      homeroomTeacherId: classes.homeroomTeacherId,
    })
    .from(classes)
    .where(eq(classes.schoolId, session.schoolId))
    .orderBy(asc(classes.name));
}

/**
 * Load complete Homeroom Dashboard data for a class on a specified date.
 */
export async function getHomeroomDashboardDataAction(
  classId: string,
  dateStr?: string
): Promise<HomeroomDashboardData> {
  const session = await requireHomeroomOrAdminSession();
  const targetDate = dateStr || new Date().toISOString().split('T')[0];

  // 1. Strict Authorization Check
  const cls = await verifyClassHomeroomAccess(session.schoolId, classId, session);

  // 2. Fetch School and Homeroom Teacher Info
  const [school] = await db
    .select({ id: schools.id, name: schools.name })
    .from(schools)
    .where(eq(schools.id, session.schoolId))
    .limit(1);

  let homeroomTeacherName = session.name;
  if (cls.homeroomTeacherId && cls.homeroomTeacherId !== session.id) {
    const [ht] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, cls.homeroomTeacherId))
      .limit(1);
    if (ht) homeroomTeacherName = ht.name;
  }

  // 3. Calculate Overview
  const overview = await calculateClassAttendanceOverview(
    session.schoolId,
    classId,
    targetDate
  );

  // 4. Fetch Enrolled Students
  const enrolledStudents = await db
    .select({
      studentId: students.id,
      nis: students.nis,
      name: students.name,
      gender: students.gender,
      guardianName: students.guardianName,
      guardianPhone: students.guardianPhone,
    })
    .from(classEnrollments)
    .innerJoin(students, eq(classEnrollments.studentId, students.id))
    .where(
      and(
        eq(classEnrollments.classId, classId),
        eq(classEnrollments.schoolId, session.schoolId),
        eq(students.isActive, true)
      )
    )
    .orderBy(asc(students.name));

  // 5. Fetch Session and Attendance Records
  const [sessionRow] = await db
    .select()
    .from(attendanceSessions)
    .where(
      and(
        eq(attendanceSessions.schoolId, session.schoolId),
        eq(attendanceSessions.classId, classId),
        eq(attendanceSessions.date, targetDate)
      )
    )
    .limit(1);

  let recordMap: Record<string, { id: string; status: AttendanceStatus; notes: string | null }> = {};
  if (sessionRow) {
    const records = await db
      .select({
        id: attendanceRecords.id,
        studentId: attendanceRecords.studentId,
        status: attendanceRecords.status,
        notes: attendanceRecords.notes,
      })
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.schoolId, session.schoolId),
          eq(attendanceRecords.sessionId, sessionRow.id)
        )
      );

    for (const r of records) {
      recordMap[r.studentId] = {
        id: r.id,
        status: r.status as AttendanceStatus,
        notes: r.notes,
      };
    }
  }

  // Sibling / Multi-student single contact detection
  // Count how many students share the same normalized phone
  const phoneToStudentsMap = new Map<string, string[]>();
  for (const s of enrolledStudents) {
    if (s.guardianPhone) {
      try {
        const norm = sanitizePhoneNumber(s.guardianPhone);
        const existing = phoneToStudentsMap.get(norm) || [];
        existing.push(s.name);
        phoneToStudentsMap.set(norm, existing);
      } catch {
        // ignore invalid phone for grouping
      }
    }
  }

  // 6. Identify Alpa students and fetch intervention statuses
  const alpaStudentIds: string[] = [];
  const alpaRecordIds: string[] = [];

  for (const s of enrolledStudents) {
    const rec = recordMap[s.studentId];
    if (rec && rec.status === 'ABSENT_ALPA') {
      alpaStudentIds.push(s.studentId);
      alpaRecordIds.push(rec.id);
    }
  }

  const interventionMap = await getInterventionStatuses(
    session.schoolId,
    alpaRecordIds
  );

  const alpaStudents: AlpaStudentItem[] = [];
  const allStudents: ClassStudentAttendanceItem[] = [];

  for (const s of enrolledStudents) {
    const rec = recordMap[s.studentId];
    const currentStatus = rec ? rec.status : 'UNRECORDED';
    const recordId = rec ? rec.id : null;

    let sanitizedPhone: string | null = null;
    let whatsAppUrl: string | null = null;
    let isMultiStudentContact = false;
    let sharedWithStudents: string[] = [];

    if (s.guardianPhone) {
      try {
        sanitizedPhone = sanitizePhoneNumber(s.guardianPhone);
        const shared = phoneToStudentsMap.get(sanitizedPhone) || [];
        if (shared.length > 1) {
          isMultiStudentContact = true;
          sharedWithStudents = shared.filter((name) => name !== s.name);
        }

        whatsAppUrl = generateWhatsAppUrl({
          guardianPhone: s.guardianPhone,
          studentName: s.name,
          className: cls.name,
          schoolName: school?.name || 'Sekolah',
          dateStr: targetDate,
          homeroomTeacherName: homeroomTeacherName || 'Wali Kelas',
        });
      } catch {
        sanitizedPhone = null;
        whatsAppUrl = null;
      }
    }

    if (rec && rec.status === 'ABSENT_ALPA') {
      const followUp = interventionMap[rec.id];
      alpaStudents.push({
        attendanceRecordId: rec.id,
        studentId: s.studentId,
        nis: s.nis,
        name: s.name,
        gender: s.gender,
        guardianName: s.guardianName,
        guardianPhone: s.guardianPhone,
        sanitizedPhone,
        whatsAppUrl,
        interventionStatus: followUp ? followUp.status : 'NOT_OPENED',
        interventionLabel: followUp ? followUp.label : 'Belum Dibuka',
        interventionUpdatedAt: followUp?.updatedAt,
        isMultiStudentContact,
        sharedWithStudents,
      });
    }

    // Check correction eligibility for each record
    let correctionEligibility: CorrectionEligibilityResult | undefined;
    if (rec) {
      correctionEligibility = verifyCorrectionAccess({
        attendanceDate: targetDate,
        userRole: session.role,
        userId: session.id,
        homeroomTeacherId: cls.homeroomTeacherId,
        submittedByTeacherId: sessionRow?.submittedByTeacherId,
      });
    }

    allStudents.push({
      studentId: s.studentId,
      nis: s.nis,
      name: s.name,
      gender: s.gender,
      guardianName: s.guardianName,
      guardianPhone: s.guardianPhone,
      attendanceRecordId: recordId,
      status: currentStatus,
      notes: rec?.notes || null,
      correctionEligibility,
    });
  }

  return {
    school: {
      id: school?.id || session.schoolId,
      name: school?.name || 'Sekolah',
    },
    classInfo: {
      id: cls.id,
      name: cls.name,
      gradeLevel: cls.gradeLevel,
      homeroomTeacherId: cls.homeroomTeacherId,
      homeroomTeacherName,
    },
    currentUser: {
      id: session.id,
      name: session.name,
      role: session.role,
      isHomeroom: cls.homeroomTeacherId === session.id,
    },
    date: targetDate,
    overview,
    alpaStudents,
    allStudents,
  };
}

/**
 * Server Action: Record WhatsApp opened when teacher clicks "Kirim WhatsApp"
 */
export async function recordWhatsAppOpenAction(
  attendanceRecordId: string,
  classId: string
) {
  const session = await requireHomeroomOrAdminSession();
  await verifyClassHomeroomAccess(session.schoolId, classId, session);

  const res = await recordWhatsAppOpened(
    session.schoolId,
    attendanceRecordId,
    session.id
  );

  revalidatePath('/homeroom');
  return { success: true, data: res };
}

/**
 * Server Action: Manually mark student as contacted ('Ditandai Sudah Dihubungi')
 */
export async function markAsContactedAction(
  attendanceRecordId: string,
  classId: string,
  notes?: string
) {
  const session = await requireHomeroomOrAdminSession();
  await verifyClassHomeroomAccess(session.schoolId, classId, session);

  const res = await markAsContacted(
    session.schoolId,
    attendanceRecordId,
    session.id,
    notes
  );

  revalidatePath('/homeroom');
  return { success: true, data: res };
}

/**
 * Server Action: Submit attendance correction with reason and RBAC validation
 */
export async function correctAttendanceAction(params: {
  attendanceRecordId: string;
  classId: string;
  newStatus: AttendanceStatus;
  reason: string;
  currentDate?: string;
}) {
  const session = await requireHomeroomOrAdminSession();
  await verifyClassHomeroomAccess(session.schoolId, params.classId, session);

  const res = await correctAttendanceRecord({
    schoolId: session.schoolId,
    attendanceRecordId: params.attendanceRecordId,
    correctedByUserId: session.id,
    userRole: session.role,
    newStatus: params.newStatus,
    reason: params.reason,
    currentDate: params.currentDate,
  });

  revalidatePath('/homeroom');
  return { success: true, data: res };
}

/**
 * Server Action: Fetch full correction history for an attendance record
 */
export async function getCorrectionHistoryAction(attendanceRecordId: string) {
  const session = await requireHomeroomOrAdminSession();
  return await getCorrectionHistory(session.schoolId, attendanceRecordId);
}

/**
 * Server Action: Fetch Class Early Warning System data
 */
export async function getHomeroomEWSAction(classId: string, asOfDate?: string) {
  const session = await requireHomeroomOrAdminSession();
  await verifyClassHomeroomAccess(session.schoolId, classId, session);
  return await evaluateClassEWS(session.schoolId, classId, asOfDate);
}

