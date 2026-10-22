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
  auditLogs,
  USER_ROLES,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  verifyRelayAttendanceAccess,
  getOrCreateAttendanceSession,
  submitAttendanceSession,
  calculateClassAttendanceOverview,
  escalateUncompletedSessions,
  AttendanceConcurrencyError,
  AttendanceAuthorizationError,
  AttendanceHolidayError,
  getDayOfWeek,
} from '@/services/attendanceService';
import { hashPassword } from '@/lib/auth/password';

describe('EDUNOTIFY-03: Attendance Service & Relay Concurrency Engine', () => {
  let schoolId: string;
  let academicYearId: string;
  let classId: string;

  let teacher1Id: string;
  let teacher2Id: string;
  let teacher3Id: string;
  let unscheduledTeacherId: string;
  let adminId: string;

  let student1Id: string;
  let student2Id: string;
  let student3Id: string;

  // We choose Monday (dayOfWeek = 1)
  const mondayDate = '2026-10-19'; // A Monday
  const holidayDate = '2026-10-20'; // A Tuesday set as HOLIDAY

  beforeAll(async () => {
    // 1. Setup School
    const [school] = await db
      .insert(schools)
      .values({
        name: 'SMA Test Relay Attendance',
        npsn: 'RELAY_' + Math.random().toString(36).substring(2, 9),
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

    const dummyHash = await hashPassword('TestPassword123!');

    // 3. Setup Users (Teachers & Admin)
    const [adminUser] = await db
      .insert(users)
      .values({
        schoolId,
        name: 'Admin Sekolah Test',
        email: `admin_${Math.random().toString(36).substring(2, 8)}@test.com`,
        passwordHash: dummyHash,
        role: USER_ROLES.ADMIN_SEKOLAH,
      })
      .returning();
    adminId = adminUser.id;

    const [t1] = await db
      .insert(users)
      .values({
        schoolId,
        name: 'Guru Jam 1 (Matematika)',
        email: `guru1_${Math.random().toString(36).substring(2, 8)}@test.com`,
        passwordHash: dummyHash,
        role: USER_ROLES.GURU_MAPEL,
      })
      .returning();
    teacher1Id = t1.id;

    const [t2] = await db
      .insert(users)
      .values({
        schoolId,
        name: 'Guru Jam 2 (Bahasa Inggris)',
        email: `guru2_${Math.random().toString(36).substring(2, 8)}@test.com`,
        passwordHash: dummyHash,
        role: USER_ROLES.GURU_MAPEL,
      })
      .returning();
    teacher2Id = t2.id;

    const [t3] = await db
      .insert(users)
      .values({
        schoolId,
        name: 'Guru Jam 3 (Fisika)',
        email: `guru3_${Math.random().toString(36).substring(2, 8)}@test.com`,
        passwordHash: dummyHash,
        role: USER_ROLES.GURU_MAPEL,
      })
      .returning();
    teacher3Id = t3.id;

    const [unscheduledT] = await db
      .insert(users)
      .values({
        schoolId,
        name: 'Guru Tanpa Jadwal',
        email: `gurutp_${Math.random().toString(36).substring(2, 8)}@test.com`,
        passwordHash: dummyHash,
        role: USER_ROLES.GURU_MAPEL,
      })
      .returning();
    unscheduledTeacherId = unscheduledT.id;

    // 4. Setup Class X-A
    const [cls] = await db
      .insert(classes)
      .values({
        schoolId,
        academicYearId,
        name: 'X-A Relay Test',
        gradeLevel: '10',
        homeroomTeacherId: teacher1Id,
      })
      .returning();
    classId = cls.id;

    // 5. Setup 3 Students
    const [s1] = await db
      .insert(students)
      .values({
        schoolId,
        nis: 'NIS-R01',
        name: 'Siswa Satu',
        gender: 'L',
        guardianName: 'Wali Satu',
        guardianPhone: '08123456781',
      })
      .returning();
    student1Id = s1.id;

    const [s2] = await db
      .insert(students)
      .values({
        schoolId,
        nis: 'NIS-R02',
        name: 'Siswa Dua',
        gender: 'P',
        guardianName: 'Wali Dua',
        guardianPhone: '08123456782',
      })
      .returning();
    student2Id = s2.id;

    const [s3] = await db
      .insert(students)
      .values({
        schoolId,
        nis: 'NIS-R03',
        name: 'Siswa Tiga',
        gender: 'L',
        guardianName: 'Wali Tiga',
        guardianPhone: '08123456783',
      })
      .returning();
    student3Id = s3.id;

    // Enroll students in class X-A
    await db.insert(classEnrollments).values([
      { schoolId, classId, studentId: student1Id, academicYearId },
      { schoolId, classId, studentId: student2Id, academicYearId },
      { schoolId, classId, studentId: student3Id, academicYearId },
    ]);

    // 6. Setup Teaching Schedules for Monday (dayOfWeek = 1)
    // Period 1: 07:00 - 08:30 (Guru 1)
    // Period 2: 08:30 - 10:00 (Guru 2)
    // Period 3: 10:15 - 11:45 (Guru 3)
    await db.insert(teachingSchedules).values([
      {
        schoolId,
        classId,
        teacherId: teacher1Id,
        subjectName: 'Matematika',
        dayOfWeek: 1,
        periodOrder: 1,
        startTime: '07:00',
        endTime: '08:30',
      },
      {
        schoolId,
        classId,
        teacherId: teacher2Id,
        subjectName: 'Bahasa Inggris',
        dayOfWeek: 1,
        periodOrder: 2,
        startTime: '08:30',
        endTime: '10:00',
      },
      {
        schoolId,
        classId,
        teacherId: teacher3Id,
        subjectName: 'Fisika',
        dayOfWeek: 1,
        periodOrder: 3,
        startTime: '10:15',
        endTime: '11:45',
      },
    ]);

    // 7. Setup Academic Calendar: Tuesday is HOLIDAY
    await db.insert(academicCalendars).values({
      schoolId,
      date: holidayDate,
      dayType: 'HOLIDAY',
      description: 'Hari Libur Nasional Uji Coba',
    });
  });

  afterAll(async () => {
    if (schoolId) {
      await db.delete(schools).where(eq(schools.id, schoolId));
    }
  });

  // ==========================================
  // Test 1: Day of Week & Calendar Holiday
  // ==========================================
  describe('1. Calendar & Holiday Validation', () => {
    it('correctly calculates day of week (Monday = 1)', () => {
      expect(getDayOfWeek('2026-10-19')).toBe(1); // Monday
      expect(getDayOfWeek('2026-10-20')).toBe(2); // Tuesday
      expect(getDayOfWeek('2026-10-25')).toBe(7); // Sunday
    });

    it('rejects attendance initialization on school holiday', async () => {
      await expect(
        getOrCreateAttendanceSession(schoolId, classId, holidayDate, teacher1Id)
      ).rejects.toThrow(AttendanceHolidayError);
    });

    it('rejects attendance submission on school holiday', async () => {
      await expect(
        submitAttendanceSession({
          schoolId,
          classId,
          date: holidayDate,
          teacherUserId: teacher1Id,
          records: [{ studentId: student1Id, status: 'PRESENT' }],
        })
      ).rejects.toThrow(AttendanceHolidayError);
    });
  });

  // ==========================================
  // Test 2: Auto-Initialization of Students
  // ==========================================
  describe('2. Auto-initialization of Students as Belum Diabsen (UNRECORDED)', () => {
    it('creates draft session and initializes all enrolled students as UNRECORDED', async () => {
      const result = await getOrCreateAttendanceSession(
        schoolId,
        classId,
        mondayDate,
        teacher1Id,
        { currentTime: '07:30' }
      );

      expect(result.session).toBeDefined();
      expect(result.session.status).toBe('DRAFT');
      expect(result.records).toHaveLength(3);

      for (const rec of result.records) {
        expect(rec.status).toBe('UNRECORDED');
        expect(rec.name).toBeDefined();
      }

      // Check DB records
      const dbRecords = await db
        .select()
        .from(attendanceRecords)
        .where(eq(attendanceRecords.sessionId, result.session.id));

      expect(dbRecords).toHaveLength(3);
      for (const r of dbRecords) {
        expect(r.status).toBe('UNRECORDED');
      }
    });
  });

  // ==========================================
  // Test 3: Backend Teacher Authorization
  // ==========================================
  describe('3. Backend Teacher Authorization Validation', () => {
    it('rejects a teacher who is NOT scheduled for the class on that day with 403 authorization error', async () => {
      // Unscheduled teacher tries to check relay access
      const access = await verifyRelayAttendanceAccess(
        schoolId,
        classId,
        mondayDate,
        unscheduledTeacherId,
        { currentTime: '07:30' }
      );

      expect(access.authorized).toBe(false);
      expect(access.reason).toBe('NOT_SCHEDULED_TEACHER');
      expect(access.message).toContain('tidak memiliki jadwal mengajar');

      // Unscheduled teacher tries to submit attendance
      await expect(
        submitAttendanceSession({
          schoolId,
          classId,
          date: mondayDate,
          teacherUserId: unscheduledTeacherId,
          records: [{ studentId: student1Id, status: 'PRESENT' }],
          options: { currentTime: '07:30' },
        })
      ).rejects.toThrow(AttendanceAuthorizationError);
    });
  });

  // ==========================================
  // Test 4: Relay Mechanism (Estafet Jam 1 vs Jam 2 vs Jam 3)
  // ==========================================
  describe('4. Schedule-Driven Relay Attendance Flow', () => {
    it('denies Guru Jam 2 when Period 1 is still active (before Period 2 start time)', async () => {
      // At 07:30, it is Period 1 time (07:00 - 08:30). Guru 2 period is 08:30.
      const accessGuru2 = await verifyRelayAttendanceAccess(
        schoolId,
        classId,
        mondayDate,
        teacher2Id,
        { currentTime: '07:30' }
      );

      expect(accessGuru2.authorized).toBe(false);
      expect(accessGuru2.reason).toBe('EARLIER_PERIOD_PENDING');
      expect(accessGuru2.message).toContain('Jam mengajar Anda belum dimulai');

      // Attempt submit by Guru 2 during period 1 time fails
      await expect(
        submitAttendanceSession({
          schoolId,
          classId,
          date: mondayDate,
          teacherUserId: teacher2Id,
          records: [{ studentId: student1Id, status: 'PRESENT' }],
          options: { currentTime: '07:30' },
        })
      ).rejects.toThrow(AttendanceAuthorizationError);
    });

    it('allows Guru Jam 2 to fill when Period 2 arrives and Period 1 has NOT submitted (Relay Handover)', async () => {
      // At 08:45, Period 2 has started. Guru 1 did not submit.
      const accessGuru2 = await verifyRelayAttendanceAccess(
        schoolId,
        classId,
        mondayDate,
        teacher2Id,
        { currentTime: '08:45' }
      );

      expect(accessGuru2.authorized).toBe(true);
      expect(accessGuru2.canEdit).toBe(true);
      expect(accessGuru2.isReadOnly).toBe(false);
      expect(accessGuru2.activePeriod).toBe(2);
      expect(accessGuru2.reason).toBe('AUTHORIZED');
    });

    it('locks session as read-only for Guru Jam 3 after Guru Jam 2 officially submits', async () => {
      // Guru Jam 2 submits official attendance at 09:00
      const submitResult = await submitAttendanceSession({
        schoolId,
        classId,
        date: mondayDate,
        teacherUserId: teacher2Id,
        records: [
          { studentId: student1Id, status: 'PRESENT' },
          { studentId: student2Id, status: 'SICK', notes: 'Flu berat' },
          { studentId: student3Id, status: 'ABSENT_ALPA' },
        ],
        options: { currentTime: '09:00' },
      });

      expect(submitResult.success).toBe(true);
      expect(submitResult.isLateSubmission).toBe(false);
      expect(submitResult.submittedByName).toContain('Guru Jam 2');

      // Now at 10:30 (Period 3), Guru Jam 3 opens the session
      const accessGuru3 = await verifyRelayAttendanceAccess(
        schoolId,
        classId,
        mondayDate,
        teacher3Id,
        { currentTime: '10:30' }
      );

      expect(accessGuru3.authorized).toBe(true);
      expect(accessGuru3.canEdit).toBe(false);
      expect(accessGuru3.isReadOnly).toBe(true);
      expect(accessGuru3.reason).toBe('ALREADY_SUBMITTED');
      expect(accessGuru3.message).toContain('Presensi kelas ini telah disubmit oleh Guru Jam 2');

      // Guru Jam 3 attempts to submit -> rejected because session is locked / SUBMITTED
      await expect(
        submitAttendanceSession({
          schoolId,
          classId,
          date: mondayDate,
          teacherUserId: teacher3Id,
          records: [{ studentId: student1Id, status: 'PRESENT' }],
          options: { currentTime: '10:35' },
        })
      ).rejects.toThrow(AttendanceConcurrencyError);
    });
  });

  // ==========================================
  // Test 5: Concurrency Protection & Parallel Submit Race Condition
  // ==========================================
  describe('5. Concurrency Protection & Race Condition Test', () => {
    let raceClassId: string;
    const raceDate = '2026-10-26'; // Another Monday

    beforeAll(async () => {
      // Setup a second class specifically to test parallel race condition
      const [raceClass] = await db
        .insert(classes)
        .values({
          schoolId,
          academicYearId,
          name: 'X-B Concurrency Test',
          gradeLevel: '10',
          homeroomTeacherId: teacher1Id,
        })
        .returning();
      raceClassId = raceClass.id;

      await db.insert(classEnrollments).values([
        { schoolId, classId: raceClassId, studentId: student1Id, academicYearId },
        { schoolId, classId: raceClassId, studentId: student2Id, academicYearId },
      ]);

      // Schedule Period 1 for Guru 1 and Period 2 for Guru 2
      await db.insert(teachingSchedules).values([
        {
          schoolId,
          classId: raceClassId,
          teacherId: teacher1Id,
          subjectName: 'Sejarah',
          dayOfWeek: 1,
          periodOrder: 1,
          startTime: '07:00',
          endTime: '08:30',
        },
        {
          schoolId,
          classId: raceClassId,
          teacherId: teacher2Id,
          subjectName: 'Geografi',
          dayOfWeek: 1,
          periodOrder: 2,
          startTime: '08:30',
          endTime: '10:00',
        },
      ]);
    });

    it('handles concurrent parallel submissions atomically, accepting only one and rejecting the duplicate with friendly error', async () => {
      // Simulate both Guru 1 and Guru 2 submitting at the exact same moment at period change (08:30)
      const p1 = submitAttendanceSession({
        schoolId,
        classId: raceClassId,
        date: raceDate,
        teacherUserId: teacher1Id,
        records: [
          { studentId: student1Id, status: 'PRESENT' },
          { studentId: student2Id, status: 'PRESENT' },
        ],
        options: { currentTime: '08:30' },
      });

      const p2 = submitAttendanceSession({
        schoolId,
        classId: raceClassId,
        date: raceDate,
        teacherUserId: teacher2Id,
        records: [
          { studentId: student1Id, status: 'SICK' },
          { studentId: student2Id, status: 'PRESENT' },
        ],
        options: { currentTime: '08:30' },
      });

      const results = await Promise.allSettled([p1, p2]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      // Exactly ONE submission must succeed, and exactly ONE must be rejected
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      // The rejected error must be an AttendanceConcurrencyError with friendly explanation
      const rejectionReason = (rejected[0] as PromiseRejectedResult).reason;
      expect(rejectionReason).toBeInstanceOf(AttendanceConcurrencyError);
      expect(rejectionReason.message).toMatch(
        /Presensi untuk kelas ini (telah|baru saja) disubmit oleh/
      );
      expect(rejectionReason.message).toContain('Data Anda tidak disimpan untuk mencegah duplikasi');

      // Verify DB state has exactly 1 attendance session
      const sessionsInDb = await db
        .select()
        .from(attendanceSessions)
        .where(
          and(
            eq(attendanceSessions.schoolId, schoolId),
            eq(attendanceSessions.classId, raceClassId),
            eq(attendanceSessions.date, raceDate)
          )
        );

      expect(sessionsInDb).toHaveLength(1);
      expect(sessionsInDb[0].status).toBe('SUBMITTED');

      // Verify audit logs recorded the winning action
      const auditLogRows = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.schoolId, schoolId),
            eq(auditLogs.action, 'SUBMIT_ATTENDANCE'),
            eq(auditLogs.entityId, sessionsInDb[0].id)
          )
        );

      expect(auditLogRows).toHaveLength(1);
    });
  });

  // ==========================================
  // Test 6: 12.00 Warning Trigger
  // ==========================================
  describe('6. Deterministic 12.00 Warning Trigger Calculation', () => {
    let warnClassId: string;
    const warnDate = '2026-11-02'; // Monday

    beforeAll(async () => {
      const [wClass] = await db
        .insert(classes)
        .values({
          schoolId,
          academicYearId,
          name: 'X-C Warning Test',
          gradeLevel: '10',
          homeroomTeacherId: teacher1Id,
        })
        .returning();
      warnClassId = wClass.id;

      await db.insert(classEnrollments).values([
        { schoolId, classId: warnClassId, studentId: student1Id, academicYearId },
      ]);

      await db.insert(teachingSchedules).values([
        {
          schoolId,
          classId: warnClassId,
          teacherId: teacher1Id,
          subjectName: 'Biologi',
          dayOfWeek: 1,
          periodOrder: 1,
          startTime: '08:00',
          endTime: '13:00',
        },
      ]);
    });

    it('does NOT trigger 12:00 warning before 12:00', async () => {
      const overview = await calculateClassAttendanceOverview(
        schoolId,
        warnClassId,
        warnDate,
        '10:30'
      );

      expect(overview.isSubmitted).toBe(false);
      expect(overview.isWarning12pm).toBe(false);
      expect(overview.warningMessage).toBeNull();
    });

    it('triggers 12:00 warning banner when unsubmitted at or after 12:00', async () => {
      const overview = await calculateClassAttendanceOverview(
        schoolId,
        warnClassId,
        warnDate,
        '12:05'
      );

      expect(overview.isSubmitted).toBe(false);
      expect(overview.isWarning12pm).toBe(true);
      expect(overview.warningMessage).toContain('belum mengisi presensi per 12.00 WIB');
    });

    it('clears 12:00 warning once attendance is submitted', async () => {
      await submitAttendanceSession({
        schoolId,
        classId: warnClassId,
        date: warnDate,
        teacherUserId: teacher1Id,
        records: [{ studentId: student1Id, status: 'PRESENT' }],
        options: { currentTime: '12:10' },
      });

      const overviewAfter = await calculateClassAttendanceOverview(
        schoolId,
        warnClassId,
        warnDate,
        '12:15'
      );

      expect(overviewAfter.isSubmitted).toBe(true);
      expect(overviewAfter.isWarning12pm).toBe(false);
      expect(overviewAfter.sessionStatus).toBe('SUBMITTED');
    });
  });

  // ==========================================
  // Test 7: End-of-Day Escalation (UNCOMPLETED_ALERT)
  // ==========================================
  describe('7. End-of-Day Escalation (UNCOMPLETED_ALERT)', () => {
    let uncompletedClassId: string;
    const escalateDate = '2026-11-09'; // Monday

    beforeAll(async () => {
      const [uClass] = await db
        .insert(classes)
        .values({
          schoolId,
          academicYearId,
          name: 'X-D Escalation Test',
          gradeLevel: '10',
          homeroomTeacherId: teacher1Id,
        })
        .returning();
      uncompletedClassId = uClass.id;

      await db.insert(classEnrollments).values([
        { schoolId, classId: uncompletedClassId, studentId: student1Id, academicYearId },
      ]);

      // Schedule ends at 13:30
      await db.insert(teachingSchedules).values([
        {
          schoolId,
          classId: uncompletedClassId,
          teacherId: teacher1Id,
          subjectName: 'Kimia',
          dayOfWeek: 1,
          periodOrder: 1,
          startTime: '08:00',
          endTime: '13:30',
        },
      ]);
    });

    it('identifies uncompleted alert after all teaching schedules have ended', async () => {
      // At 14:00 (past 13:30), the schedule is over
      const overview = await calculateClassAttendanceOverview(
        schoolId,
        uncompletedClassId,
        escalateDate,
        '14:00'
      );

      expect(overview.isSubmitted).toBe(false);
      expect(overview.isUncompletedAlert).toBe(true);
      expect(overview.sessionStatus).toBe('UNCOMPLETED_ALERT');
      expect(overview.warningMessage).toContain('belum mengisi presensi hingga akhir jam KBM');
    });

    it('escalateUncompletedSessions updates database status to UNCOMPLETED_ALERT', async () => {
      const res = await escalateUncompletedSessions(
        schoolId,
        escalateDate,
        '15:00'
      );

      expect(res.escalatedClassIds).toContain(uncompletedClassId);

      // Verify in DB
      const [dbSession] = await db
        .select()
        .from(attendanceSessions)
        .where(
          and(
            eq(attendanceSessions.schoolId, schoolId),
            eq(attendanceSessions.classId, uncompletedClassId),
            eq(attendanceSessions.date, escalateDate)
          )
        );

      expect(dbSession).toBeDefined();
      expect(dbSession.status).toBe('UNCOMPLETED_ALERT');
    });
  });

  // ==========================================
  // Test 8: Late Submission (is_late_submission = true)
  // ==========================================
  describe('8. Late Submission After School Hours', () => {
    let lateClassId: string;
    const lateDate = '2026-11-16'; // Monday

    beforeAll(async () => {
      const [lClass] = await db
        .insert(classes)
        .values({
          schoolId,
          academicYearId,
          name: 'X-E Late Filing Test',
          gradeLevel: '10',
          homeroomTeacherId: teacher1Id,
        })
        .returning();
      lateClassId = lClass.id;

      await db.insert(classEnrollments).values([
        { schoolId, classId: lateClassId, studentId: student1Id, academicYearId },
      ]);

      // Schedule ends at 12:00
      await db.insert(teachingSchedules).values([
        {
          schoolId,
          classId: lateClassId,
          teacherId: teacher1Id,
          subjectName: 'Seni Budaya',
          dayOfWeek: 1,
          periodOrder: 1,
          startTime: '08:00',
          endTime: '12:00',
        },
      ]);
    });

    it('records is_late_submission = true when submitted after schedule end time', async () => {
      // Submitted at 16:00 (after school ended at 12:00)
      const submitRes = await submitAttendanceSession({
        schoolId,
        classId: lateClassId,
        date: lateDate,
        teacherUserId: teacher1Id,
        records: [{ studentId: student1Id, status: 'PRESENT' }],
        options: { currentTime: '16:00' },
      });

      expect(submitRes.success).toBe(true);
      expect(submitRes.isLateSubmission).toBe(true);

      // Verify in DB
      const [savedSession] = await db
        .select()
        .from(attendanceSessions)
        .where(eq(attendanceSessions.id, submitRes.sessionId));

      expect(savedSession.isLateSubmission).toBe(true);
      expect(savedSession.status).toBe('SUBMITTED');

      // Verify audit log has isLateSubmission flag
      const [audit] = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.entityId, submitRes.sessionId));

      expect(audit).toBeDefined();
      const parsedDetails = JSON.parse(audit.detailsJson || '{}');
      expect(parsedDetails.isLateSubmission).toBe(true);
    });
  });
});
