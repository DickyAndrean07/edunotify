import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/db';
import {
  schools,
  academicYears,
  classes,
  students,
  classEnrollments,
  users,
  teachingSchedules,
  academicCalendars,
  attendanceSessions,
  attendanceRecords,
  earlyWarningLogs,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  validateDateRange,
  ReportDateRangeError,
  getDailyAttendanceCompleteness,
  getSchoolAttendanceSummary,
  getAttendanceReportData,
} from '@/services/reportService';
import { hashPassword } from '@/lib/auth/password';

describe('EDUNOTIFY-06: Report Service & Aggregation Engine', () => {
  // ========================================================
  // 1. DATE RANGE VALIDATION & SECURITY TESTS
  // ========================================================

  describe('1. validateDateRange (Proteksi DoS / OOM Rentang Maksimal 1 Tahun)', () => {
    it('menerima rentang tanggal valid dalam 30 hari', () => {
      const result = validateDateRange('2026-10-01', '2026-10-31');
      expect(result.startDate).toBe('2026-10-01');
      expect(result.endDate).toBe('2026-10-31');
      expect(result.diffDays).toBe(31);
    });

    it('menerima rentang tanggal tepat 366 hari (1 tahun ajaran kabisat)', () => {
      const result = validateDateRange('2026-01-01', '2026-12-31');
      expect(result.diffDays).toBe(365);
    });

    it('menolak jika tanggal mulai atau tanggal akhir kosong', () => {
      expect(() => validateDateRange('', '2026-10-31')).toThrow(
        ReportDateRangeError
      );
      expect(() => validateDateRange('2026-10-01', '')).toThrow(
        ReportDateRangeError
      );
    });

    it('menolak format tanggal yang tidak valid', () => {
      expect(() => validateDateRange('invalid-date', '2026-10-31')).toThrow(
        ReportDateRangeError
      );
    });

    it('menolak jika tanggal mulai lebih besar daripada tanggal akhir', () => {
      expect(() => validateDateRange('2026-11-01', '2026-10-01')).toThrow(
        'Tanggal mulai tidak boleh lebih besar dari tanggal akhir.'
      );
    });

    it('menolak jika rentang tanggal melebihi 366 hari (DoD Keamanan)', () => {
      // 2 tahun (731 hari)
      expect(() =>
        validateDateRange('2025-01-01', '2027-01-01')
      ).toThrowError(/Rentang tanggal melebihi batas maksimal 366 hari/);
    });
  });

  // ========================================================
  // 2. DATABASE INTEGRATION TESTS
  // ========================================================

  describe('2. Database Reporting & Completeness Aggregation', () => {
    let schoolId: string;
    let otherSchoolId: string;
    let academicYearId: string;
    let teacherUserId: string;
    let homeroomUserId: string;
    let principalUserId: string;

    let classAId: string;
    let classBId: string;

    let studentA1Id: string;
    let studentA2Id: string;
    let studentB1Id: string;

    const testDate = '2026-10-19'; // Senin
    const holidayDate = '2026-10-20'; // Selasa

    beforeAll(async () => {
      const dummyHash = await hashPassword('password123');

      // 1. Setup School 1
      const [school] = await db
        .insert(schools)
        .values({
          name: 'SMA Negeri 1 EduNotify',
          npsn: 'RPT_' + Math.random().toString(36).substring(2, 9),
          address: 'Jl. Pendidikan No. 100, Gresik',
        })
        .returning();
      schoolId = school.id;

      // 2. Setup Other School (untuk tes multitenant isolation)
      const [otherSchool] = await db
        .insert(schools)
        .values({
          name: 'SMA Swasta Lain',
          npsn: 'RPT_OTH_' + Math.random().toString(36).substring(2, 9),
          address: 'Jl. Lain',
        })
        .returning();
      otherSchoolId = otherSchool.id;

      // 3. Setup Users
      const [principal] = await db
        .insert(users)
        .values({
          schoolId,
          name: 'Drs. H. M. Sholihin, M.Pd.',
          email: `kepsek_${Date.now()}@edunotify.sch.id`,
          passwordHash: dummyHash,
          role: 'KEPALA_SEKOLAH',
          nip: '197805122005011003',
        })
        .returning();
      principalUserId = principal.id;

      const [homeroom] = await db
        .insert(users)
        .values({
          schoolId,
          name: 'Dra. Sri Wahyuni',
          email: `wali_${Date.now()}@edunotify.sch.id`,
          passwordHash: dummyHash,
          role: 'WALI_KELAS',
        })
        .returning();
      homeroomUserId = homeroom.id;

      const [teacher] = await db
        .insert(users)
        .values({
          schoolId,
          name: 'Budi Santoso, S.Pd.',
          email: `guru_${Date.now()}@edunotify.sch.id`,
          passwordHash: dummyHash,
          role: 'GURU_MAPEL',
        })
        .returning();
      teacherUserId = teacher.id;

      // 4. Setup Academic Year
      const [ay] = await db
        .insert(academicYears)
        .values({
          schoolId,
          name: '2026/2027',
          semester: 'GANJIL',
          startDate: '2026-07-01',
          endDate: '2026-12-31',
          isActive: true,
        })
        .returning();
      academicYearId = ay.id;

      // 5. Setup Academic Calendar
      await db.insert(academicCalendars).values([
        {
          schoolId,
          date: testDate,
          dayType: 'ACTIVE_KBM',
          description: 'Hari Efektif KBM',
        },
        {
          schoolId,
          date: holidayDate,
          dayType: 'HOLIDAY',
          description: 'Hari Libur Khusus',
        },
      ]);

      // 6. Setup Classes
      const [classA] = await db
        .insert(classes)
        .values({
          schoolId,
          academicYearId,
          name: 'X-A',
          gradeLevel: '10',
          homeroomTeacherId: homeroomUserId,
        })
        .returning();
      classAId = classA.id;

      const [classB] = await db
        .insert(classes)
        .values({
          schoolId,
          academicYearId,
          name: 'X-B',
          gradeLevel: '10',
          homeroomTeacherId: homeroomUserId,
        })
        .returning();
      classBId = classB.id;

      // 7. Setup Students
      const [stA1] = await db
        .insert(students)
        .values({
          schoolId,
          nis: '10001',
          nisn: '008910001',
          name: 'Ahmad Faiz',
          gender: 'L',
          guardianName: 'Bapak Faiz',
          guardianPhone: '081234567801',
        })
        .returning();
      studentA1Id = stA1.id;

      const [stA2] = await db
        .insert(students)
        .values({
          schoolId,
          nis: '10002',
          nisn: '008910002',
          name: 'Bella Safira',
          gender: 'P',
          guardianName: 'Ibu Bella',
          guardianPhone: '081234567802',
        })
        .returning();
      studentA2Id = stA2.id;

      const [stB1] = await db
        .insert(students)
        .values({
          schoolId,
          nis: '10003',
          nisn: '008910003',
          name: 'Chandra Wijaya',
          gender: 'L',
          guardianName: 'Bapak Chandra',
          guardianPhone: '081234567803',
        })
        .returning();
      studentB1Id = stB1.id;

      // Enrollments
      await db.insert(classEnrollments).values([
        { schoolId, classId: classAId, studentId: studentA1Id, academicYearId },
        { schoolId, classId: classAId, studentId: studentA2Id, academicYearId },
        { schoolId, classId: classBId, studentId: studentB1Id, academicYearId },
      ]);

      // Teaching schedules
      await db.insert(teachingSchedules).values([
        {
          schoolId,
          classId: classAId,
          teacherId: teacherUserId,
          subjectName: 'Matematika',
          dayOfWeek: 1, // Senin
          periodOrder: 1,
          startTime: '07:00',
          endTime: '08:30',
        },
        {
          schoolId,
          classId: classBId,
          teacherId: teacherUserId,
          subjectName: 'Fisika',
          dayOfWeek: 1, // Senin
          periodOrder: 1,
          startTime: '07:00',
          endTime: '08:30',
        },
      ]);

      // 8. Create attendance session for Class X-A on testDate (SUBMITTED)
      const [sessionA] = await db
        .insert(attendanceSessions)
        .values({
          schoolId,
          classId: classAId,
          date: testDate,
          submittedByTeacherId: teacherUserId,
          status: 'SUBMITTED',
          submittedAt: new Date(`${testDate}T07:45:00Z`),
        })
        .returning();

      // Records for Class X-A:
      // studentA1: PRESENT
      // studentA2: ABSENT_ALPA
      await db.insert(attendanceRecords).values([
        {
          schoolId,
          sessionId: sessionA.id,
          studentId: studentA1Id,
          status: 'PRESENT',
        },
        {
          schoolId,
          sessionId: sessionA.id,
          studentId: studentA2Id,
          status: 'ABSENT_ALPA',
          notes: 'Tanpa kabar',
        },
      ]);

      // Insert EWS log for studentA2
      await db.insert(earlyWarningLogs).values({
        schoolId,
        studentId: studentA2Id,
        indicatorCode: 'EWS_ALPA_STREAK',
        severity: 'TINGGI',
        metricSnapshotJson: JSON.stringify({ streak: 2 }),
      });
    });

    afterAll(async () => {
      // Cleanup
      if (schoolId) {
        await db.delete(schools).where(eq(schools.id, schoolId));
      }
      if (otherSchoolId) {
        await db.delete(schools).where(eq(schools.id, otherSchoolId));
      }
    });

    // Test getDailyAttendanceCompleteness
    describe('2.1 getDailyAttendanceCompleteness (DoD 2)', () => {
      it('menghasilkan ringkasan kelengkapan presensi harian seluruh kelas dengan status tepat', async () => {
        // Query at 10:00 WIB (past schedule end time 08:30)
        const overview = await getDailyAttendanceCompleteness(
          schoolId,
          testDate,
          '10:00'
        );

        expect(overview.date).toBe(testDate);
        expect(overview.isHoliday).toBe(false);
        expect(overview.summary.totalClasses).toBe(2);
        expect(overview.summary.completedClasses).toBe(1); // Kelas X-A selesai
        expect(overview.summary.uncompletedClasses).toBe(1); // Kelas X-B belum
        expect(overview.summary.completenessRate).toBe(50.0);
        expect(overview.summary.totalPresent).toBe(1);
        expect(overview.summary.totalAlpa).toBe(1);

        // Kelas X-A
        const clsA = overview.classes.find((c) => c.classId === classAId);
        expect(clsA).toBeDefined();
        expect(clsA?.sessionStatus).toBe('SUBMITTED');
        expect(clsA?.isCompleted).toBe(true);
        expect(clsA?.submittedByTeacherName).toBe('Budi Santoso, S.Pd.');
        expect(clsA?.presentCount).toBe(1);
        expect(clsA?.alpaCount).toBe(1);

        // Kelas X-B (belum diisi, jam 10:00 > endTime 08:30 => alert)
        const clsB = overview.classes.find((c) => c.classId === classBId);
        expect(clsB).toBeDefined();
        expect(clsB?.isCompleted).toBe(false);
        expect(clsB?.sessionStatus).toBe('UNCOMPLETED_ALERT');
        expect(clsB?.isAlert).toBe(true);
      });

      it('membebaskan kewajiban presensi pada hari libur kalender sekolah', async () => {
        const overview = await getDailyAttendanceCompleteness(
          schoolId,
          holidayDate,
          '10:00'
        );

        expect(overview.isHoliday).toBe(true);
        expect(overview.holidayDescription).toBe('Hari Libur Khusus');
      });
    });

    // Test getSchoolAttendanceSummary
    describe('2.2 getSchoolAttendanceSummary (DoD 1)', () => {
      it('menghitung agregat persentase sekolah, tren harian, dan komparasi kelas beserta ranking', async () => {
        const summary = await getSchoolAttendanceSummary(schoolId, {
          startDate: testDate,
          endDate: testDate,
        });

        expect(summary.schoolId).toBe(schoolId);
        expect(summary.overallStats.totalEnrolledStudents).toBe(3); // 2 di X-A, 1 di X-B
        expect(summary.overallStats.totalRecords).toBe(2); // session X-A ada 2 record
        expect(summary.overallStats.totalHadir).toBe(1);
        expect(summary.overallStats.totalAlpa).toBe(1);
        expect(summary.overallStats.overallAttendanceRate).toBe(50.0);

        // Daily trend
        expect(summary.dailyTrend.length).toBe(1);
        expect(summary.dailyTrend[0].date).toBe(testDate);
        expect(summary.dailyTrend[0].attendanceRate).toBe(50.0);

        // Class comparisons
        expect(summary.classComparisons.length).toBe(2);
        const compA = summary.classComparisons.find((c) => c.classId === classAId);
        expect(compA?.attendanceRate).toBe(50.0);
        expect(compA?.atRiskStudentsCount).toBe(1); // studentA2 has EWS log

        const compB = summary.classComparisons.find((c) => c.classId === classBId);
        expect(compB?.attendanceRate).toBe(0.0);
      });
    });

    // Test getAttendanceReportData
    describe('2.3 getAttendanceReportData (DoD 3)', () => {
      it('menghasilkan data laporan lengkap tanpa filter (seluruh kelas & siswa)', async () => {
        const report = await getAttendanceReportData(schoolId, {
          startDate: testDate,
          endDate: testDate,
        });

        expect(report.school.name).toBe('SMA Negeri 1 EduNotify');
        expect(report.school.principalName).toBe('Drs. H. M. Sholihin, M.Pd.');
        expect(principalUserId).toBeDefined();
        expect(report.summary.totalStudents).toBe(3);
        expect(report.summary.totalHadir).toBe(1);
        expect(report.summary.totalAlpa).toBe(1);
        expect(report.summary.attendancePercentage).toBe(50.0);

        // Periksa data siswa
        const st1 = report.students.find((s) => s.studentId === studentA1Id);
        expect(st1?.hadir).toBe(1);
        expect(st1?.alpa).toBe(0);
        expect(st1?.attendanceRate).toBe(100.0);

        const st2 = report.students.find((s) => s.studentId === studentA2Id);
        expect(st2?.hadir).toBe(0);
        expect(st2?.alpa).toBe(1);
        expect(st2?.attendanceRate).toBe(0.0);

        // Logs
        expect(report.logs.length).toBe(2);
      });

      it('memfilter data berdasarkan Kelas tertentu', async () => {
        const report = await getAttendanceReportData(schoolId, {
          startDate: testDate,
          endDate: testDate,
          classId: classAId,
        });

        expect(report.filter.className).toBe('X-A');
        expect(report.summary.totalStudents).toBe(2);
        expect(report.students.every((s) => s.className === 'X-A')).toBe(true);
      });

      it('memfilter data berdasarkan Status Kehadiran (hanya Alpa)', async () => {
        const report = await getAttendanceReportData(schoolId, {
          startDate: testDate,
          endDate: testDate,
          status: 'ABSENT_ALPA',
        });

        expect(report.filter.status).toBe('ABSENT_ALPA');
        expect(report.logs.length).toBe(1);
        expect(report.logs[0].status).toBe('ABSENT_ALPA');
        expect(report.logs[0].studentName).toBe('Bella Safira');
      });

      it('mengisolasi data multitenant dan tidak membocorkan data ke sekolah lain', async () => {
        const reportOther = await getAttendanceReportData(otherSchoolId, {
          startDate: testDate,
          endDate: testDate,
        });

        expect(reportOther.school.name).toBe('SMA Swasta Lain');
        expect(reportOther.summary.totalStudents).toBe(0);
        expect(reportOther.students.length).toBe(0);
        expect(reportOther.logs.length).toBe(0);
      });
    });
  });
});
