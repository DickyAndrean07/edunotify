import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/db';
import { schools, academicYears } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
  createTeachingSchedule,
  getTeachingSchedules,
  updateTeachingSchedule,
  deleteTeachingSchedule,
  setAcademicCalendar,
  getAcademicCalendars,
  deleteAcademicCalendarByDate,
} from '@/services/masterDataService';

describe('Master Data Service Unit Tests', () => {
  let schoolAId: string;
  let schoolBId: string;
  let academicYearAId: string;

  beforeAll(async () => {
    // 1. Create two separate schools to test multitenancy isolation
    const [schoolA] = await db
      .insert(schools)
      .values({
        name: 'SMA Multitenant A',
        npsn: 'MA_' + Math.random().toString(36).substring(2, 10),
      })
      .returning();
    schoolAId = schoolA.id;

    const [schoolB] = await db
      .insert(schools)
      .values({
        name: 'SMA Multitenant B',
        npsn: 'MB_' + Math.random().toString(36).substring(2, 10),
      })
      .returning();
    schoolBId = schoolB.id;

    // Academic Year for School A
    const [ayA] = await db
      .insert(academicYears)
      .values({
        schoolId: schoolAId,
        name: '2026/2027',
        semester: 'GANJIL',
        startDate: '2026-07-01',
        endDate: '2026-12-31',
        isActive: true,
      })
      .returning();
    academicYearAId = ayA.id;
  });

  afterAll(async () => {
    if (schoolAId) await db.delete(schools).where(eq(schools.id, schoolAId));
    if (schoolBId) await db.delete(schools).where(eq(schools.id, schoolBId));
  });

  describe('Students CRUD & Multitenancy', () => {
    let createdStudentId: string;

    it('creates a new student and sanitizes XSS', async () => {
      const student = await createStudent(schoolAId, {
        nis: 'NIS-001',
        name: '<script>alert(1)</script>Ahmad Zaki',
        gender: 'L',
        guardianName: 'Pak Zaki',
        guardianPhone: '08123456789',
      });

      expect(student.id).toBeDefined();
      expect(student.name).toBe('Ahmad Zaki'); // Sanitized
      expect(student.schoolId).toBe(schoolAId);
      createdStudentId = student.id;
    });

    it('prevents duplicate NIS in the same school', async () => {
      await expect(
        createStudent(schoolAId, {
          nis: 'NIS-001',
          name: 'Ahmad Duplikat',
          gender: 'L',
        })
      ).rejects.toThrow(/sudah terdaftar di sekolah ini/);
    });

    it('allows same NIS in a different school (multitenancy isolation)', async () => {
      const studentSchoolB = await createStudent(schoolBId, {
        nis: 'NIS-001', // Same NIS as School A
        name: 'Siswa Sekolah B',
        gender: 'P',
      });
      expect(studentSchoolB.id).toBeDefined();
      expect(studentSchoolB.schoolId).toBe(schoolBId);
    });

    it('gets students with search and pagination', async () => {
      const result = await getStudents(schoolAId, {
        search: 'Ahmad',
        page: 1,
        limit: 10,
      });

      expect(result.total).toBe(1);
      expect(result.students[0].name).toBe('Ahmad Zaki');
    });

    it('does not leak students from School A into School B', async () => {
      const resultB = await getStudents(schoolBId, {
        search: 'Ahmad',
      });
      expect(resultB.total).toBe(0);
    });

    it('updates student details', async () => {
      const updated = await updateStudent(schoolAId, createdStudentId, {
        name: 'Ahmad Zaki Al-Hafiz',
      });
      expect(updated.name).toBe('Ahmad Zaki Al-Hafiz');
    });

    it('deletes student', async () => {
      const deleted = await deleteStudent(schoolAId, createdStudentId);
      expect(deleted.id).toBe(createdStudentId);

      const check = await getStudentById(schoolAId, createdStudentId);
      expect(check).toBeNull();
    });
  });

  describe('Teachers CRUD', () => {
    let teacherId: string;

    it('creates a teacher with hashed password', async () => {
      const teacher = await createTeacher(schoolAId, {
        name: '<b>Ibu Ratna</b>',
        email: 'ratna@testschoola.sch.id',
        role: 'GURU_MAPEL',
        nip: '19870101001',
        phone: '081333444555',
      });

      expect(teacher.id).toBeDefined();
      expect(teacher.name).toBe('Ibu Ratna'); // Sanitized
      expect(teacher.email).toBe('ratna@testschoola.sch.id');
      teacherId = teacher.id;
    });

    it('rejects duplicate email', async () => {
      await expect(
        createTeacher(schoolAId, {
          name: 'Ibu Ratna Clone',
          email: 'ratna@testschoola.sch.id',
          role: 'GURU_MAPEL',
        })
      ).rejects.toThrow(/sudah digunakan/);
    });

    it('gets teachers with role filter', async () => {
      const res = await getTeachers(schoolAId, { role: 'GURU_MAPEL' });
      expect(res.total).toBeGreaterThanOrEqual(1);
      expect(res.teachers.some((t) => t.id === teacherId)).toBe(true);
    });

    it('updates teacher info', async () => {
      const updated = await updateTeacher(schoolAId, teacherId, {
        name: 'Ibu Ratna SP.d',
        role: 'WALI_KELAS',
      });
      expect(updated.name).toBe('Ibu Ratna SP.d');
      expect(updated.role).toBe('WALI_KELAS');
    });
  });

  describe('Classes CRUD', () => {
    let classId: string;

    it('creates a class in an academic year', async () => {
      const cls = await createClass(schoolAId, {
        name: 'X-IPA-1',
        gradeLevel: '10',
        academicYearId: academicYearAId,
      });

      expect(cls.id).toBeDefined();
      expect(cls.name).toBe('X-IPA-1');
      classId = cls.id;
    });

    it('rejects duplicate class name in same academic year', async () => {
      await expect(
        createClass(schoolAId, {
          name: 'X-IPA-1',
          gradeLevel: '10',
          academicYearId: academicYearAId,
        })
      ).rejects.toThrow(/sudah ada pada tahun akademik ini/);
    });

    it('lists classes with student counts', async () => {
      const res = await getClasses(schoolAId);
      expect(res.total).toBe(1);
      expect(res.classes[0].name).toBe('X-IPA-1');
      expect(res.classes[0].studentCount).toBe(0);
    });

    it('updates class grade level', async () => {
      const updated = await updateClass(schoolAId, classId, {
        name: 'X-MIPA-1',
      });
      expect(updated.name).toBe('X-MIPA-1');
    });
  });

  describe('Teaching Schedules CRUD', () => {
    let testTeacherId: string;
    let testClassId: string;
    let scheduleId: string;

    beforeAll(async () => {
      const teacher = await createTeacher(schoolAId, {
        name: 'Pak Bambang',
        email: 'bambang@testschoola.sch.id',
        role: 'GURU_MAPEL',
      });
      testTeacherId = teacher.id;

      const cls = await createClass(schoolAId, {
        name: 'XI-IPA-1',
        gradeLevel: '11',
        academicYearId: academicYearAId,
      });
      testClassId = cls.id;
    });

    it('creates weekly teaching schedule', async () => {
      const sched = await createTeachingSchedule(schoolAId, {
        classId: testClassId,
        teacherId: testTeacherId,
        subjectName: 'Matematika Wajib',
        dayOfWeek: 1, // Senin
        periodOrder: 1,
        startTime: '07:00',
        endTime: '08:30',
      });

      expect(sched.id).toBeDefined();
      expect(sched.subjectName).toBe('Matematika Wajib');
      expect(sched.dayOfWeek).toBe(1);
      scheduleId = sched.id;
    });

    it('lists teaching schedules for class and day', async () => {
      const list = await getTeachingSchedules(schoolAId, {
        classId: testClassId,
        dayOfWeek: 1,
      });

      expect(list).toHaveLength(1);
      expect(list[0].subjectName).toBe('Matematika Wajib');
      expect(list[0].teacherName).toBe('Pak Bambang');
      expect(list[0].className).toBe('XI-IPA-1');
    });

    it('updates teaching schedule time', async () => {
      const updated = await updateTeachingSchedule(schoolAId, scheduleId, {
        endTime: '08:45',
      });
      expect(updated.endTime).toBe('08:45');
    });

    it('deletes teaching schedule', async () => {
      const deleted = await deleteTeachingSchedule(schoolAId, scheduleId);
      expect(deleted.id).toBe(scheduleId);

      const list = await getTeachingSchedules(schoolAId, { classId: testClassId });
      expect(list).toHaveLength(0);
    });
  });

  describe('Academic Calendar CRUD', () => {
    it('sets and updates calendar days with ACTIVE_KBM, HOLIDAY, and SPECIAL_EVENT', async () => {
      // 1. Set active KBM
      const kbm = await setAcademicCalendar(schoolAId, {
        date: '2026-08-10',
        dayType: 'ACTIVE_KBM',
        description: 'Hari Pertama Masuk Sekolah',
      });
      expect(kbm.dayType).toBe('ACTIVE_KBM');

      // 2. Set National Holiday (e.g. 17 Agustus)
      const holiday = await setAcademicCalendar(schoolAId, {
        date: '2026-08-17',
        dayType: 'HOLIDAY',
        description: 'HUT Kemerdekaan RI ke-81',
      });
      expect(holiday.dayType).toBe('HOLIDAY');

      // 3. Set Special Event
      const special = await setAcademicCalendar(schoolAId, {
        date: '2026-08-18',
        dayType: 'SPECIAL_EVENT',
        description: 'Lomba Antar Kelas 17-an',
      });
      expect(special.dayType).toBe('SPECIAL_EVENT');

      // 4. Query calendar range
      const list = await getAcademicCalendars(schoolAId, {
        startDate: '2026-08-01',
        endDate: '2026-08-31',
      });
      expect(list).toHaveLength(3);

      // 5. Update existing date (upsert)
      const updated = await setAcademicCalendar(schoolAId, {
        date: '2026-08-10',
        dayType: 'SPECIAL_EVENT',
        description: 'Upacara Pembukaan Tahun Ajaran',
      });
      expect(updated.dayType).toBe('SPECIAL_EVENT');
      expect(updated.description).toBe('Upacara Pembukaan Tahun Ajaran');

      // 6. Delete date
      await deleteAcademicCalendarByDate(schoolAId, '2026-08-10');
      const afterDel = await getAcademicCalendars(schoolAId, {
        startDate: '2026-08-01',
        endDate: '2026-08-31',
      });
      expect(afterDel).toHaveLength(2);
    });
  });
});
