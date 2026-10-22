import { db } from '@/db';
import {
  students,
  users,
  classes,
  classEnrollments,
  teachingSchedules,
  academicCalendars,
  academicYears,
  USER_ROLES,
  UserRole,
} from '@/db/schema';
import { eq, and, or, ilike, sql, count, desc, asc } from 'drizzle-orm';
import { sanitizeString, sanitizeGender, sanitizePhone, sanitizeEmail, isValidEmail } from '@/lib/importers/sanitizer';
import { hashPassword } from '@/lib/auth/password';

// ==========================================
// 1. STUDENTS SERVICE
// ==========================================

export interface StudentFilterOptions {
  search?: string;
  classId?: string;
  page?: number;
  limit?: number;
}

export async function getStudents(
  schoolId: string,
  options: StudentFilterOptions = {}
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 10));
  const offset = (page - 1) * limit;

  const conditions = [eq(students.schoolId, schoolId)];

  if (options.search) {
    const s = `%${options.search}%`;
    conditions.push(
      or(
        ilike(students.name, s),
        ilike(students.nis, s),
        ilike(students.nisn, s),
        ilike(students.guardianName, s)
      )!
    );
  }

  // Count total matching
  const [totalResult] = await db
    .select({ total: count() })
    .from(students)
    .where(and(...conditions));

  const total = Number(totalResult?.total || 0);

  // Fetch students with current class enrollment
  const studentRows = await db
    .select({
      id: students.id,
      nis: students.nis,
      nisn: students.nisn,
      name: students.name,
      gender: students.gender,
      guardianName: students.guardianName,
      guardianPhone: students.guardianPhone,
      isActive: students.isActive,
      createdAt: students.createdAt,
    })
    .from(students)
    .where(and(...conditions))
    .orderBy(asc(students.name))
    .limit(limit)
    .offset(offset);

  // Fetch active class for these students
  const studentIds = studentRows.map((s) => s.id);
  const classMap = new Map<string, { classId: string; className: string }>();

  if (studentIds.length > 0) {
    const enrollments = await db
      .select({
        studentId: classEnrollments.studentId,
        classId: classes.id,
        className: classes.name,
      })
      .from(classEnrollments)
      .innerJoin(classes, eq(classEnrollments.classId, classes.id))
      .where(
        and(
          eq(classEnrollments.schoolId, schoolId),
          sql`${classEnrollments.studentId} IN ${studentIds}`
        )
      );

    for (const e of enrollments) {
      classMap.set(e.studentId, { classId: e.classId, className: e.className });
    }
  }

  const resultStudents = studentRows.map((s) => ({
    ...s,
    currentClass: classMap.get(s.id) || null,
  }));

  // If filtered by classId, filter further or handle at query level
  const filtered = options.classId
    ? resultStudents.filter((s) => s.currentClass?.classId === options.classId)
    : resultStudents;

  return {
    students: filtered,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getStudentById(schoolId: string, studentId: string) {
  const [student] = await db
    .select()
    .from(students)
    .where(and(eq(students.id, studentId), eq(students.schoolId, schoolId)));

  if (!student) return null;

  const [enrollment] = await db
    .select({
      classId: classes.id,
      className: classes.name,
      gradeLevel: classes.gradeLevel,
    })
    .from(classEnrollments)
    .innerJoin(classes, eq(classEnrollments.classId, classes.id))
    .where(
      and(
        eq(classEnrollments.studentId, student.id),
        eq(classEnrollments.schoolId, schoolId)
      )
    )
    .limit(1);

  return {
    ...student,
    currentClass: enrollment || null,
  };
}

export interface CreateStudentInput {
  nis: string;
  nisn?: string;
  name: string;
  gender: 'L' | 'P';
  guardianName?: string;
  guardianPhone?: string;
  classId?: string;
  academicYearId?: string;
}

export async function createStudent(schoolId: string, input: CreateStudentInput) {
  const nis = sanitizeString(input.nis);
  const name = sanitizeString(input.name);
  const gender = sanitizeGender(input.gender);
  const nisn = sanitizeString(input.nisn) || undefined;
  const guardianName = sanitizeString(input.guardianName) || undefined;
  const guardianPhone = sanitizePhone(input.guardianPhone) || undefined;

  if (!nis) throw new Error('NIS wajib diisi.');
  if (!name) throw new Error('Nama siswa wajib diisi.');
  if (!gender) throw new Error('Jenis kelamin wajib L atau P.');

  // Check unique NIS in this school
  const [existing] = await db
    .select()
    .from(students)
    .where(and(eq(students.schoolId, schoolId), eq(students.nis, nis)));

  if (existing) {
    throw new Error(`NIS '${nis}' sudah terdaftar di sekolah ini.`);
  }

  const [created] = await db
    .insert(students)
    .values({
      schoolId,
      nis,
      nisn,
      name,
      gender,
      guardianName,
      guardianPhone,
      isActive: true,
    })
    .returning();

  // Enroll in class if classId provided
  if (input.classId) {
    let academicYearId = input.academicYearId;
    if (!academicYearId) {
      const activeAy = await getActiveAcademicYear(schoolId);
      if (activeAy) academicYearId = activeAy.id;
    }

    if (academicYearId) {
      await db.insert(classEnrollments).values({
        schoolId,
        studentId: created.id,
        classId: input.classId,
        academicYearId,
      });
    }
  }

  return created;
}

export interface UpdateStudentInput {
  nis?: string;
  nisn?: string;
  name?: string;
  gender?: 'L' | 'P';
  guardianName?: string;
  guardianPhone?: string;
  isActive?: boolean;
  classId?: string | null;
  academicYearId?: string;
}

export async function updateStudent(
  schoolId: string,
  studentId: string,
  input: UpdateStudentInput
) {
  const student = await getStudentById(schoolId, studentId);
  if (!student) throw new Error('Siswa tidak ditemukan.');

  const updateValues: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.nis !== undefined) {
    const nis = sanitizeString(input.nis);
    if (!nis) throw new Error('NIS tidak boleh kosong.');
    if (nis !== student.nis) {
      const [existing] = await db
        .select()
        .from(students)
        .where(and(eq(students.schoolId, schoolId), eq(students.nis, nis)));
      if (existing) throw new Error(`NIS '${nis}' sudah digunakan.`);
    }
    updateValues.nis = nis;
  }

  if (input.name !== undefined) {
    const name = sanitizeString(input.name);
    if (!name) throw new Error('Nama siswa tidak boleh kosong.');
    updateValues.name = name;
  }

  if (input.gender !== undefined) {
    const gender = sanitizeGender(input.gender);
    if (!gender) throw new Error('Jenis kelamin tidak valid.');
    updateValues.gender = gender;
  }

  if (input.nisn !== undefined) {
    updateValues.nisn = sanitizeString(input.nisn) || null;
  }

  if (input.guardianName !== undefined) {
    updateValues.guardianName = sanitizeString(input.guardianName) || null;
  }

  if (input.guardianPhone !== undefined) {
    updateValues.guardianPhone = sanitizePhone(input.guardianPhone) || null;
  }

  if (input.isActive !== undefined) {
    updateValues.isActive = Boolean(input.isActive);
  }

  const [updated] = await db
    .update(students)
    .set(updateValues)
    .where(and(eq(students.id, studentId), eq(students.schoolId, schoolId)))
    .returning();

  // Update enrollment if classId is passed
  if (input.classId !== undefined) {
    // Delete existing enrollment
    await db
      .delete(classEnrollments)
      .where(
        and(
          eq(classEnrollments.schoolId, schoolId),
          eq(classEnrollments.studentId, studentId)
        )
      );

    if (input.classId) {
      let academicYearId = input.academicYearId;
      if (!academicYearId) {
        const activeAy = await getActiveAcademicYear(schoolId);
        if (activeAy) academicYearId = activeAy.id;
      }
      if (academicYearId) {
        await db.insert(classEnrollments).values({
          schoolId,
          studentId,
          classId: input.classId,
          academicYearId,
        });
      }
    }
  }

  return updated;
}

export async function deleteStudent(schoolId: string, studentId: string) {
  const [deleted] = await db
    .delete(students)
    .where(and(eq(students.id, studentId), eq(students.schoolId, schoolId)))
    .returning();

  if (!deleted) throw new Error('Siswa tidak ditemukan atau gagal dihapus.');
  return deleted;
}

// ==========================================
// 2. TEACHERS / USERS SERVICE
// ==========================================

export interface TeacherFilterOptions {
  search?: string;
  role?: UserRole;
  page?: number;
  limit?: number;
}

export async function getTeachers(
  schoolId: string,
  options: TeacherFilterOptions = {}
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 10));
  const offset = (page - 1) * limit;

  const conditions = [eq(users.schoolId, schoolId)];

  if (options.role) {
    conditions.push(eq(users.role, options.role));
  }

  if (options.search) {
    const s = `%${options.search}%`;
    conditions.push(
      or(
        ilike(users.name, s),
        ilike(users.email, s),
        ilike(users.nip, s),
        ilike(users.phone, s)
      )!
    );
  }

  const [totalResult] = await db
    .select({ total: count() })
    .from(users)
    .where(and(...conditions));

  const total = Number(totalResult?.total || 0);

  const teacherRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      nip: users.nip,
      phone: users.phone,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(...conditions))
    .orderBy(asc(users.name))
    .limit(limit)
    .offset(offset);

  return {
    teachers: teacherRows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getTeacherById(schoolId: string, teacherId: string) {
  const [teacher] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      nip: users.nip,
      phone: users.phone,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.id, teacherId), eq(users.schoolId, schoolId)));

  return teacher || null;
}

export interface CreateTeacherInput {
  name: string;
  email: string;
  role: UserRole;
  nip?: string;
  phone?: string;
  password?: string;
}

export async function createTeacher(schoolId: string, input: CreateTeacherInput) {
  const name = sanitizeString(input.name);
  const email = sanitizeEmail(input.email);
  const nip = sanitizeString(input.nip) || undefined;
  const phone = sanitizePhone(input.phone) || undefined;
  const role = input.role || USER_ROLES.GURU_MAPEL;

  if (!name) throw new Error('Nama guru wajib diisi.');
  if (!email) throw new Error('Email wajib diisi.');
  if (!isValidEmail(email)) throw new Error('Format email tidak valid.');

  // Check unique email
  const [existingEmail] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existingEmail) {
    throw new Error(`Email '${email}' sudah digunakan.`);
  }

  // Check unique NIP in school if provided
  if (nip) {
    const [existingNip] = await db
      .select()
      .from(users)
      .where(and(eq(users.schoolId, schoolId), eq(users.nip, nip)));
    if (existingNip) {
      throw new Error(`NIP '${nip}' sudah digunakan di sekolah ini.`);
    }
  }

  const rawPassword = input.password || 'EduNotify2026!';
  const passwordHash = await hashPassword(rawPassword);

  const [created] = await db
    .insert(users)
    .values({
      schoolId,
      name,
      email,
      role,
      nip,
      phone,
      passwordHash,
      isActive: true,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      nip: users.nip,
      phone: users.phone,
      isActive: users.isActive,
      createdAt: users.createdAt,
    });

  return created;
}

export interface UpdateTeacherInput {
  name?: string;
  email?: string;
  role?: UserRole;
  nip?: string;
  phone?: string;
  isActive?: boolean;
}

export async function updateTeacher(
  schoolId: string,
  teacherId: string,
  input: UpdateTeacherInput
) {
  const teacher = await getTeacherById(schoolId, teacherId);
  if (!teacher) throw new Error('Guru/Staf tidak ditemukan.');

  const updateValues: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) {
    const name = sanitizeString(input.name);
    if (!name) throw new Error('Nama guru tidak boleh kosong.');
    updateValues.name = name;
  }

  if (input.email !== undefined) {
    const email = sanitizeEmail(input.email);
    if (!email) throw new Error('Email tidak boleh kosong.');
    if (!isValidEmail(email)) throw new Error('Format email tidak valid.');
    if (email !== teacher.email) {
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      if (existing) throw new Error(`Email '${email}' sudah terdaftar.`);
    }
    updateValues.email = email;
  }

  if (input.role !== undefined) {
    updateValues.role = input.role;
  }

  if (input.nip !== undefined) {
    const nip = sanitizeString(input.nip);
    if (nip && nip !== teacher.nip) {
      const [existing] = await db
        .select()
        .from(users)
        .where(and(eq(users.schoolId, schoolId), eq(users.nip, nip)));
      if (existing) throw new Error(`NIP '${nip}' sudah digunakan.`);
    }
    updateValues.nip = nip || null;
  }

  if (input.phone !== undefined) {
    updateValues.phone = sanitizePhone(input.phone) || null;
  }

  if (input.isActive !== undefined) {
    updateValues.isActive = Boolean(input.isActive);
  }

  const [updated] = await db
    .update(users)
    .set(updateValues)
    .where(and(eq(users.id, teacherId), eq(users.schoolId, schoolId)))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      nip: users.nip,
      phone: users.phone,
      isActive: users.isActive,
      createdAt: users.createdAt,
    });

  return updated;
}

export async function deleteTeacher(schoolId: string, teacherId: string) {
  const [deleted] = await db
    .delete(users)
    .where(and(eq(users.id, teacherId), eq(users.schoolId, schoolId)))
    .returning();

  if (!deleted) throw new Error('Guru tidak ditemukan atau gagal dihapus.');
  return deleted;
}

// ==========================================
// 3. CLASSES SERVICE
// ==========================================

export interface ClassFilterOptions {
  search?: string;
  academicYearId?: string;
  page?: number;
  limit?: number;
}

export async function getClasses(
  schoolId: string,
  options: ClassFilterOptions = {}
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 10));
  const offset = (page - 1) * limit;

  const conditions = [eq(classes.schoolId, schoolId)];

  if (options.academicYearId) {
    conditions.push(eq(classes.academicYearId, options.academicYearId));
  }

  if (options.search) {
    conditions.push(ilike(classes.name, `%${options.search}%`));
  }

  const [totalResult] = await db
    .select({ total: count() })
    .from(classes)
    .where(and(...conditions));

  const total = Number(totalResult?.total || 0);

  const classRows = await db
    .select({
      id: classes.id,
      name: classes.name,
      gradeLevel: classes.gradeLevel,
      academicYearId: classes.academicYearId,
      academicYearName: academicYears.name,
      semester: academicYears.semester,
      homeroomTeacherId: classes.homeroomTeacherId,
      homeroomTeacherName: users.name,
      createdAt: classes.createdAt,
    })
    .from(classes)
    .innerJoin(academicYears, eq(classes.academicYearId, academicYears.id))
    .leftJoin(users, eq(classes.homeroomTeacherId, users.id))
    .where(and(...conditions))
    .orderBy(asc(classes.name))
    .limit(limit)
    .offset(offset);

  // Get student count per class
  const classIds = classRows.map((c) => c.id);
  const studentCountMap = new Map<string, number>();

  if (classIds.length > 0) {
    const counts = await db
      .select({
        classId: classEnrollments.classId,
        studentCount: count(),
      })
      .from(classEnrollments)
      .where(
        and(
          eq(classEnrollments.schoolId, schoolId),
          sql`${classEnrollments.classId} IN ${classIds}`
        )
      )
      .groupBy(classEnrollments.classId);

    for (const item of counts) {
      studentCountMap.set(item.classId, Number(item.studentCount));
    }
  }

  const classesWithCounts = classRows.map((c) => ({
    ...c,
    studentCount: studentCountMap.get(c.id) || 0,
  }));

  return {
    classes: classesWithCounts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getClassById(schoolId: string, classId: string) {
  const [c] = await db
    .select({
      id: classes.id,
      name: classes.name,
      gradeLevel: classes.gradeLevel,
      academicYearId: classes.academicYearId,
      homeroomTeacherId: classes.homeroomTeacherId,
      homeroomTeacherName: users.name,
    })
    .from(classes)
    .leftJoin(users, eq(classes.homeroomTeacherId, users.id))
    .where(and(eq(classes.id, classId), eq(classes.schoolId, schoolId)));

  return c || null;
}

export interface CreateClassInput {
  name: string;
  gradeLevel: string;
  academicYearId: string;
  homeroomTeacherId?: string | null;
}

export async function createClass(schoolId: string, input: CreateClassInput) {
  const name = sanitizeString(input.name);
  const gradeLevel = sanitizeString(input.gradeLevel);

  if (!name) throw new Error('Nama kelas wajib diisi.');
  if (!gradeLevel) throw new Error('Tingkat kelas (grade level) wajib diisi.');
  if (!input.academicYearId) throw new Error('Tahun akademik wajib dipilih.');

  // Check unique class name in same academic year and school
  const [existing] = await db
    .select()
    .from(classes)
    .where(
      and(
        eq(classes.schoolId, schoolId),
        eq(classes.academicYearId, input.academicYearId),
        eq(classes.name, name)
      )
    );

  if (existing) {
    throw new Error(`Kelas dengan nama '${name}' sudah ada pada tahun akademik ini.`);
  }

  const [created] = await db
    .insert(classes)
    .values({
      schoolId,
      name,
      gradeLevel,
      academicYearId: input.academicYearId,
      homeroomTeacherId: input.homeroomTeacherId || null,
    })
    .returning();

  return created;
}

export interface UpdateClassInput {
  name?: string;
  gradeLevel?: string;
  academicYearId?: string;
  homeroomTeacherId?: string | null;
}

export async function updateClass(
  schoolId: string,
  classId: string,
  input: UpdateClassInput
) {
  const current = await getClassById(schoolId, classId);
  if (!current) throw new Error('Kelas tidak ditemukan.');

  const updateValues: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) {
    const name = sanitizeString(input.name);
    if (!name) throw new Error('Nama kelas tidak boleh kosong.');
    updateValues.name = name;
  }

  if (input.gradeLevel !== undefined) {
    const grade = sanitizeString(input.gradeLevel);
    if (!grade) throw new Error('Tingkat kelas tidak boleh kosong.');
    updateValues.gradeLevel = grade;
  }

  if (input.academicYearId !== undefined) {
    updateValues.academicYearId = input.academicYearId;
  }

  if (input.homeroomTeacherId !== undefined) {
    updateValues.homeroomTeacherId = input.homeroomTeacherId || null;
  }

  const [updated] = await db
    .update(classes)
    .set(updateValues)
    .where(and(eq(classes.id, classId), eq(classes.schoolId, schoolId)))
    .returning();

  return updated;
}

export async function deleteClass(schoolId: string, classId: string) {
  const [deleted] = await db
    .delete(classes)
    .where(and(eq(classes.id, classId), eq(classes.schoolId, schoolId)))
    .returning();

  if (!deleted) throw new Error('Kelas tidak ditemukan atau gagal dihapus.');
  return deleted;
}

// ==========================================
// 4. TEACHING SCHEDULES SERVICE
// ==========================================

export interface ScheduleFilterOptions {
  classId?: string;
  teacherId?: string;
  dayOfWeek?: number;
}

export async function getTeachingSchedules(
  schoolId: string,
  options: ScheduleFilterOptions = {}
) {
  const conditions = [eq(teachingSchedules.schoolId, schoolId)];

  if (options.classId) {
    conditions.push(eq(teachingSchedules.classId, options.classId));
  }

  if (options.teacherId) {
    conditions.push(eq(teachingSchedules.teacherId, options.teacherId));
  }

  if (options.dayOfWeek !== undefined) {
    conditions.push(eq(teachingSchedules.dayOfWeek, options.dayOfWeek));
  }

  const list = await db
    .select({
      id: teachingSchedules.id,
      schoolId: teachingSchedules.schoolId,
      classId: teachingSchedules.classId,
      className: classes.name,
      teacherId: teachingSchedules.teacherId,
      teacherName: users.name,
      subjectName: teachingSchedules.subjectName,
      dayOfWeek: teachingSchedules.dayOfWeek,
      periodOrder: teachingSchedules.periodOrder,
      startTime: teachingSchedules.startTime,
      endTime: teachingSchedules.endTime,
      createdAt: teachingSchedules.createdAt,
    })
    .from(teachingSchedules)
    .innerJoin(classes, eq(teachingSchedules.classId, classes.id))
    .innerJoin(users, eq(teachingSchedules.teacherId, users.id))
    .where(and(...conditions))
    .orderBy(
      asc(teachingSchedules.dayOfWeek),
      asc(teachingSchedules.periodOrder),
      asc(teachingSchedules.startTime)
    );

  return list;
}

export interface CreateTeachingScheduleInput {
  classId: string;
  teacherId: string;
  subjectName: string;
  dayOfWeek: number; // 1 = Senin, 7 = Minggu
  periodOrder: number;
  startTime: string; // "07:00"
  endTime: string; // "08:30"
}

export async function createTeachingSchedule(
  schoolId: string,
  input: CreateTeachingScheduleInput
) {
  const subjectName = sanitizeString(input.subjectName);
  const startTime = sanitizeString(input.startTime);
  const endTime = sanitizeString(input.endTime);

  if (!input.classId) throw new Error('Kelas wajib dipilih.');
  if (!input.teacherId) throw new Error('Guru pengampu wajib dipilih.');
  if (!subjectName) throw new Error('Mata pelajaran wajib diisi.');
  if (input.dayOfWeek < 1 || input.dayOfWeek > 7) {
    throw new Error('Hari tidak valid (1-7).');
  }
  if (!startTime || !endTime) {
    throw new Error('Jam mulai dan jam selesai wajib diisi.');
  }

  const [created] = await db
    .insert(teachingSchedules)
    .values({
      schoolId,
      classId: input.classId,
      teacherId: input.teacherId,
      subjectName,
      dayOfWeek: input.dayOfWeek,
      periodOrder: input.periodOrder || 1,
      startTime,
      endTime,
    })
    .returning();

  return created;
}

export async function updateTeachingSchedule(
  schoolId: string,
  scheduleId: string,
  input: Partial<CreateTeachingScheduleInput>
) {
  const [existing] = await db
    .select()
    .from(teachingSchedules)
    .where(and(eq(teachingSchedules.id, scheduleId), eq(teachingSchedules.schoolId, schoolId)));

  if (!existing) throw new Error('Jadwal pelajaran tidak ditemukan.');

  const updateValues: Record<string, unknown> = {};

  if (input.classId) updateValues.classId = input.classId;
  if (input.teacherId) updateValues.teacherId = input.teacherId;
  if (input.subjectName) updateValues.subjectName = sanitizeString(input.subjectName);
  if (input.dayOfWeek !== undefined) updateValues.dayOfWeek = input.dayOfWeek;
  if (input.periodOrder !== undefined) updateValues.periodOrder = input.periodOrder;
  if (input.startTime) updateValues.startTime = sanitizeString(input.startTime);
  if (input.endTime) updateValues.endTime = sanitizeString(input.endTime);

  const [updated] = await db
    .update(teachingSchedules)
    .set(updateValues)
    .where(and(eq(teachingSchedules.id, scheduleId), eq(teachingSchedules.schoolId, schoolId)))
    .returning();

  return updated;
}

export async function deleteTeachingSchedule(schoolId: string, scheduleId: string) {
  const [deleted] = await db
    .delete(teachingSchedules)
    .where(and(eq(teachingSchedules.id, scheduleId), eq(teachingSchedules.schoolId, schoolId)))
    .returning();

  if (!deleted) throw new Error('Jadwal pelajaran tidak ditemukan atau gagal dihapus.');
  return deleted;
}

// ==========================================
// 5. ACADEMIC CALENDAR SERVICE
// ==========================================

export type DayType = 'ACTIVE_KBM' | 'HOLIDAY' | 'SPECIAL_EVENT';

export interface CalendarFilterOptions {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;
  month?: string; // YYYY-MM
  dayType?: DayType;
}

export async function getAcademicCalendars(
  schoolId: string,
  options: CalendarFilterOptions = {}
) {
  const conditions = [eq(academicCalendars.schoolId, schoolId)];

  if (options.startDate && options.endDate) {
    conditions.push(
      sql`${academicCalendars.date} >= ${options.startDate} AND ${academicCalendars.date} <= ${options.endDate}`
    );
  } else if (options.month) {
    // e.g. "2026-07"
    const startOfMonth = `${options.month}-01`;
    const endOfMonth = `${options.month}-31`;
    conditions.push(
      sql`${academicCalendars.date} >= ${startOfMonth} AND ${academicCalendars.date} <= ${endOfMonth}`
    );
  }

  if (options.dayType) {
    conditions.push(eq(academicCalendars.dayType, options.dayType));
  }

  const list = await db
    .select()
    .from(academicCalendars)
    .where(and(...conditions))
    .orderBy(asc(academicCalendars.date));

  return list;
}

export interface SetAcademicCalendarInput {
  date: string; // "YYYY-MM-DD"
  dayType: DayType;
  description?: string;
}

export async function setAcademicCalendar(
  schoolId: string,
  input: SetAcademicCalendarInput
) {
  const dateStr = sanitizeString(input.date);
  const description = sanitizeString(input.description) || undefined;
  const dayType = input.dayType;

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error('Format tanggal harus YYYY-MM-DD.');
  }

  if (!['ACTIVE_KBM', 'HOLIDAY', 'SPECIAL_EVENT'].includes(dayType)) {
    throw new Error('Tipe hari harus ACTIVE_KBM, HOLIDAY, atau SPECIAL_EVENT.');
  }

  // Upsert on conflict (schoolId, date)
  const [result] = await db
    .insert(academicCalendars)
    .values({
      schoolId,
      date: dateStr,
      dayType,
      description,
    })
    .onConflictDoUpdate({
      target: [academicCalendars.schoolId, academicCalendars.date],
      set: {
        dayType,
        description,
      },
    })
    .returning();

  return result;
}

export async function deleteAcademicCalendar(schoolId: string, id: string) {
  const [deleted] = await db
    .delete(academicCalendars)
    .where(and(eq(academicCalendars.id, id), eq(academicCalendars.schoolId, schoolId)))
    .returning();

  if (!deleted) throw new Error('Data kalender tidak ditemukan.');
  return deleted;
}

export async function deleteAcademicCalendarByDate(schoolId: string, date: string) {
  const [deleted] = await db
    .delete(academicCalendars)
    .where(and(eq(academicCalendars.date, date), eq(academicCalendars.schoolId, schoolId)))
    .returning();

  return deleted;
}

// ==========================================
// 6. ACADEMIC YEARS SERVICE
// ==========================================

export async function getAcademicYears(schoolId: string) {
  return await db
    .select()
    .from(academicYears)
    .where(eq(academicYears.schoolId, schoolId))
    .orderBy(desc(academicYears.startDate));
}

export async function getActiveAcademicYear(schoolId: string) {
  const [ay] = await db
    .select()
    .from(academicYears)
    .where(
      and(
        eq(academicYears.schoolId, schoolId),
        eq(academicYears.isActive, true)
      )
    )
    .limit(1);

  return ay || null;
}
