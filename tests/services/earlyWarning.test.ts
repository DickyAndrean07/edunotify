import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/db';
import {
  schools,
  academicYears,
  classes,
  students,
  classEnrollments,
  attendanceSessions,
  attendanceRecords,
  earlyWarningLogs,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  calculateStudentEWS,
  evaluateClassEWS,
  saveEWSAlerts,
  getEWSLogs,
  DEFAULT_EWS_CONFIG,
} from '@/services/earlyWarningService';
import { StudentEWSInput } from '@/lib/ai/types';

describe('EDUNOTIFY-05: Rule-Engine Early Warning Deterministik', () => {
  // ========================================================
  // 1. PURE DETERMINISTIC MATHEMATICAL UNIT TESTS
  // ========================================================

  describe('1. EWS_ALPA_STREAK (Alpa Beruntun >= 2 hari)', () => {
    it('memicu EWS_ALPA_STREAK jika siswa Alpa >= 2 hari berturut-turut pada data terbarunya', () => {
      const mockInput: StudentEWSInput = {
        studentId: 'std-1',
        name: 'Ahmad Siswa',
        nis: '1001',
        gender: 'L',
        records: [
          { date: '2026-10-01', status: 'PRESENT' },
          { date: '2026-10-02', status: 'PRESENT' },
          { date: '2026-10-05', status: 'PRESENT' },
          { date: '2026-10-06', status: 'ABSENT_ALPA' },
          { date: '2026-10-07', status: 'ABSENT_ALPA' },
        ],
      };

      const result = calculateStudentEWS(mockInput);
      const streakInd = result.indicators.find((i) => i.code === 'EWS_ALPA_STREAK');

      expect(streakInd).toBeDefined();
      expect(streakInd?.triggered).toBe(true);
      expect(streakInd?.severity).toBe('TINGGI');
      expect(streakInd?.value).toBe(2);
      expect(streakInd?.suggestedAction).toBe(
        'Hubungi ortu hari ini; jadwalkan konfirmasi langsung.'
      );
      expect(result.highestSeverity).toBe('TINGGI');
    });

    it('tidak memicu EWS_ALPA_STREAK jika Alpa berselang (hanya 1 hari lalu hadir)', () => {
      const mockInput: StudentEWSInput = {
        studentId: 'std-2',
        name: 'Budi Santoso',
        nis: '1002',
        gender: 'L',
        records: [
          { date: '2026-10-01', status: 'PRESENT' },
          { date: '2026-10-02', status: 'ABSENT_ALPA' },
          { date: '2026-10-05', status: 'PRESENT' },
          { date: '2026-10-06', status: 'ABSENT_ALPA' },
          { date: '2026-10-07', status: 'PRESENT' },
        ],
      };

      const result = calculateStudentEWS(mockInput);
      const streakInd = result.indicators.find((i) => i.code === 'EWS_ALPA_STREAK');

      expect(streakInd?.triggered).toBe(false);
      expect(streakInd?.value).toBe(1);
    });

    it('tidak memicu jika total data aktif < 2 hari', () => {
      const mockInput: StudentEWSInput = {
        studentId: 'std-3',
        name: 'Cici Paramida',
        nis: '1003',
        gender: 'P',
        records: [{ date: '2026-10-01', status: 'ABSENT_ALPA' }],
      };

      const result = calculateStudentEWS(mockInput);
      const streakInd = result.indicators.find((i) => i.code === 'EWS_ALPA_STREAK');
      expect(streakInd?.triggered).toBe(false);
    });
  });

  describe('2. EWS_ALPA_MONTHLY (Akumulasi Alpa >= 3 hari dalam 30 hari kalender)', () => {
    it('memicu EWS_ALPA_MONTHLY jika Alpa >= 3 hari dalam rentang 30 hari dan memiliki >= 14 hari aktif', () => {
      // 14 days active with 3 scattered Alpa within 30 days
      const records = [
        { date: '2026-10-01', status: 'PRESENT' },
        { date: '2026-10-02', status: 'PRESENT' },
        { date: '2026-10-03', status: 'PRESENT' },
        { date: '2026-10-04', status: 'PRESENT' },
        { date: '2026-10-05', status: 'ABSENT_ALPA' }, // 1
        { date: '2026-10-06', status: 'PRESENT' },
        { date: '2026-10-07', status: 'PRESENT' },
        { date: '2026-10-08', status: 'PRESENT' },
        { date: '2026-10-09', status: 'PRESENT' },
        { date: '2026-10-12', status: 'ABSENT_ALPA' }, // 2
        { date: '2026-10-13', status: 'PRESENT' },
        { date: '2026-10-14', status: 'PRESENT' },
        { date: '2026-10-15', status: 'PRESENT' },
        { date: '2026-10-16', status: 'ABSENT_ALPA' }, // 3
      ];

      const mockInput: StudentEWSInput = {
        studentId: 'std-4',
        name: 'Doni Pratama',
        nis: '1004',
        gender: 'L',
        records: records as any,
      };

      const result = calculateStudentEWS(mockInput, undefined, '2026-10-16');
      const monthlyInd = result.indicators.find((i) => i.code === 'EWS_ALPA_MONTHLY');

      expect(monthlyInd).toBeDefined();
      expect(monthlyInd?.triggered).toBe(true);
      expect(monthlyInd?.severity).toBe('SEDANG');
      expect(monthlyInd?.value).toBe(3);
      expect(monthlyInd?.suggestedAction).toBe(
        'Diskusi empat mata dengan siswa; catat kendala.'
      );
    });

    it('tidak memicu EWS_ALPA_MONTHLY jika Alpa hanya 2 hari dalam rentang 30 hari', () => {
      const records = Array.from({ length: 15 }, (_, i) => ({
        date: `2026-10-${String(i + 1).padStart(2, '0')}`,
        status: i === 4 || i === 8 ? 'ABSENT_ALPA' : 'PRESENT',
      }));

      const mockInput: StudentEWSInput = {
        studentId: 'std-5',
        name: 'Erna Wati',
        nis: '1005',
        gender: 'P',
        records: records as any,
      };

      const result = calculateStudentEWS(mockInput, undefined, '2026-10-15');
      const monthlyInd = result.indicators.find((i) => i.code === 'EWS_ALPA_MONTHLY');
      expect(monthlyInd?.triggered).toBe(false);
      expect(monthlyInd?.value).toBe(2);
    });
  });

  describe('3. EWS_DAY_PATTERN (Pola Hari Ketidakhadiran >= 70%)', () => {
    it('memicu EWS_DAY_PATTERN jika >= 70% ketidakhadiran jatuh pada hari yang sama (misal: selalu Senin)', () => {
      // 21 active days
      // 4 total non-present days, 3 of which are Mondays (75% >= 70%)
      const records: any[] = [];
      // 2026-10-05 is Monday, 2026-10-12 is Monday, 2026-10-19 is Monday
      // 2026-10-06 is Tuesday
      // 17 other present days
      for (let day = 1; day <= 25; day++) {
        const dateStr = `2026-10-${String(day).padStart(2, '0')}`;
        // Days of week:
        // Oct 5 (Mon), Oct 12 (Mon), Oct 19 (Mon) -> ABSENT_ALPA / SICK
        // Oct 6 (Tue) -> PERMIT
        let status = 'PRESENT';
        if (day === 5 || day === 12 || day === 19) {
          status = 'ABSENT_ALPA'; // Monday
        } else if (day === 6) {
          status = 'PERMIT'; // Tuesday
        }
        records.push({ date: dateStr, status });
      }

      const mockInput: StudentEWSInput = {
        studentId: 'std-6',
        name: 'Fandi Kurniawan',
        nis: '1006',
        gender: 'L',
        records,
      };

      const result = calculateStudentEWS(mockInput);
      const patternInd = result.indicators.find((i) => i.code === 'EWS_DAY_PATTERN');

      expect(patternInd).toBeDefined();
      expect(patternInd?.triggered).toBe(true);
      expect(patternInd?.severity).toBe('SEDANG');
      expect(patternInd?.details?.dominantDay).toBe('Senin');
      expect(patternInd?.details?.ratio).toBeGreaterThanOrEqual(0.7);
      expect(patternInd?.suggestedAction).toBe(
        'Investigasi kendala spesifik hari tersebut bersama BK.'
      );
    });

    it('tidak memicu jika ketidakhadiran tersebar merata di berbagai hari', () => {
      const records: any[] = [];
      // 21 days with absences scattered across Monday, Tuesday, Wednesday, Thursday
      for (let day = 1; day <= 22; day++) {
        const dateStr = `2026-10-${String(day).padStart(2, '0')}`;
        let status = 'PRESENT';
        if (day === 5) status = 'ABSENT_ALPA'; // Mon
        if (day === 6) status = 'SICK'; // Tue
        if (day === 7) status = 'PERMIT'; // Wed
        if (day === 8) status = 'ABSENT_ALPA'; // Thu
        records.push({ date: dateStr, status });
      }

      const mockInput: StudentEWSInput = {
        studentId: 'std-7',
        name: 'Gilang Ramadhan',
        nis: '1007',
        gender: 'L',
        records,
      };

      const result = calculateStudentEWS(mockInput);
      const patternInd = result.indicators.find((i) => i.code === 'EWS_DAY_PATTERN');
      expect(patternInd?.triggered).toBe(false);
    });
  });

  describe('4. EWS_TREND_DROP (Penurunan Tren Kehadiran >= 15%)', () => {
    it('memicu EWS_TREND_DROP jika kehadiran turun >= 15% dari periode 14 hari sebelumnya ke 14 hari terkini', () => {
      // 28 days total
      // First 14 days: 100% present (14/14 = 100%)
      // Last 14 days: 11 present, 3 absent (11/14 = 78.6%) -> drop = 21.4% >= 15%
      const records: any[] = [];
      for (let i = 1; i <= 14; i++) {
        records.push({
          date: `2026-09-${String(i).padStart(2, '0')}`,
          status: 'PRESENT',
        });
      }
      for (let i = 15; i <= 28; i++) {
        records.push({
          date: `2026-09-${String(i).padStart(2, '0')}`,
          status: i <= 25 ? 'PRESENT' : 'ABSENT_ALPA', // 3 absent out of 14
        });
      }

      const mockInput: StudentEWSInput = {
        studentId: 'std-8',
        name: 'Hesti Purwanti',
        nis: '1008',
        gender: 'P',
        records,
      };

      const result = calculateStudentEWS(mockInput);
      const trendInd = result.indicators.find((i) => i.code === 'EWS_TREND_DROP');

      expect(trendInd).toBeDefined();
      expect(trendInd?.triggered).toBe(true);
      expect(trendInd?.severity).toBe('TINGGI');
      expect(trendInd?.value).toBeGreaterThanOrEqual(15);
      expect(trendInd?.suggestedAction).toBe('Rapat koordinasi wali kelas dan guru BK.');
      expect(result.highestSeverity).toBe('TINGGI');
    });

    it('tidak memicu jika penurunan tren < 15%', () => {
      // First 14: 100%, last 14: 13 present, 1 absent (drop = 7.1% < 15%)
      const records: any[] = [];
      for (let i = 1; i <= 14; i++) {
        records.push({ date: `2026-09-${String(i).padStart(2, '0')}`, status: 'PRESENT' });
      }
      for (let i = 15; i <= 28; i++) {
        records.push({
          date: `2026-09-${String(i).padStart(2, '0')}`,
          status: i === 28 ? 'ABSENT_ALPA' : 'PRESENT',
        });
      }

      const mockInput: StudentEWSInput = {
        studentId: 'std-9',
        name: 'Indra Lesmana',
        nis: '1009',
        gender: 'L',
        records,
      };

      const result = calculateStudentEWS(mockInput);
      const trendInd = result.indicators.find((i) => i.code === 'EWS_TREND_DROP');
      expect(trendInd?.triggered).toBe(false);
    });
  });

  describe('5. Proteksi Cold-Start (< 14 Hari Aktif)', () => {
    it('menahan alert pola hari dan tren drop jika data historis < 14 hari aktif', () => {
      // 10 active days where student had 3 consecutive Alpa on Monday
      const records = [
        { date: '2026-10-05', status: 'ABSENT_ALPA' }, // Mon
        { date: '2026-10-06', status: 'PRESENT' },
        { date: '2026-10-07', status: 'PRESENT' },
        { date: '2026-10-08', status: 'PRESENT' },
        { date: '2026-10-09', status: 'PRESENT' },
        { date: '2026-10-12', status: 'ABSENT_ALPA' }, // Mon
        { date: '2026-10-13', status: 'PRESENT' },
        { date: '2026-10-14', status: 'PRESENT' },
        { date: '2026-10-15', status: 'PRESENT' },
        { date: '2026-10-19', status: 'ABSENT_ALPA' }, // Mon (3rd Monday)
      ];

      const mockInput: StudentEWSInput = {
        studentId: 'std-10',
        name: 'Joko Widodo',
        nis: '1010',
        gender: 'L',
        records: records as any,
      };

      const result = calculateStudentEWS(mockInput);

      // Verify Cold Start Protection flag and message
      expect(result.coldStartProtected).toBe(true);
      expect(result.coldStartMessage).toBe(
        'Data historis belum mencukupi untuk analisis pola kehadiran (minimal 14 hari aktif)'
      );

      // Pattern & Trend are strictly withheld (false)
      const patternInd = result.indicators.find((i) => i.code === 'EWS_DAY_PATTERN');
      const trendInd = result.indicators.find((i) => i.code === 'EWS_TREND_DROP');
      const monthlyInd = result.indicators.find((i) => i.code === 'EWS_ALPA_MONTHLY');

      expect(patternInd?.triggered).toBe(false);
      expect(trendInd?.triggered).toBe(false);
      expect(monthlyInd?.triggered).toBe(false);
    });

    it('tetap memicu EWS_ALPA_STREAK meskipun data < 14 hari, asalkan >= 2 hari aktif', () => {
      // Only 5 days active, but last 2 days are Alpa
      const records = [
        { date: '2026-10-01', status: 'PRESENT' },
        { date: '2026-10-02', status: 'PRESENT' },
        { date: '2026-10-05', status: 'PRESENT' },
        { date: '2026-10-06', status: 'ABSENT_ALPA' },
        { date: '2026-10-07', status: 'ABSENT_ALPA' },
      ];

      const mockInput: StudentEWSInput = {
        studentId: 'std-11',
        name: 'Kartika Sari',
        nis: '1011',
        gender: 'P',
        records: records as any,
      };

      const result = calculateStudentEWS(mockInput);

      expect(result.coldStartProtected).toBe(true);
      const streakInd = result.indicators.find((i) => i.code === 'EWS_ALPA_STREAK');
      expect(streakInd?.triggered).toBe(true);
      expect(streakInd?.severity).toBe('TINGGI');
    });
  });

  // ========================================================
  // 2. DATABASE INTEGRATION & LOGGING TESTS
  // ========================================================

  describe('6. Database Integration & early_warning_logs Persistence', () => {
    let testSchoolId: string;
    let testClassId: string;
    let studentAId: string;
    let studentBId: string;

    beforeAll(async () => {
      // 1. Setup school
      const [school] = await db
        .insert(schools)
        .values({
          name: 'SMA Test EWS Engine',
          npsn: 'EWS_' + Math.random().toString(36).substring(2, 9),
        })
        .returning();
      testSchoolId = school.id;

      // 2. Setup academic year
      const [ay] = await db
        .insert(academicYears)
        .values({
          schoolId: testSchoolId,
          name: '2026/2027',
          semester: 'GANJIL',
          startDate: '2026-07-01',
          endDate: '2026-12-31',
          isActive: true,
        })
        .returning();

      // 3. Setup class
      const [cls] = await db
        .insert(classes)
        .values({
          schoolId: testSchoolId,
          name: 'XI-MIPA 1',
          gradeLevel: '11',
          academicYearId: ay.id,
        })
        .returning();
      testClassId = cls.id;

      // 4. Setup students
      const [stdA] = await db
        .insert(students)
        .values({
          schoolId: testSchoolId,
          name: 'Budi Test EWS',
          nis: '9901',
          gender: 'L',
        })
        .returning();
      studentAId = stdA.id;

      const [stdB] = await db
        .insert(students)
        .values({
          schoolId: testSchoolId,
          name: 'Siti Test EWS',
          nis: '9902',
          gender: 'P',
        })
        .returning();
      studentBId = stdB.id;

      // Enroll students
      await db.insert(classEnrollments).values([
        { schoolId: testSchoolId, classId: testClassId, studentId: studentAId, academicYearId: ay.id },
        { schoolId: testSchoolId, classId: testClassId, studentId: studentBId, academicYearId: ay.id },
      ]);

      // Create 3 sessions
      // Day 1: Both Present
      // Day 2: Student A Alpa, Student B Present
      // Day 3: Student A Alpa (Streak 2!), Student B Present
      const dates = ['2026-10-19', '2026-10-20', '2026-10-21'];
      for (let idx = 0; idx < dates.length; idx++) {
        const d = dates[idx];
        const [sess] = await db
          .insert(attendanceSessions)
          .values({
            schoolId: testSchoolId,
            classId: testClassId,
            date: d,
            status: 'SUBMITTED',
          })
          .returning();

        await db.insert(attendanceRecords).values([
          {
            schoolId: testSchoolId,
            sessionId: sess.id,
            studentId: studentAId,
            status: idx === 0 ? 'PRESENT' : 'ABSENT_ALPA',
          },
          {
            schoolId: testSchoolId,
            sessionId: sess.id,
            studentId: studentBId,
            status: 'PRESENT',
          },
        ]);
      }
    });

    it('menghitung evaluasi kelas dari database dengan benar', async () => {
      const overview = await evaluateClassEWS(testSchoolId, testClassId);

      expect(overview.className).toBe('XI-MIPA 1');
      expect(overview.totalStudents).toBe(2);
      expect(overview.students.length).toBe(2);

      // Student A has streak 2 Alpa
      const studentA = overview.students.find((s) => s.studentId === studentAId);
      expect(studentA).toBeDefined();
      expect(studentA?.triggeredCount).toBe(1);
      const streakInd = studentA?.indicators.find((i) => i.code === 'EWS_ALPA_STREAK');
      expect(streakInd?.triggered).toBe(true);

      // Student B has 100% presence
      const studentB = overview.students.find((s) => s.studentId === studentBId);
      expect(studentB).toBeDefined();
      expect(studentB?.attendanceRate).toBe(100);
      expect(studentB?.triggeredCount).toBe(0);

      // Overview aggregates
      expect(overview.streakAlertCount).toBe(1);
      expect(overview.highestSeverity).toBe('TINGGI');
    });

    it('menyimpan log EWS ke early_warning_logs dengan snapshot metrik valid', async () => {
      const overview = await evaluateClassEWS(testSchoolId, testClassId);
      const insertedCount = await saveEWSAlerts(
        testSchoolId,
        overview.students,
        'Rekomendasi awal tersimpan'
      );

      expect(insertedCount).toBeGreaterThanOrEqual(1);

      // Query database
      const logs = await getEWSLogs(testSchoolId, { studentId: studentAId });
      expect(logs.length).toBeGreaterThanOrEqual(1);
      const log = logs[0];
      expect(log.indicatorCode).toBe('EWS_ALPA_STREAK');
      expect(log.severity).toBe('TINGGI');
      expect(log.metricSnapshotJson).toContain('Alpa Beruntun');
    });
  });
});
