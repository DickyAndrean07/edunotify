import { db } from '@/db';
import {
  schools,
  users,
  classes,
  students,
  classEnrollments,
  attendanceSessions,
  attendanceRecords,
  teachingSchedules,
  academicCalendars,
  earlyWarningLogs,
} from '@/db/schema';
import { eq, and, sql, asc, desc, inArray, gte, lte } from 'drizzle-orm';
import { checkAcademicCalendar } from './attendanceService';

// ==========================================
// 1. CONSTANTS & DATE VALIDATION
// ==========================================

export const MAX_EXPORT_DAYS = 366; // Maksimal 1 tahun ajaran (DoD Keamanan)

export class ReportDateRangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportDateRangeError';
  }
}

/**
 * Validasi rentang tanggal query & ekspor agar tidak melebihi 1 tahun ajaran (366 hari)
 * Mencegah Denial of Service / Out-of-Memory pada server VPS
 */
export function validateDateRange(
  startDateStr: string,
  endDateStr: string,
  maxDays = MAX_EXPORT_DAYS
): { startDate: string; endDate: string; diffDays: number } {
  if (!startDateStr || !endDateStr) {
    throw new ReportDateRangeError('Tanggal mulai dan tanggal akhir wajib diisi.');
  }

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ReportDateRangeError('Format tanggal tidak valid. Gunakan format YYYY-MM-DD.');
  }

  if (start > end) {
    throw new ReportDateRangeError('Tanggal mulai tidak boleh lebih besar dari tanggal akhir.');
  }

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  if (diffDays > maxDays) {
    throw new ReportDateRangeError(
      `Rentang tanggal melebihi batas maksimal ${maxDays} hari (1 tahun ajaran). Permintaan Anda: ${diffDays} hari.`
    );
  }

  return {
    startDate: startDateStr,
    endDate: endDateStr,
    diffDays,
  };
}

// ==========================================
// 2. TYPES
// ==========================================

export interface ClassDailyCompleteness {
  classId: string;
  className: string;
  gradeLevel: string;
  homeroomTeacherName: string | null;
  scheduledPeriodsCount: number;
  sessionStatus: 'SUBMITTED' | 'DRAFT' | 'UNCOMPLETED_ALERT' | 'NOT_STARTED';
  submittedByTeacherName: string | null;
  submittedAt: Date | null;
  isLateSubmission: boolean;
  totalStudents: number;
  presentCount: number;
  sickCount: number;
  permitCount: number;
  alpaCount: number;
  unrecordedCount: number;
  isCompleted: boolean;
  isAlert: boolean;
}

export interface AdminDailyCompletenessOverview {
  date: string;
  isHoliday: boolean;
  holidayDescription: string | null;
  currentTime: string;
  summary: {
    totalClasses: number;
    completedClasses: number;
    uncompletedClasses: number;
    alertClasses: number;
    completenessRate: number; // 0 - 100%
    totalStudentsEnrolled: number;
    totalPresent: number;
    totalSick: number;
    totalPermit: number;
    totalAlpa: number;
    attendanceRate: number; // 0 - 100%
  };
  classes: ClassDailyCompleteness[];
}

export interface DailyAttendanceTrend {
  date: string;
  dayOfWeek: number;
  hadirCount: number;
  sakitCount: number;
  izinCount: number;
  alpaCount: number;
  totalRecorded: number;
  attendanceRate: number;
  isHoliday: boolean;
  holidayDescription?: string | null;
}

export interface ClassAttendanceComparison {
  classId: string;
  className: string;
  gradeLevel: string;
  homeroomTeacherName: string | null;
  studentCount: number;
  hadirCount: number;
  sakitCount: number;
  izinCount: number;
  alpaCount: number;
  totalRecords: number;
  attendanceRate: number; // (hadir / total) * 100
  alpaRate: number; // (alpa / total) * 100
  atRiskStudentsCount: number;
  rank: number;
}

export interface SchoolAttendanceSummary {
  schoolId: string;
  startDate: string;
  endDate: string;
  overallStats: {
    totalActiveDays: number;
    totalEnrolledStudents: number;
    overallAttendanceRate: number;
    totalHadir: number;
    totalSakit: number;
    totalIzin: number;
    totalAlpa: number;
    totalRecords: number;
  };
  dailyTrend: DailyAttendanceTrend[];
  classComparisons: ClassAttendanceComparison[];
}

export interface StudentReportSummary {
  studentId: string;
  nis: string;
  nisn: string | null;
  name: string;
  gender: string;
  className: string;
  totalDaysRecorded: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  unrecorded: number;
  attendanceRate: number;
}

export interface DetailedAttendanceLog {
  id: string;
  date: string;
  classId: string;
  className: string;
  studentId: string;
  nis: string;
  studentName: string;
  gender: string;
  status: 'PRESENT' | 'SICK' | 'PERMIT' | 'ABSENT_ALPA' | 'UNRECORDED';
  notes: string | null;
  submittedByTeacherName: string | null;
  submittedAt: Date | null;
}

export interface AttendanceReportFilterParams {
  startDate: string;
  endDate: string;
  classId?: string;
  studentId?: string;
  status?: string;
}

export interface AttendanceReportData {
  school: {
    id: string;
    name: string;
    npsn: string;
    address: string | null;
    principalName: string | null;
  };
  filter: {
    startDate: string;
    endDate: string;
    classId: string | null;
    className: string | null;
    studentId: string | null;
    studentName: string | null;
    status: string | null;
  };
  summary: {
    totalRecords: number;
    totalStudents: number;
    totalHadir: number;
    totalSakit: number;
    totalIzin: number;
    totalAlpa: number;
    attendancePercentage: number;
  };
  students: StudentReportSummary[];
  logs: DetailedAttendanceLog[];
  generatedAt: string;
}

// ==========================================
// 3. ADMIN COMPLETENESS QUERY
// ==========================================

function getCurrentTimeHHmm(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getDayOfWeek(dateStr: string): number {
  const d = new Date(dateStr);
  const jsDay = d.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

/**
 * Mendapatkan indikator kelengkapan presensi harian seluruh kelas untuk Admin Sekolah (DoD 2)
 */
export async function getDailyAttendanceCompleteness(
  schoolId: string,
  dateStr?: string,
  currentTimeParam?: string
): Promise<AdminDailyCompletenessOverview> {
  const targetDate = dateStr || new Date().toISOString().split('T')[0];
  const currentTime = currentTimeParam || getCurrentTimeHHmm();
  const dayOfWeek = getDayOfWeek(targetDate);

  // 1. Cek kalender akademik
  const cal = await checkAcademicCalendar(schoolId, targetDate);

  // 2. Ambil seluruh kelas aktif di sekolah beserta wali kelas
  const classRows = await db
    .select({
      classId: classes.id,
      className: classes.name,
      gradeLevel: classes.gradeLevel,
      homeroomTeacherName: users.name,
    })
    .from(classes)
    .leftJoin(users, eq(classes.homeroomTeacherId, users.id))
    .where(eq(classes.schoolId, schoolId))
    .orderBy(asc(classes.gradeLevel), asc(classes.name));

  if (classRows.length === 0) {
    return {
      date: targetDate,
      isHoliday: cal.isHoliday,
      holidayDescription: cal.description || null,
      currentTime,
      summary: {
        totalClasses: 0,
        completedClasses: 0,
        uncompletedClasses: 0,
        alertClasses: 0,
        completenessRate: 0,
        totalStudentsEnrolled: 0,
        totalPresent: 0,
        totalSick: 0,
        totalPermit: 0,
        totalAlpa: 0,
        attendanceRate: 0,
      },
      classes: [],
    };
  }

  const classIds = classRows.map((c) => c.classId);

  // 3. Ambil jadwal hari ini untuk seluruh kelas
  const schedules = await db
    .select({
      classId: teachingSchedules.classId,
      periodOrder: teachingSchedules.periodOrder,
      startTime: teachingSchedules.startTime,
      endTime: teachingSchedules.endTime,
    })
    .from(teachingSchedules)
    .where(
      and(
        eq(teachingSchedules.schoolId, schoolId),
        inArray(teachingSchedules.classId, classIds),
        eq(teachingSchedules.dayOfWeek, dayOfWeek)
      )
    )
    .orderBy(asc(teachingSchedules.periodOrder));

  // 4. Ambil session presensi tanggal hari ini
  const sessions = await db
    .select({
      sessionId: attendanceSessions.id,
      classId: attendanceSessions.classId,
      status: attendanceSessions.status,
      submittedByTeacherId: attendanceSessions.submittedByTeacherId,
      submittedAt: attendanceSessions.submittedAt,
      isLateSubmission: attendanceSessions.isLateSubmission,
      submitterName: users.name,
    })
    .from(attendanceSessions)
    .leftJoin(users, eq(attendanceSessions.submittedByTeacherId, users.id))
    .where(
      and(
        eq(attendanceSessions.schoolId, schoolId),
        inArray(attendanceSessions.classId, classIds),
        eq(attendanceSessions.date, targetDate)
      )
    );

  const sessionMap = new Map<string, (typeof sessions)[0]>();
  for (const s of sessions) {
    sessionMap.set(s.classId, s);
  }

  // 5. Ambil data enrollment siswa per kelas
  const enrollments = await db
    .select({
      classId: classEnrollments.classId,
      studentId: classEnrollments.studentId,
    })
    .from(classEnrollments)
    .innerJoin(students, eq(classEnrollments.studentId, students.id))
    .where(
      and(
        eq(classEnrollments.schoolId, schoolId),
        inArray(classEnrollments.classId, classIds),
        eq(students.isActive, true)
      )
    );

  const enrollmentMap = new Map<string, number>();
  for (const e of enrollments) {
    enrollmentMap.set(e.classId, (enrollmentMap.get(e.classId) || 0) + 1);
  }

  // 6. Ambil records presensi jika ada session
  const sessionIds = sessions.map((s) => s.sessionId);
  let recordRows: Array<{ sessionId: string; status: string }> = [];
  if (sessionIds.length > 0) {
    recordRows = await db
      .select({
        sessionId: attendanceRecords.sessionId,
        status: attendanceRecords.status,
      })
      .from(attendanceRecords)
      .where(inArray(attendanceRecords.sessionId, sessionIds));
  }

  const recordsBySession = new Map<
    string,
    { present: number; sick: number; permit: number; alpa: number; unrecorded: number }
  >();
  for (const r of recordRows) {
    if (!recordsBySession.has(r.sessionId)) {
      recordsBySession.set(r.sessionId, {
        present: 0,
        sick: 0,
        permit: 0,
        alpa: 0,
        unrecorded: 0,
      });
    }
    const c = recordsBySession.get(r.sessionId)!;
    if (r.status === 'PRESENT') c.present++;
    else if (r.status === 'SICK') c.sick++;
    else if (r.status === 'PERMIT') c.permit++;
    else if (r.status === 'ABSENT_ALPA') c.alpa++;
    else c.unrecorded++;
  }

  // 7. Hitung kelengkapan per kelas
  const resultClasses: ClassDailyCompleteness[] = [];
  let completedClasses = 0;
  let uncompletedClasses = 0;
  let alertClasses = 0;
  let totalStudentsEnrolled = 0;
  let totalPresent = 0;
  let totalSick = 0;
  let totalPermit = 0;
  let totalAlpa = 0;

  for (const cls of classRows) {
    const classSchedules = schedules.filter((s) => s.classId === cls.classId);
    const session = sessionMap.get(cls.classId);
    const totalStudentsInClass = enrollmentMap.get(cls.classId) || 0;
    totalStudentsEnrolled += totalStudentsInClass;

    const latestScheduleEndTime =
      classSchedules.length > 0
        ? classSchedules[classSchedules.length - 1].endTime
        : null;

    let sessionStatus: 'SUBMITTED' | 'DRAFT' | 'UNCOMPLETED_ALERT' | 'NOT_STARTED' =
      'NOT_STARTED';

    if (session) {
      if (session.status === 'SUBMITTED') sessionStatus = 'SUBMITTED';
      else if (session.status === 'UNCOMPLETED_ALERT')
        sessionStatus = 'UNCOMPLETED_ALERT';
      else sessionStatus = 'DRAFT';
    } else {
      // Jika belum ada session sama sekali, tapi KBM usai atau sudah jam 12
      if (!cal.isHoliday && classSchedules.length > 0) {
        if (latestScheduleEndTime && currentTime > latestScheduleEndTime) {
          sessionStatus = 'UNCOMPLETED_ALERT';
        }
      }
    }

    const recCounts = session
      ? recordsBySession.get(session.sessionId) || {
          present: 0,
          sick: 0,
          permit: 0,
          alpa: 0,
          unrecorded: 0,
        }
      : {
          present: 0,
          sick: 0,
          permit: 0,
          alpa: 0,
          unrecorded: totalStudentsInClass,
        };

    const isCompleted = sessionStatus === 'SUBMITTED';
    const isAlert =
      sessionStatus === 'UNCOMPLETED_ALERT' ||
      (!cal.isHoliday &&
        classSchedules.length > 0 &&
        !isCompleted &&
        currentTime >= '12:00');

    if (isCompleted) {
      completedClasses++;
      totalPresent += recCounts.present;
      totalSick += recCounts.sick;
      totalPermit += recCounts.permit;
      totalAlpa += recCounts.alpa;
    } else {
      uncompletedClasses++;
      if (isAlert) alertClasses++;
    }

    resultClasses.push({
      classId: cls.classId,
      className: cls.className,
      gradeLevel: cls.gradeLevel,
      homeroomTeacherName: cls.homeroomTeacherName,
      scheduledPeriodsCount: classSchedules.length,
      sessionStatus,
      submittedByTeacherName: session?.submitterName || null,
      submittedAt: session?.submittedAt || null,
      isLateSubmission: session?.isLateSubmission || false,
      totalStudents: totalStudentsInClass,
      presentCount: recCounts.present,
      sickCount: recCounts.sick,
      permitCount: recCounts.permit,
      alpaCount: recCounts.alpa,
      unrecordedCount: recCounts.unrecorded,
      isCompleted,
      isAlert,
    });
  }

  const totalClasses = classRows.length;
  const completenessRate =
    totalClasses > 0 ? (completedClasses / totalClasses) * 100 : 0;
  const totalRecordedAttendance =
    totalPresent + totalSick + totalPermit + totalAlpa;
  const attendanceRate =
    totalRecordedAttendance > 0
      ? (totalPresent / totalRecordedAttendance) * 100
      : 0;

  return {
    date: targetDate,
    isHoliday: cal.isHoliday,
    holidayDescription: cal.description || null,
    currentTime,
    summary: {
      totalClasses,
      completedClasses,
      uncompletedClasses,
      alertClasses,
      completenessRate: Number(completenessRate.toFixed(1)),
      totalStudentsEnrolled,
      totalPresent,
      totalSick,
      totalPermit,
      totalAlpa,
      attendanceRate: Number(attendanceRate.toFixed(1)),
    },
    classes: resultClasses,
  };
}

// ==========================================
// 4. PRINCIPAL & AGGREGATE SUMMARY
// ==========================================

/**
 * Ringkasan Agregat Kehadiran Sekolah untuk Dashboard Kepala Sekolah (DoD 1)
 */
export async function getSchoolAttendanceSummary(
  schoolId: string,
  params: {
    startDate: string;
    endDate: string;
    classId?: string;
  }
): Promise<SchoolAttendanceSummary> {
  const { startDate, endDate } = validateDateRange(
    params.startDate,
    params.endDate
  );

  // 1. Ambil semua kelas di sekolah
  const classQuery = db
    .select({
      id: classes.id,
      name: classes.name,
      gradeLevel: classes.gradeLevel,
      homeroomTeacherName: users.name,
    })
    .from(classes)
    .leftJoin(users, eq(classes.homeroomTeacherId, users.id))
    .where(
      params.classId
        ? and(eq(classes.schoolId, schoolId), eq(classes.id, params.classId))
        : eq(classes.schoolId, schoolId)
    )
    .orderBy(asc(classes.gradeLevel), asc(classes.name));

  const schoolClasses = await classQuery;
  const classIds = schoolClasses.map((c) => c.id);

  if (classIds.length === 0) {
    return {
      schoolId,
      startDate,
      endDate,
      overallStats: {
        totalActiveDays: 0,
        totalEnrolledStudents: 0,
        overallAttendanceRate: 0,
        totalHadir: 0,
        totalSakit: 0,
        totalIzin: 0,
        totalAlpa: 0,
        totalRecords: 0,
      },
      dailyTrend: [],
      classComparisons: [],
    };
  }

  // 2. Ambil kalender dalam rentang tanggal
  const calendarRows = await db
    .select({
      date: academicCalendars.date,
      dayType: academicCalendars.dayType,
      description: academicCalendars.description,
    })
    .from(academicCalendars)
    .where(
      and(
        eq(academicCalendars.schoolId, schoolId),
        gte(academicCalendars.date, startDate),
        lte(academicCalendars.date, endDate)
      )
    );

  const calMap = new Map<string, { dayType: string; description: string | null }>();
  for (const cal of calendarRows) {
    calMap.set(cal.date, { dayType: cal.dayType, description: cal.description });
  }

  // 3. Ambil data enrollment siswa per kelas
  const enrollments = await db
    .select({
      classId: classEnrollments.classId,
      studentId: classEnrollments.studentId,
    })
    .from(classEnrollments)
    .innerJoin(students, eq(classEnrollments.studentId, students.id))
    .where(
      and(
        eq(classEnrollments.schoolId, schoolId),
        inArray(classEnrollments.classId, classIds),
        eq(students.isActive, true)
      )
    );

  const enrollmentCountByClass = new Map<string, number>();
  for (const e of enrollments) {
    enrollmentCountByClass.set(
      e.classId,
      (enrollmentCountByClass.get(e.classId) || 0) + 1
    );
  }
  const totalEnrolledStudents = enrollments.length;

  // 4. Ambil sessions presensi dalam rentang tanggal (status SUBMITTED)
  const sessions = await db
    .select({
      id: attendanceSessions.id,
      classId: attendanceSessions.classId,
      date: attendanceSessions.date,
    })
    .from(attendanceSessions)
    .where(
      and(
        eq(attendanceSessions.schoolId, schoolId),
        inArray(attendanceSessions.classId, classIds),
        gte(attendanceSessions.date, startDate),
        lte(attendanceSessions.date, endDate),
        eq(attendanceSessions.status, 'SUBMITTED')
      )
    );

  const sessionIds = sessions.map((s) => s.id);

  // 5. Ambil records presensi
  let records: Array<{
    sessionId: string;
    studentId: string;
    status: string;
  }> = [];

  if (sessionIds.length > 0) {
    records = await db
      .select({
        sessionId: attendanceRecords.sessionId,
        studentId: attendanceRecords.studentId,
        status: attendanceRecords.status,
      })
      .from(attendanceRecords)
      .where(inArray(attendanceRecords.sessionId, sessionIds));
  }

  // Map session to class and date
  const sessionToClassAndDate = new Map<string, { classId: string; date: string }>();
  for (const s of sessions) {
    sessionToClassAndDate.set(s.id, { classId: s.classId, date: s.date });
  }

  // Aggregate by date and by class
  const dailyAggregation = new Map<
    string,
    { hadir: number; sakit: number; izin: number; alpa: number; total: number }
  >();

  const classAggregation = new Map<
    string,
    { hadir: number; sakit: number; izin: number; alpa: number; total: number }
  >();

  for (const cls of schoolClasses) {
    classAggregation.set(cls.id, { hadir: 0, sakit: 0, izin: 0, alpa: 0, total: 0 });
  }

  let totalHadir = 0;
  let totalSakit = 0;
  let totalIzin = 0;
  let totalAlpa = 0;

  for (const r of records) {
    const meta = sessionToClassAndDate.get(r.sessionId);
    if (!meta) continue;

    // Daily
    if (!dailyAggregation.has(meta.date)) {
      dailyAggregation.set(meta.date, {
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpa: 0,
        total: 0,
      });
    }
    const dayStat = dailyAggregation.get(meta.date)!;

    // Class
    const clsStat = classAggregation.get(meta.classId);

    if (r.status === 'PRESENT') {
      dayStat.hadir++;
      dayStat.total++;
      if (clsStat) {
        clsStat.hadir++;
        clsStat.total++;
      }
      totalHadir++;
    } else if (r.status === 'SICK') {
      dayStat.sakit++;
      dayStat.total++;
      if (clsStat) {
        clsStat.sakit++;
        clsStat.total++;
      }
      totalSakit++;
    } else if (r.status === 'PERMIT') {
      dayStat.izin++;
      dayStat.total++;
      if (clsStat) {
        clsStat.izin++;
        clsStat.total++;
      }
      totalIzin++;
    } else if (r.status === 'ABSENT_ALPA') {
      dayStat.alpa++;
      dayStat.total++;
      if (clsStat) {
        clsStat.alpa++;
        clsStat.total++;
      }
      totalAlpa++;
    }
  }

  // 6. Buat rangkaian dailyTrend untuk setiap hari dalam rentang tanggal
  const dailyTrend: DailyAttendanceTrend[] = [];
  const curDate = new Date(startDate);
  const stopDate = new Date(endDate);

  let activeDaysCount = 0;

  while (curDate <= stopDate) {
    const dStr = curDate.toISOString().split('T')[0];
    const jsDay = curDate.getDay();
    const dow = jsDay === 0 ? 7 : jsDay;

    const calInfo = calMap.get(dStr);
    const isHoliday = calInfo
      ? calInfo.dayType === 'HOLIDAY'
      : dow === 7; // Default Minggu libur

    if (!isHoliday) activeDaysCount++;

    const stat = dailyAggregation.get(dStr) || {
      hadir: 0,
      sakit: 0,
      izin: 0,
      alpa: 0,
      total: 0,
    };

    const attRate = stat.total > 0 ? (stat.hadir / stat.total) * 100 : 0;

    dailyTrend.push({
      date: dStr,
      dayOfWeek: dow,
      hadirCount: stat.hadir,
      sakitCount: stat.sakit,
      izinCount: stat.izin,
      alpaCount: stat.alpa,
      totalRecorded: stat.total,
      attendanceRate: Number(attRate.toFixed(1)),
      isHoliday,
      holidayDescription: calInfo?.description || (dow === 7 ? 'Hari Minggu' : null),
    });

    curDate.setDate(curDate.getDate() + 1);
  }

  // 7. Ambil early warning logs untuk siswa berisiko per kelas
  const ewsLogs = await db
    .select({
      studentId: earlyWarningLogs.studentId,
      classId: classEnrollments.classId,
    })
    .from(earlyWarningLogs)
    .innerJoin(
      classEnrollments,
      eq(earlyWarningLogs.studentId, classEnrollments.studentId)
    )
    .where(
      and(
        eq(earlyWarningLogs.schoolId, schoolId),
        inArray(classEnrollments.classId, classIds)
      )
    );

  const atRiskByClass = new Map<string, Set<string>>();
  for (const log of ewsLogs) {
    if (!atRiskByClass.has(log.classId)) {
      atRiskByClass.set(log.classId, new Set<string>());
    }
    atRiskByClass.get(log.classId)!.add(log.studentId);
  }

  // 8. Bentuk daftar komparasi kelas
  const classComparisons: ClassAttendanceComparison[] = schoolClasses.map(
    (cls) => {
      const stat = classAggregation.get(cls.id) || {
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpa: 0,
        total: 0,
      };
      const attRate = stat.total > 0 ? (stat.hadir / stat.total) * 100 : 0;
      const alpaRate = stat.total > 0 ? (stat.alpa / stat.total) * 100 : 0;
      const atRiskSet = atRiskByClass.get(cls.id);

      return {
        classId: cls.id,
        className: cls.name,
        gradeLevel: cls.gradeLevel,
        homeroomTeacherName: cls.homeroomTeacherName,
        studentCount: enrollmentCountByClass.get(cls.id) || 0,
        hadirCount: stat.hadir,
        sakitCount: stat.sakit,
        izinCount: stat.izin,
        alpaCount: stat.alpa,
        totalRecords: stat.total,
        attendanceRate: Number(attRate.toFixed(1)),
        alpaRate: Number(alpaRate.toFixed(1)),
        atRiskStudentsCount: atRiskSet ? atRiskSet.size : 0,
        rank: 1, // Diupdate setelah sorting
      };
    }
  );

  // Sort descending berdasarkan attendanceRate, lalu beri rank
  classComparisons.sort((a, b) => b.attendanceRate - a.attendanceRate);
  classComparisons.forEach((cls, idx) => {
    cls.rank = idx + 1;
  });

  const totalRecords = totalHadir + totalSakit + totalIzin + totalAlpa;
  const overallAttendanceRate =
    totalRecords > 0 ? (totalHadir / totalRecords) * 100 : 0;

  return {
    schoolId,
    startDate,
    endDate,
    overallStats: {
      totalActiveDays: activeDaysCount,
      totalEnrolledStudents,
      overallAttendanceRate: Number(overallAttendanceRate.toFixed(1)),
      totalHadir,
      totalSakit,
      totalIzin,
      totalAlpa,
      totalRecords,
    },
    dailyTrend,
    classComparisons,
  };
}

// ==========================================
// 5. REPORT DATA QUERY (MULTI-DIMENSIONAL FILTER)
// ==========================================

/**
 * Mendapatkan data laporan presensi lengkap dengan filter multi-dimensi (DoD 3, 4, 5)
 */
export async function getAttendanceReportData(
  schoolId: string,
  params: AttendanceReportFilterParams
): Promise<AttendanceReportData> {
  const { startDate, endDate } = validateDateRange(
    params.startDate,
    params.endDate
  );

  // 1. Data Sekolah & Kepala Sekolah
  const [school] = await db
    .select({
      id: schools.id,
      name: schools.name,
      npsn: schools.npsn,
      address: schools.address,
    })
    .from(schools)
    .where(eq(schools.id, schoolId));

  if (!school) {
    throw new Error('Sekolah tidak ditemukan.');
  }

  const [principalUser] = await db
    .select({ name: users.name })
    .from(users)
    .where(
      and(
        eq(users.schoolId, schoolId),
        eq(users.role, 'KEPALA_SEKOLAH'),
        eq(users.isActive, true)
      )
    )
    .limit(1);

  // 2. Filter metadata (Nama Kelas, Nama Siswa jika difilter)
  let filterClassName: string | null = null;
  if (params.classId) {
    const [c] = await db
      .select({ name: classes.name })
      .from(classes)
      .where(and(eq(classes.id, params.classId), eq(classes.schoolId, schoolId)));
    if (c) filterClassName = c.name;
  }

  let filterStudentName: string | null = null;
  if (params.studentId) {
    const [st] = await db
      .select({ name: students.name })
      .from(students)
      .where(and(eq(students.id, params.studentId), eq(students.schoolId, schoolId)));
    if (st) filterStudentName = st.name;
  }

  // 3. Query Siswa yang Terdaftar
  const enrollQuery = db
    .select({
      studentId: students.id,
      nis: students.nis,
      nisn: students.nisn,
      name: students.name,
      gender: students.gender,
      classId: classes.id,
      className: classes.name,
    })
    .from(classEnrollments)
    .innerJoin(students, eq(classEnrollments.studentId, students.id))
    .innerJoin(classes, eq(classEnrollments.classId, classes.id))
    .where(
      and(
        eq(classEnrollments.schoolId, schoolId),
        eq(students.isActive, true),
        params.classId ? eq(classes.id, params.classId) : sql`1=1`,
        params.studentId ? eq(students.id, params.studentId) : sql`1=1`
      )
    )
    .orderBy(asc(classes.name), asc(students.name));

  const enrolledStudents = await enrollQuery;
  const studentIds = enrolledStudents.map((s) => s.studentId);

  if (studentIds.length === 0) {
    return {
      school: {
        id: school.id,
        name: school.name,
        npsn: school.npsn,
        address: school.address,
        principalName: principalUser?.name || null,
      },
      filter: {
        startDate,
        endDate,
        classId: params.classId || null,
        className: filterClassName,
        studentId: params.studentId || null,
        studentName: filterStudentName,
        status: params.status || null,
      },
      summary: {
        totalRecords: 0,
        totalStudents: 0,
        totalHadir: 0,
        totalSakit: 0,
        totalIzin: 0,
        totalAlpa: 0,
        attendancePercentage: 0,
      },
      students: [],
      logs: [],
      generatedAt: new Date().toISOString(),
    };
  }

  // 4. Query Attendance Records dalam rentang tanggal
  const recordsQuery = db
    .select({
      recordId: attendanceRecords.id,
      studentId: attendanceRecords.studentId,
      status: attendanceRecords.status,
      notes: attendanceRecords.notes,
      sessionDate: attendanceSessions.date,
      sessionClassId: attendanceSessions.classId,
      submittedAt: attendanceSessions.submittedAt,
      teacherName: users.name,
    })
    .from(attendanceRecords)
    .innerJoin(
      attendanceSessions,
      eq(attendanceRecords.sessionId, attendanceSessions.id)
    )
    .leftJoin(users, eq(attendanceSessions.submittedByTeacherId, users.id))
    .where(
      and(
        eq(attendanceRecords.schoolId, schoolId),
        inArray(attendanceRecords.studentId, studentIds),
        gte(attendanceSessions.date, startDate),
        lte(attendanceSessions.date, endDate),
        eq(attendanceSessions.status, 'SUBMITTED'),
        params.status
          ? eq(
              attendanceRecords.status,
              params.status as
                | 'PRESENT'
                | 'SICK'
                | 'PERMIT'
                | 'ABSENT_ALPA'
                | 'UNRECORDED'
            )
          : sql`1=1`
      )
    )
    .orderBy(desc(attendanceSessions.date), asc(attendanceRecords.id));

  const recordRows = await recordsQuery;

  // 5. Hitung Agregat Siswa
  const studentStatMap = new Map<
    string,
    {
      hadir: number;
      sakit: number;
      izin: number;
      alpa: number;
      unrecorded: number;
      totalDays: number;
    }
  >();

  for (const st of enrolledStudents) {
    studentStatMap.set(st.studentId, {
      hadir: 0,
      sakit: 0,
      izin: 0,
      alpa: 0,
      unrecorded: 0,
      totalDays: 0,
    });
  }

  const logs: DetailedAttendanceLog[] = [];
  const studentMetaMap = new Map(
    enrolledStudents.map((s) => [s.studentId, s])
  );

  let totalHadir = 0;
  let totalSakit = 0;
  let totalIzin = 0;
  let totalAlpa = 0;

  for (const r of recordRows) {
    const stMeta = studentMetaMap.get(r.studentId);
    if (!stMeta) continue;

    const stat = studentStatMap.get(r.studentId)!;
    stat.totalDays++;

    if (r.status === 'PRESENT') {
      stat.hadir++;
      totalHadir++;
    } else if (r.status === 'SICK') {
      stat.sakit++;
      totalSakit++;
    } else if (r.status === 'PERMIT') {
      stat.izin++;
      totalIzin++;
    } else if (r.status === 'ABSENT_ALPA') {
      stat.alpa++;
      totalAlpa++;
    } else {
      stat.unrecorded++;
    }

    logs.push({
      id: r.recordId,
      date: r.sessionDate,
      classId: r.sessionClassId,
      className: stMeta.className,
      studentId: stMeta.studentId,
      nis: stMeta.nis,
      studentName: stMeta.name,
      gender: stMeta.gender,
      status: r.status as DetailedAttendanceLog['status'],
      notes: r.notes,
      submittedByTeacherName: r.teacherName || null,
      submittedAt: r.submittedAt,
    });
  }

  // Bentuk student summaries
  const studentSummaries: StudentReportSummary[] = enrolledStudents.map((st) => {
    const stat = studentStatMap.get(st.studentId)!;
    const totalRecorded = stat.hadir + stat.sakit + stat.izin + stat.alpa;
    const attRate =
      totalRecorded > 0 ? (stat.hadir / totalRecorded) * 100 : 0;

    return {
      studentId: st.studentId,
      nis: st.nis,
      nisn: st.nisn,
      name: st.name,
      gender: st.gender,
      className: st.className,
      totalDaysRecorded: stat.totalDays,
      hadir: stat.hadir,
      sakit: stat.sakit,
      izin: stat.izin,
      alpa: stat.alpa,
      unrecorded: stat.unrecorded,
      attendanceRate: Number(attRate.toFixed(1)),
    };
  });

  const totalRecords = totalHadir + totalSakit + totalIzin + totalAlpa;
  const overallPercentage =
    totalRecords > 0 ? (totalHadir / totalRecords) * 100 : 0;

  return {
    school: {
      id: school.id,
      name: school.name,
      npsn: school.npsn,
      address: school.address,
      principalName: principalUser?.name || null,
    },
    filter: {
      startDate,
      endDate,
      classId: params.classId || null,
      className: filterClassName,
      studentId: params.studentId || null,
      studentName: filterStudentName,
      status: params.status || null,
    },
    summary: {
      totalRecords,
      totalStudents: enrolledStudents.length,
      totalHadir,
      totalSakit,
      totalIzin,
      totalAlpa,
      attendancePercentage: Number(overallPercentage.toFixed(1)),
    },
    students: studentSummaries,
    logs,
    generatedAt: new Date().toISOString(),
  };
}
