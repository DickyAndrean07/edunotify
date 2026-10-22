import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/db';
import {
  schools,
  academicYears,
  classes,
  students,
  classEnrollments,
  users,
  attendanceSessions,
  attendanceRecords,
  attendanceCorrections,
  auditLogs,
  teachingSchedules,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  calculateCalendarDaysDiff,
  verifyCorrectionAccess,
  correctAttendanceRecord,
  getCorrectionHistory,
  CorrectionValidationError,
  CorrectionAuthorizationError,
} from '@/services/correctionService';
import { hashPassword } from '@/lib/auth/password';

describe('EDUNOTIFY-04: Attendance Correction Service & Audit Trail', () => {
  let schoolId: string;
  let academicYearId: string;
  let classId: string;
  let homeroomTeacherId: string;
  let originalTeacherId: string;
  let otherTeacherId: string;
  let adminId: string;
  let studentId: string;
  let recordId: string;
  let sessionId: string;

  const sessionDate = '2026-10-19';

  beforeAll(async () => {
    // 1. Setup School
    const [school] = await db
      .insert(schools)
      .values({
        name: 'SMA Negeri 1 Prestasi',
        npsn: 'CORR_' + Math.random().toString(36).substring(2, 9),
      })
      .returning();
    schoolId = school.id;

    // 2. Setup Academic Year
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

    // 3. Setup Users: Homeroom, Original Teacher, Other Teacher, Admin
    const [wali] = await db
      .insert(users)
      .values({
        schoolId,
        name: 'Budi Santoso, S.Pd. (Wali Kelas)',
        email: `wali_${Math.random().toString(36).substring(2, 8)}@test.com`,
        passwordHash: await hashPassword('password123'),
        role: 'WALI_KELAS',
      })
      .returning();
    homeroomTeacherId = wali.id;

    const [guruAsli] = await db
      .insert(users)
      .values({
        schoolId,
        name: 'Siti Aminah, M.Pd. (Guru Pengisi)',
        email: `guru1_${Math.random().toString(36).substring(2, 8)}@test.com`,
        passwordHash: await hashPassword('password123'),
        role: 'GURU_MAPEL',
      })
      .returning();
    originalTeacherId = guruAsli.id;

    const [guruLain] = await db
      .insert(users)
      .values({
        schoolId,
        name: 'Joko Prabowo, S.T. (Guru Lain)',
        email: `guru2_${Math.random().toString(36).substring(2, 8)}@test.com`,
        passwordHash: await hashPassword('password123'),
        role: 'GURU_MAPEL',
      })
      .returning();
    otherTeacherId = guruLain.id;

    const [admin] = await db
      .insert(users)
      .values({
        schoolId,
        name: 'Admin Sekolah EduNotify',
        email: `admin_${Math.random().toString(36).substring(2, 8)}@test.com`,
        passwordHash: await hashPassword('password123'),
        role: 'ADMIN_SEKOLAH',
      })
      .returning();
    adminId = admin.id;

    // 4. Setup Class with homeroom teacher
    const [cls] = await db
      .insert(classes)
      .values({
        schoolId,
        academicYearId,
        name: 'XI-MIPA 1',
        gradeLevel: '11',
        homeroomTeacherId,
      })
      .returning();
    classId = cls.id;

    // 5. Setup Teaching Schedule for Guru Asli on Monday (dayOfWeek = 1)
    await db.insert(teachingSchedules).values({
      schoolId,
      classId,
      teacherId: originalTeacherId,
      subjectName: 'Matematika',
      dayOfWeek: 1,
      periodOrder: 1,
      startTime: '07:00',
      endTime: '08:30',
    });

    // 6. Setup Student & Enrollment
    const [student] = await db
      .insert(students)
      .values({
        schoolId,
        nis: '20261101',
        name: 'Rian Pratama',
        gender: 'L',
        guardianName: 'Ibu Ratna',
        guardianPhone: '081399887766',
      })
      .returning();
    studentId = student.id;

    await db.insert(classEnrollments).values({
      schoolId,
      classId,
      studentId,
      academicYearId,
    });

    // 7. Setup Attendance Session & Record initially ABSENT_ALPA
    const [sess] = await db
      .insert(attendanceSessions)
      .values({
        schoolId,
        classId,
        date: sessionDate, // 2026-10-19 (Monday)
        submittedByTeacherId: originalTeacherId,
        status: 'SUBMITTED',
      })
      .returning();
    sessionId = sess.id;

    const [rec] = await db
      .insert(attendanceRecords)
      .values({
        schoolId,
        sessionId,
        studentId,
        status: 'ABSENT_ALPA',
      })
      .returning();
    recordId = rec.id;
  });

  afterAll(async () => {
    if (schoolId) {
      await db.delete(schools).where(eq(schools.id, schoolId));
    }
  });

  // ==========================================
  // 1. Calendar Days Diff Logic
  // ==========================================
  describe('1. Calendar Days Difference', () => {
    it('calculates diff accurately across days', () => {
      expect(calculateCalendarDaysDiff('2026-10-19', '2026-10-19')).toBe(0); // Hari H
      expect(calculateCalendarDaysDiff('2026-10-19', '2026-10-20')).toBe(1); // H-1
      expect(calculateCalendarDaysDiff('2026-10-19', '2026-10-22')).toBe(3); // H-3
      expect(calculateCalendarDaysDiff('2026-10-19', '2026-10-23')).toBe(4); // > H-3
      expect(calculateCalendarDaysDiff('2026-10-20', '2026-10-19')).toBe(-1); // Future
    });
  });

  // ==========================================
  // 2. RBAC Correction Matrix Unit Validation
  // ==========================================
  describe('2. RBAC Correction Matrix Access Rules', () => {
    it('rejects future attendance date corrections', () => {
      const res = verifyCorrectionAccess({
        attendanceDate: '2026-10-20',
        currentDate: '2026-10-19',
        userRole: 'WALI_KELAS',
        userId: homeroomTeacherId,
        homeroomTeacherId,
      });
      expect(res.isEligible).toBe(false);
      expect(res.window).toBe('FUTURE_DATE');
    });

    describe('Hari H (diffDays = 0)', () => {
      it('allows Guru Pengisi Asli', () => {
        const res = verifyCorrectionAccess({
          attendanceDate: '2026-10-19',
          currentDate: '2026-10-19',
          userRole: 'GURU_MAPEL',
          userId: originalTeacherId,
          homeroomTeacherId,
          submittedByTeacherId: originalTeacherId,
        });
        expect(res.isEligible).toBe(true);
        expect(res.window).toBe('HARI_H');
      });

      it('allows Wali Kelas', () => {
        const res = verifyCorrectionAccess({
          attendanceDate: '2026-10-19',
          currentDate: '2026-10-19',
          userRole: 'WALI_KELAS',
          userId: homeroomTeacherId,
          homeroomTeacherId,
          submittedByTeacherId: originalTeacherId,
        });
        expect(res.isEligible).toBe(true);
        expect(res.window).toBe('HARI_H');
      });

      it('allows Admin Sekolah', () => {
        const res = verifyCorrectionAccess({
          attendanceDate: '2026-10-19',
          currentDate: '2026-10-19',
          userRole: 'ADMIN_SEKOLAH',
          userId: adminId,
          homeroomTeacherId,
          submittedByTeacherId: originalTeacherId,
        });
        expect(res.isEligible).toBe(true);
        expect(res.window).toBe('HARI_H');
      });

      it('rejects unrelated teacher', () => {
        const res = verifyCorrectionAccess({
          attendanceDate: '2026-10-19',
          currentDate: '2026-10-19',
          userRole: 'GURU_MAPEL',
          userId: otherTeacherId,
          homeroomTeacherId,
          submittedByTeacherId: originalTeacherId,
        });
        expect(res.isEligible).toBe(false);
        expect(res.message).toContain('Hanya Guru Pengisi atau Wali Kelas');
      });
    });

    describe('H-1 s/d H-3 (diffDays = 1..3)', () => {
      it('allows Wali Kelas on H-1, H-2, H-3', () => {
        for (const diff of [1, 2, 3]) {
          const res = verifyCorrectionAccess({
            attendanceDate: '2026-10-19',
            currentDate: `2026-10-${19 + diff}`,
            userRole: 'WALI_KELAS',
            userId: homeroomTeacherId,
            homeroomTeacherId,
            submittedByTeacherId: originalTeacherId,
          });
          expect(res.isEligible).toBe(true);
          expect(res.window).toBe('H_MIN_1_TO_3');
        }
      });

      it('rejects Guru Pengisi Asli on H-1 (locked for subject teacher)', () => {
        const res = verifyCorrectionAccess({
          attendanceDate: '2026-10-19',
          currentDate: '2026-10-20',
          userRole: 'GURU_MAPEL',
          userId: originalTeacherId,
          homeroomTeacherId,
          submittedByTeacherId: originalTeacherId,
        });
        expect(res.isEligible).toBe(false);
        expect(res.window).toBe('H_MIN_1_TO_3');
        expect(res.message).toContain('Hanya Wali Kelas yang berwenang');
      });

      it('rejects other teacher on H-2', () => {
        const res = verifyCorrectionAccess({
          attendanceDate: '2026-10-19',
          currentDate: '2026-10-21',
          userRole: 'GURU_MAPEL',
          userId: otherTeacherId,
          homeroomTeacherId,
        });
        expect(res.isEligible).toBe(false);
      });
    });

    describe('> H-3 (diffDays > 3)', () => {
      it('allows Admin Sekolah on H-4 or later', () => {
        const res = verifyCorrectionAccess({
          attendanceDate: '2026-10-19',
          currentDate: '2026-10-25', // 6 days later
          userRole: 'ADMIN_SEKOLAH',
          userId: adminId,
          homeroomTeacherId,
        });
        expect(res.isEligible).toBe(true);
        expect(res.window).toBe('MORE_THAN_H_MIN_3');
      });

      it('locks out Wali Kelas on > H-3', () => {
        const res = verifyCorrectionAccess({
          attendanceDate: '2026-10-19',
          currentDate: '2026-10-24', // 5 days later
          userRole: 'WALI_KELAS',
          userId: homeroomTeacherId,
          homeroomTeacherId,
        });
        expect(res.isEligible).toBe(false);
        expect(res.message).toContain('hanya dapat dilakukan oleh Admin Sekolah');
      });

      it('locks out Guru Mapel on > H-3', () => {
        const res = verifyCorrectionAccess({
          attendanceDate: '2026-10-19',
          currentDate: '2026-10-24',
          userRole: 'GURU_MAPEL',
          userId: originalTeacherId,
          homeroomTeacherId,
          submittedByTeacherId: originalTeacherId,
        });
        expect(res.isEligible).toBe(false);
      });
    });
  });

  // ==========================================
  // 3. Form Validation (Reason min. 10 chars)
  // ==========================================
  describe('3. Correction Reason Validation', () => {
    it('throws error if reason is empty or less than 10 characters', async () => {
      await expect(
        correctAttendanceRecord({
          schoolId,
          attendanceRecordId: recordId,
          correctedByUserId: homeroomTeacherId,
          userRole: 'WALI_KELAS',
          newStatus: 'PRESENT',
          reason: 'Salah', // only 5 characters
          currentDate: '2026-10-19',
        })
      ).rejects.toThrow(CorrectionValidationError);

      await expect(
        correctAttendanceRecord({
          schoolId,
          attendanceRecordId: recordId,
          correctedByUserId: homeroomTeacherId,
          userRole: 'WALI_KELAS',
          newStatus: 'PRESENT',
          reason: '   123456789   ', // 9 characters trimmed
          currentDate: '2026-10-19',
        })
      ).rejects.toThrow(CorrectionValidationError);
    });

    it('throws error if newStatus is identical to current status', async () => {
      await expect(
        correctAttendanceRecord({
          schoolId,
          attendanceRecordId: recordId,
          correctedByUserId: homeroomTeacherId,
          userRole: 'WALI_KELAS',
          newStatus: 'ABSENT_ALPA', // currently already ABSENT_ALPA
          reason: 'Alasan perubahan yang panjang dan jelas',
          currentDate: '2026-10-19',
        })
      ).rejects.toThrow(CorrectionValidationError);
    });
  });

  // ==========================================
  // 4. End-to-End Correction Workflow & Audit Log
  // ==========================================
  describe('4. End-to-End Correction Execution & Audit Trail', () => {
    it('executes Hari H correction by Guru Pengisi Asli', async () => {
      const res = await correctAttendanceRecord({
        schoolId,
        attendanceRecordId: recordId,
        correctedByUserId: originalTeacherId,
        userRole: 'GURU_MAPEL',
        newStatus: 'PRESENT',
        reason: 'Siswa hadir terlambat 10 menit karena ban bocor',
        currentDate: '2026-10-19',
      });

      expect(res.success).toBe(true);
      expect(res.accessWindow).toBe('HARI_H');
      expect(res.diffDays).toBe(0);
      expect(res.updatedRecord.status).toBe('PRESENT');
      expect(res.correction.oldStatus).toBe('ABSENT_ALPA');
      expect(res.correction.newStatus).toBe('PRESENT');
      expect(res.correction.reason).toBe(
        'Siswa hadir terlambat 10 menit karena ban bocor'
      );

      // Verify Audit Log
      const [audit] = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.schoolId, schoolId),
            eq(auditLogs.entityId, recordId),
            eq(auditLogs.action, 'ATTENDANCE_CORRECTION')
          )
        )
        .limit(1);

      expect(audit).toBeDefined();
      expect(audit.userId).toBe(originalTeacherId);
    });

    it('rejects Guru Pengisi Asli on H-2 (must be Wali Kelas)', async () => {
      await expect(
        correctAttendanceRecord({
          schoolId,
          attendanceRecordId: recordId,
          correctedByUserId: originalTeacherId,
          userRole: 'GURU_MAPEL',
          newStatus: 'SICK',
          reason: 'Mau ubah tapi guru mapel tidak boleh di H-2',
          currentDate: '2026-10-21', // H-2
        })
      ).rejects.toThrow(CorrectionAuthorizationError);
    });

    it('executes H-2 correction by Wali Kelas with post-day audit flag', async () => {
      const res = await correctAttendanceRecord({
        schoolId,
        attendanceRecordId: recordId,
        correctedByUserId: homeroomTeacherId,
        userRole: 'WALI_KELAS',
        newStatus: 'SICK',
        reason: 'Orang tua melampirkan surat dokter via WA konfirmasi',
        currentDate: '2026-10-21', // H-2
      });

      expect(res.success).toBe(true);
      expect(res.accessWindow).toBe('H_MIN_1_TO_3');
      expect(res.diffDays).toBe(2);
      expect(res.updatedRecord.status).toBe('SICK');
      expect(res.correction.oldStatus).toBe('PRESENT');
      expect(res.correction.newStatus).toBe('SICK');

      // Verify Audit Log has ATTENDANCE_CORRECTION_POST_DAY
      const [audit] = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.schoolId, schoolId),
            eq(auditLogs.entityId, recordId),
            eq(auditLogs.action, 'ATTENDANCE_CORRECTION_POST_DAY')
          )
        )
        .limit(1);

      expect(audit).toBeDefined();
      expect(audit.userId).toBe(homeroomTeacherId);
    });

    it('locks out Wali Kelas on H-5 (> H-3)', async () => {
      await expect(
        correctAttendanceRecord({
          schoolId,
          attendanceRecordId: recordId,
          correctedByUserId: homeroomTeacherId,
          userRole: 'WALI_KELAS',
          newStatus: 'PERMIT',
          reason: 'Wali kelas mencoba koreksi setelah 5 hari kalender',
          currentDate: '2026-10-24', // H-5
        })
      ).rejects.toThrow(CorrectionAuthorizationError);
    });

    it('executes > H-3 correction by Admin Sekolah', async () => {
      const res = await correctAttendanceRecord({
        schoolId,
        attendanceRecordId: recordId,
        correctedByUserId: adminId,
        userRole: 'ADMIN_SEKOLAH',
        newStatus: 'PERMIT',
        reason: 'Dispensasi resmi Kepala Sekolah untuk lomba sains tingkat provinsi',
        currentDate: '2026-10-24', // H-5
      });

      expect(res.success).toBe(true);
      expect(res.accessWindow).toBe('MORE_THAN_H_MIN_3');
      expect(res.diffDays).toBe(5);
      expect(res.updatedRecord.status).toBe('PERMIT');
      expect(res.correction.oldStatus).toBe('SICK');
      expect(res.correction.newStatus).toBe('PERMIT');
    });

    it('maintains full immutable history in attendance_corrections (no data lost)', async () => {
      const history = await getCorrectionHistory(schoolId, recordId);
      // We made 3 corrections:
      // 1. ABSENT_ALPA -> PRESENT (by Guru Asli)
      // 2. PRESENT -> SICK (by Wali Kelas)
      // 3. SICK -> PERMIT (by Admin)
      expect(history.length).toBe(3);

      // Ordered descending by createdAt
      expect(history[0].oldStatus).toBe('SICK');
      expect(history[0].newStatus).toBe('PERMIT');
      expect(history[0].correctedBy.id).toBe(adminId);

      expect(history[1].oldStatus).toBe('PRESENT');
      expect(history[1].newStatus).toBe('SICK');
      expect(history[1].correctedBy.id).toBe(homeroomTeacherId);

      expect(history[2].oldStatus).toBe('ABSENT_ALPA');
      expect(history[2].newStatus).toBe('PRESENT');
      expect(history[2].correctedBy.id).toBe(originalTeacherId);
    });
  });
});
