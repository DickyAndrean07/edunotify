import { db } from '@/db';
import {
  earlyWarningLogs,
  students,
  classes,
  attendanceSessions,
  attendanceRecords,
  classEnrollments,
} from '@/db/schema';
import { eq, and, asc, inArray, desc, sql } from 'drizzle-orm';
import {
  EWSCategory,
  EWSSeverity,
  EWSIndicator,
  StudentDailyAttendance,
  StudentEWSInput,
  StudentEWSResult,
  ClassEWSOverview,
} from '@/lib/ai/types';

// ==========================================
// 1. CONFIGURATION & CONSTANTS
// ==========================================

export interface EWSThresholdConfig {
  streakThreshold: number; // default: 2 consecutive days
  streakMinDays: number; // default: 2 active days
  monthlyThreshold: number; // default: 3 days
  monthlyWindowDays: number; // default: 30 calendar days
  monthlyMinDays: number; // default: 14 active days
  dayPatternRatioThreshold: number; // default: 0.70 (70%)
  dayPatternMinAbsences: number; // default: 3
  dayPatternMinDays: number; // default: 21 active days
  trendDropThreshold: number; // default: 15%
  trendDropWindowSize: number; // default: 14 active days per period
  trendDropMinDays: number; // default: 28 active days
  coldStartMinDays: number; // default: 14 active days
}

export const DEFAULT_EWS_CONFIG: EWSThresholdConfig = {
  streakThreshold: 2,
  streakMinDays: 2,
  monthlyThreshold: 3,
  monthlyWindowDays: 30,
  monthlyMinDays: 14,
  dayPatternRatioThreshold: 0.70,
  dayPatternMinAbsences: 3,
  dayPatternMinDays: 21,
  trendDropThreshold: 15,
  trendDropWindowSize: 14,
  trendDropMinDays: 28,
  coldStartMinDays: 14,
};

export const DAY_NAMES: Record<number, string> = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
  7: 'Minggu',
};

// ==========================================
// 2. DETERMINISTIC MATHEMATICAL ENGINE
// ==========================================

/**
 * Pure deterministic calculation of Early Warning System indicators for a single student.
 * 100% mathematical, side-effect free, testable in isolation.
 */
export function calculateStudentEWS(
  input: StudentEWSInput,
  customConfig?: Partial<EWSThresholdConfig>,
  asOfDate?: string
): StudentEWSResult {
  const config: EWSThresholdConfig = { ...DEFAULT_EWS_CONFIG, ...customConfig };

  // Filter to valid active school days (non-unrecorded) and sort ascending by date
  const activeRecords = (input.records || [])
    .filter((r) => r.status && r.status !== 'UNRECORDED')
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalActiveDays = activeRecords.length;

  // Basic counters
  let hadirCount = 0;
  let sakitCount = 0;
  let izinCount = 0;
  let alpaCount = 0;

  for (const rec of activeRecords) {
    if (rec.status === 'PRESENT') hadirCount++;
    else if (rec.status === 'SICK') sakitCount++;
    else if (rec.status === 'PERMIT') izinCount++;
    else if (rec.status === 'ABSENT_ALPA') alpaCount++;
  }

  const attendanceRate = totalActiveDays > 0 ? (hadirCount / totalActiveDays) * 100 : 0;

  // Cold Start Protection Check
  const coldStartProtected = totalActiveDays < config.coldStartMinDays;
  const coldStartMessage = coldStartProtected
    ? 'Data historis belum mencukupi untuk analisis pola kehadiran (minimal 14 hari aktif)'
    : undefined;

  const indicators: EWSIndicator[] = [];

  // ----------------------------------------------------
  // Indicator 1: EWS_ALPA_STREAK
  // Alpa >= 2 hari berturut-turut
  // Syarat Min Data: 2 Hari Aktif
  // Severity: TINGGI
  // ----------------------------------------------------
  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;

  for (let i = activeRecords.length - 1; i >= 0; i--) {
    if (activeRecords[i].status === 'ABSENT_ALPA') {
      currentStreak++;
    } else {
      break;
    }
  }

  for (const rec of activeRecords) {
    if (rec.status === 'ABSENT_ALPA') {
      tempStreak++;
      if (tempStreak > maxStreak) maxStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  const streakHasMinData = totalActiveDays >= config.streakMinDays;
  // Trigger if current streak reaches threshold or max streak reaches threshold
  const streakValue = Math.max(currentStreak, maxStreak);
  const streakTriggered = streakHasMinData && (currentStreak >= config.streakThreshold || maxStreak >= config.streakThreshold);

  indicators.push({
    code: 'EWS_ALPA_STREAK',
    name: 'Alpa Beruntun',
    severity: 'TINGGI',
    triggered: streakTriggered,
    minDataDays: config.streakMinDays,
    value: streakValue,
    threshold: config.streakThreshold,
    unit: 'hari',
    description: `Alpa tercatat sebanyak ${streakValue} hari beruntun (Ambang batas: >= ${config.streakThreshold} hari).`,
    suggestedAction: 'Hubungi ortu hari ini; jadwalkan konfirmasi langsung.',
    details: {
      currentStreak,
      maxStreak,
    },
  });

  // ----------------------------------------------------
  // Indicator 2: EWS_ALPA_MONTHLY
  // Alpa akumulasi >= 3 hari dalam 30 hari kalender
  // Syarat Min Data: 14 Hari Aktif
  // Severity: SEDANG
  // ----------------------------------------------------
  let monthlyAlpaCount = 0;
  let monthlyWindowRecordsCount = 0;

  const refDateStr = asOfDate || (activeRecords.length > 0 ? activeRecords[activeRecords.length - 1].date : new Date().toISOString().split('T')[0]);
  const refDate = new Date(refDateStr);
  const cutoffDate = new Date(refDate.getTime() - config.monthlyWindowDays * 24 * 60 * 60 * 1000);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  for (const rec of activeRecords) {
    if (rec.date >= cutoffStr && rec.date <= refDateStr) {
      monthlyWindowRecordsCount++;
      if (rec.status === 'ABSENT_ALPA') {
        monthlyAlpaCount++;
      }
    }
  }

  const monthlyHasMinData = totalActiveDays >= config.monthlyMinDays && !coldStartProtected;
  const monthlyTriggered = monthlyHasMinData && monthlyAlpaCount >= config.monthlyThreshold;

  indicators.push({
    code: 'EWS_ALPA_MONTHLY',
    name: 'Akumulasi Alpa Bulanan',
    severity: 'SEDANG',
    triggered: monthlyTriggered,
    minDataDays: config.monthlyMinDays,
    value: monthlyAlpaCount,
    threshold: config.monthlyThreshold,
    unit: 'hari',
    description: `Akumulasi Alpa mencapai ${monthlyAlpaCount} hari dalam rentang 30 hari kalender (Ambang batas: >= ${config.monthlyThreshold} hari).`,
    suggestedAction: 'Diskusi empat mata dengan siswa; catat kendala.',
    details: {
      monthlyAlpaCount,
      windowDays: config.monthlyWindowDays,
      recordsInWindow: monthlyWindowRecordsCount,
    },
  });

  // ----------------------------------------------------
  // Indicator 3: EWS_DAY_PATTERN
  // >= 70% ketidakhadiran jatuh pada hari yang sama
  // Syarat Min Data: 21 Hari Aktif
  // Severity: SEDANG
  // ----------------------------------------------------
  const nonPresentRecords = activeRecords.filter(
    (r) => r.status === 'ABSENT_ALPA' || r.status === 'SICK' || r.status === 'PERMIT'
  );
  const totalNonPresent = nonPresentRecords.length;

  let dominantDayNum = 1;
  let dominantDayCount = 0;
  let dominantDayRatio = 0;

  const dayCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  for (const rec of nonPresentRecords) {
    let dow = rec.dayOfWeek;
    if (!dow) {
      // Calculate day of week from date: Sunday = 0, Monday = 1 ... in JS Date
      // Convert to 1 = Senin, ..., 7 = Minggu
      const d = new Date(rec.date);
      const jsDay = d.getDay(); // 0 is Sunday
      dow = jsDay === 0 ? 7 : jsDay;
    }
    dayCounts[dow] = (dayCounts[dow] || 0) + 1;
    if (dayCounts[dow] > dominantDayCount) {
      dominantDayCount = dayCounts[dow];
      dominantDayNum = dow;
    }
  }

  if (totalNonPresent > 0) {
    dominantDayRatio = dominantDayCount / totalNonPresent;
  }

  const patternHasMinData = totalActiveDays >= config.dayPatternMinDays && !coldStartProtected;
  const patternTriggered =
    patternHasMinData &&
    totalNonPresent >= config.dayPatternMinAbsences &&
    dominantDayRatio >= config.dayPatternRatioThreshold;

  const dominantDayName = DAY_NAMES[dominantDayNum] || 'Hari Terkait';
  const patternPercent = Math.round(dominantDayRatio * 100);

  indicators.push({
    code: 'EWS_DAY_PATTERN',
    name: 'Pola Hari Ketidakhadiran',
    severity: 'SEDANG',
    triggered: patternTriggered,
    minDataDays: config.dayPatternMinDays,
    value: patternPercent,
    threshold: Math.round(config.dayPatternRatioThreshold * 100),
    unit: '%',
    description: patternTriggered
      ? `${patternPercent}% ketidakhadiran jatuh pada hari ${dominantDayName} (${dominantDayCount} dari ${totalNonPresent} hari tidak hadir).`
      : `Konsentrasi ketidakhadiran hari tertinggi: ${patternPercent}% pada hari ${dominantDayName}.`,
    suggestedAction: 'Investigasi kendala spesifik hari tersebut bersama BK.',
    details: {
      dominantDay: dominantDayName,
      dominantDayNum,
      dominantDayCount,
      totalNonPresent,
      ratio: dominantDayRatio,
      dayCounts,
    },
  });

  // ----------------------------------------------------
  // Indicator 4: EWS_TREND_DROP
  // Persentase kehadiran turun >= 15% dibandingkan periode sebelumnya
  // Syarat Min Data: 28 Hari Aktif
  // Severity: TINGGI
  // ----------------------------------------------------
  const trendHasMinData = totalActiveDays >= config.trendDropMinDays && !coldStartProtected;
  let previousRate = 100;
  let recentRate = 100;
  let dropRate = 0;
  let trendTriggered = false;

  if (trendHasMinData) {
    const windowSize = config.trendDropWindowSize; // 14
    const recentRecords = activeRecords.slice(-windowSize);
    const previousRecords = activeRecords.slice(-(windowSize * 2), -windowSize);

    const prevHadir = previousRecords.filter((r) => r.status === 'PRESENT').length;
    const recHadir = recentRecords.filter((r) => r.status === 'PRESENT').length;

    previousRate = (prevHadir / windowSize) * 100;
    recentRate = (recHadir / windowSize) * 100;
    dropRate = Math.round((previousRate - recentRate) * 10) / 10;

    trendTriggered = dropRate >= config.trendDropThreshold;
  }

  indicators.push({
    code: 'EWS_TREND_DROP',
    name: 'Penurunan Tren Kehadiran',
    severity: 'TINGGI',
    triggered: trendTriggered,
    minDataDays: config.trendDropMinDays,
    value: Math.max(0, dropRate),
    threshold: config.trendDropThreshold,
    unit: '%',
    description: trendTriggered
      ? `Kehadiran turun ${dropRate}% dibandingkan periode sebelumnya (${previousRate.toFixed(1)}% ➔ ${recentRate.toFixed(1)}%).`
      : `Penurunan tren kehadiran: ${Math.max(0, dropRate)}% (Ambang batas: >= ${config.trendDropThreshold}%).`,
    suggestedAction: 'Rapat koordinasi wali kelas dan guru BK.',
    details: {
      previousRate,
      recentRate,
      dropRate,
      periodDays: config.trendDropWindowSize,
    },
  });

  // Compute triggered count & highest severity
  const triggeredIndicators = indicators.filter((i) => i.triggered);
  let highestSeverity: EWSSeverity | null = null;
  if (triggeredIndicators.some((i) => i.severity === 'TINGGI')) {
    highestSeverity = 'TINGGI';
  } else if (triggeredIndicators.some((i) => i.severity === 'SEDANG')) {
    highestSeverity = 'SEDANG';
  } else if (triggeredIndicators.some((i) => i.severity === 'RENDAH')) {
    highestSeverity = 'RENDAH';
  }

  return {
    studentId: input.studentId,
    name: input.name,
    nis: input.nis,
    gender: input.gender,
    totalActiveDays,
    coldStartProtected,
    coldStartMessage,
    hadirCount,
    sakitCount,
    izinCount,
    alpaCount,
    attendanceRate: Math.round(attendanceRate * 10) / 10,
    highestSeverity,
    indicators,
    triggeredCount: triggeredIndicators.length,
    lastCalculatedAt: new Date().toISOString(),
  };
}

// ==========================================
// 3. DATABASE ACCESS & AGGREGATE EVALUATION
// ==========================================

/**
 * Evaluates EWS metrics for all students in a class directly from the database.
 */
export async function evaluateClassEWS(
  schoolId: string,
  classId: string,
  asOfDate?: string,
  customConfig?: Partial<EWSThresholdConfig>
): Promise<ClassEWSOverview> {
  // 1. Fetch class info
  const [cls] = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.schoolId, schoolId)));

  if (!cls) {
    throw new Error(`Kelas dengan ID ${classId} tidak ditemukan.`);
  }

  // 2. Fetch enrolled students
  const enrollments = await db
    .select({
      studentId: students.id,
      name: students.name,
      nis: students.nis,
      gender: students.gender,
      phone: students.guardianPhone,
      guardianName: students.guardianName,
      guardianPhone: students.guardianPhone,
    })
    .from(classEnrollments)
    .innerJoin(students, eq(classEnrollments.studentId, students.id))
    .where(
      and(
        eq(classEnrollments.classId, classId),
        eq(classEnrollments.schoolId, schoolId),
        eq(students.isActive, true)
      )
    );

  if (enrollments.length === 0) {
    return {
      classId,
      className: cls.name,
      schoolId,
      totalStudents: 0,
      activeEvaluatedStudents: 0,
      averageAttendanceRate: 0,
      studentsAtRiskCount: 0,
      highestSeverity: null,
      streakAlertCount: 0,
      monthlyAlertCount: 0,
      patternAlertCount: 0,
      trendDropAlertCount: 0,
      coldStartCount: 0,
      students: [],
    };
  }

  const studentIds = enrollments.map((e) => e.studentId);

  // 3. Fetch attendance history for these students
  const records = await db
    .select({
      studentId: attendanceRecords.studentId,
      date: attendanceSessions.date,
      status: attendanceRecords.status,
    })
    .from(attendanceRecords)
    .innerJoin(
      attendanceSessions,
      eq(attendanceRecords.sessionId, attendanceSessions.id)
    )
    .where(
      and(
        eq(attendanceRecords.schoolId, schoolId),
        inArray(attendanceRecords.studentId, studentIds),
        asOfDate ? sql`${attendanceSessions.date} <= ${asOfDate}` : sql`1=1`
      )
    )
    .orderBy(asc(attendanceSessions.date));

  // Group records by student
  const studentRecordsMap = new Map<string, StudentDailyAttendance[]>();
  for (const rec of records) {
    const list = studentRecordsMap.get(rec.studentId) || [];
    list.push({
      date: rec.date,
      status: rec.status as any,
    });
    studentRecordsMap.set(rec.studentId, list);
  }

  // 4. Calculate EWS per student
  const studentResults: StudentEWSResult[] = [];
  let totalRateSum = 0;
  let streakAlertCount = 0;
  let monthlyAlertCount = 0;
  let patternAlertCount = 0;
  let trendDropAlertCount = 0;
  let coldStartCount = 0;
  let highestSeverity: EWSSeverity | null = null;

  for (const enr of enrollments) {
    const recs = studentRecordsMap.get(enr.studentId) || [];
    const result = calculateStudentEWS(
      {
        studentId: enr.studentId,
        name: enr.name,
        nis: enr.nis,
        gender: enr.gender,
        phone: enr.phone,
        guardianName: enr.guardianName,
        guardianPhone: enr.guardianPhone,
        records: recs,
      },
      customConfig,
      asOfDate
    );

    studentResults.push(result);
    totalRateSum += result.attendanceRate;

    if (result.coldStartProtected) coldStartCount++;

    for (const ind of result.indicators) {
      if (ind.triggered) {
        if (ind.code === 'EWS_ALPA_STREAK') streakAlertCount++;
        else if (ind.code === 'EWS_ALPA_MONTHLY') monthlyAlertCount++;
        else if (ind.code === 'EWS_DAY_PATTERN') patternAlertCount++;
        else if (ind.code === 'EWS_TREND_DROP') trendDropAlertCount++;
      }
    }

    if (result.highestSeverity === 'TINGGI') {
      highestSeverity = 'TINGGI';
    } else if (result.highestSeverity === 'SEDANG' && highestSeverity !== 'TINGGI') {
      highestSeverity = 'SEDANG';
    } else if (result.highestSeverity === 'RENDAH' && !highestSeverity) {
      highestSeverity = 'RENDAH';
    }
  }

  const activeEvaluatedStudents = studentResults.length;
  const averageAttendanceRate =
    activeEvaluatedStudents > 0
      ? Math.round((totalRateSum / activeEvaluatedStudents) * 10) / 10
      : 0;

  const studentsAtRiskCount = studentResults.filter(
    (s) => s.triggeredCount > 0
  ).length;

  return {
    classId,
    className: cls.name,
    schoolId,
    totalStudents: enrollments.length,
    activeEvaluatedStudents,
    averageAttendanceRate,
    studentsAtRiskCount,
    highestSeverity,
    streakAlertCount,
    monthlyAlertCount,
    patternAlertCount,
    trendDropAlertCount,
    coldStartCount,
    students: studentResults,
  };
}

/**
 * Persists triggered EWS alerts to early_warning_logs table
 */
export async function saveEWSAlerts(
  schoolId: string,
  results: StudentEWSResult[],
  aiNarrative?: string
): Promise<number> {
  const alertsToInsert: Array<{
    schoolId: string;
    studentId: string;
    indicatorCode: string;
    severity: string;
    metricSnapshotJson: string;
    aiNarrative: string | null;
  }> = [];

  for (const student of results) {
    for (const ind of student.indicators) {
      if (ind.triggered) {
        alertsToInsert.push({
          schoolId,
          studentId: student.studentId,
          indicatorCode: ind.code,
          severity: ind.severity,
          metricSnapshotJson: JSON.stringify({
            name: ind.name,
            value: ind.value,
            threshold: ind.threshold,
            unit: ind.unit,
            description: ind.description,
            suggestedAction: ind.suggestedAction,
            details: ind.details,
            totalActiveDays: student.totalActiveDays,
            attendanceRate: student.attendanceRate,
          }),
          aiNarrative: aiNarrative || null,
        });
      }
    }
  }

  if (alertsToInsert.length === 0) {
    return 0;
  }

  await db.insert(earlyWarningLogs).values(alertsToInsert);
  return alertsToInsert.length;
}

/**
 * Retrieves recent early warning logs for a school / student
 */
export async function getEWSLogs(
  schoolId: string,
  options?: { studentId?: string; limit?: number }
) {
  const query = db
    .select()
    .from(earlyWarningLogs)
    .where(
      and(
        eq(earlyWarningLogs.schoolId, schoolId),
        options?.studentId ? eq(earlyWarningLogs.studentId, options.studentId) : sql`1=1`
      )
    )
    .orderBy(desc(earlyWarningLogs.createdAt))
    .limit(options?.limit || 50);

  return await query;
}
