'use server';

import { getSession } from '@/lib/auth/session';
import * as masterData from '@/services/masterDataService';
import { parseAndValidateStudents } from '@/lib/importers/studentImporter';
import { parseAndValidateTeachers } from '@/lib/importers/teacherImporter';
import { revalidatePath } from 'next/cache';
import { UserRole } from '@/db/schema';

async function requireAdminSession() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN_SEKOLAH') {
    throw new Error('Unauthorized: Akses ditolak. Hanya Administrator Sekolah yang diizinkan.');
  }
  return session;
}

// ==========================================
// STUDENTS ACTIONS
// ==========================================

export async function getStudentsAction(options?: masterData.StudentFilterOptions) {
  const session = await requireAdminSession();
  return await masterData.getStudents(session.schoolId, options);
}

export async function createStudentAction(input: masterData.CreateStudentInput) {
  const session = await requireAdminSession();
  const result = await masterData.createStudent(session.schoolId, input);
  revalidatePath('/admin/students');
  return { success: true, data: result };
}

export async function updateStudentAction(
  studentId: string,
  input: masterData.UpdateStudentInput
) {
  const session = await requireAdminSession();
  const result = await masterData.updateStudent(session.schoolId, studentId, input);
  revalidatePath('/admin/students');
  return { success: true, data: result };
}

export async function deleteStudentAction(studentId: string) {
  const session = await requireAdminSession();
  const result = await masterData.deleteStudent(session.schoolId, studentId);
  revalidatePath('/admin/students');
  return { success: true, data: result };
}

export async function importStudentsAction(formData: FormData) {
  const session = await requireAdminSession();
  const file = formData.get('file') as File | null;
  const defaultClassId = (formData.get('defaultClassId') as string) || undefined;
  const dryRun = formData.get('dryRun') === 'true';

  if (!file) {
    return {
      success: false,
      totalRows: 0,
      validRows: 0,
      errorCount: 1,
      errors: [
        {
          row: 0,
          column: 'file',
          value: null,
          message: 'File tidak ditemukan dalam permintaan unggah.',
        },
      ],
      importedCount: 0,
    };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const result = await parseAndValidateStudents(buffer, {
    schoolId: session.schoolId,
    filename: file.name,
    mimeType: file.type,
    defaultClassId,
    dryRun,
  });

  if (result.success && result.importedCount > 0) {
    revalidatePath('/admin/students');
  }

  return result;
}

// ==========================================
// TEACHERS ACTIONS
// ==========================================

export async function getTeachersAction(options?: masterData.TeacherFilterOptions) {
  const session = await requireAdminSession();
  return await masterData.getTeachers(session.schoolId, options);
}

export async function createTeacherAction(input: masterData.CreateTeacherInput) {
  const session = await requireAdminSession();
  const result = await masterData.createTeacher(session.schoolId, input);
  revalidatePath('/admin/teachers');
  return { success: true, data: result };
}

export async function updateTeacherAction(
  teacherId: string,
  input: masterData.UpdateTeacherInput
) {
  const session = await requireAdminSession();
  const result = await masterData.updateTeacher(session.schoolId, teacherId, input);
  revalidatePath('/admin/teachers');
  return { success: true, data: result };
}

export async function deleteTeacherAction(teacherId: string) {
  const session = await requireAdminSession();
  const result = await masterData.deleteTeacher(session.schoolId, teacherId);
  revalidatePath('/admin/teachers');
  return { success: true, data: result };
}

export async function importTeachersAction(formData: FormData) {
  const session = await requireAdminSession();
  const file = formData.get('file') as File | null;
  const dryRun = formData.get('dryRun') === 'true';

  if (!file) {
    return {
      success: false,
      totalRows: 0,
      validRows: 0,
      errorCount: 1,
      errors: [
        {
          row: 0,
          column: 'file',
          value: null,
          message: 'File tidak ditemukan dalam permintaan unggah.',
        },
      ],
      importedCount: 0,
    };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const result = await parseAndValidateTeachers(buffer, {
    schoolId: session.schoolId,
    filename: file.name,
    mimeType: file.type,
    dryRun,
  });

  if (result.success && result.importedCount > 0) {
    revalidatePath('/admin/teachers');
  }

  return result;
}

// ==========================================
// CLASSES ACTIONS
// ==========================================

export async function getClassesAction(options?: masterData.ClassFilterOptions) {
  const session = await requireAdminSession();
  return await masterData.getClasses(session.schoolId, options);
}

export async function createClassAction(input: masterData.CreateClassInput) {
  const session = await requireAdminSession();
  const result = await masterData.createClass(session.schoolId, input);
  revalidatePath('/admin/classes');
  return { success: true, data: result };
}

export async function updateClassAction(
  classId: string,
  input: masterData.UpdateClassInput
) {
  const session = await requireAdminSession();
  const result = await masterData.updateClass(session.schoolId, classId, input);
  revalidatePath('/admin/classes');
  return { success: true, data: result };
}

export async function deleteClassAction(classId: string) {
  const session = await requireAdminSession();
  const result = await masterData.deleteClass(session.schoolId, classId);
  revalidatePath('/admin/classes');
  return { success: true, data: result };
}

// ==========================================
// TEACHING SCHEDULES ACTIONS
// ==========================================

export async function getSchedulesAction(options?: masterData.ScheduleFilterOptions) {
  const session = await requireAdminSession();
  return await masterData.getTeachingSchedules(session.schoolId, options);
}

export async function createScheduleAction(
  input: masterData.CreateTeachingScheduleInput
) {
  const session = await requireAdminSession();
  const result = await masterData.createTeachingSchedule(session.schoolId, input);
  revalidatePath('/admin/schedules');
  return { success: true, data: result };
}

export async function updateScheduleAction(
  scheduleId: string,
  input: Partial<masterData.CreateTeachingScheduleInput>
) {
  const session = await requireAdminSession();
  const result = await masterData.updateTeachingSchedule(
    session.schoolId,
    scheduleId,
    input
  );
  revalidatePath('/admin/schedules');
  return { success: true, data: result };
}

export async function deleteScheduleAction(scheduleId: string) {
  const session = await requireAdminSession();
  const result = await masterData.deleteTeachingSchedule(session.schoolId, scheduleId);
  revalidatePath('/admin/schedules');
  return { success: true, data: result };
}

// ==========================================
// ACADEMIC CALENDAR ACTIONS
// ==========================================

export async function getCalendarAction(options?: masterData.CalendarFilterOptions) {
  const session = await requireAdminSession();
  return await masterData.getAcademicCalendars(session.schoolId, options);
}

export async function setCalendarAction(input: masterData.SetAcademicCalendarInput) {
  const session = await requireAdminSession();
  const result = await masterData.setAcademicCalendar(session.schoolId, input);
  revalidatePath('/admin/calendar');
  return { success: true, data: result };
}

export async function deleteCalendarAction(date: string) {
  const session = await requireAdminSession();
  const result = await masterData.deleteAcademicCalendarByDate(session.schoolId, date);
  revalidatePath('/admin/calendar');
  return { success: true, data: result };
}

// ==========================================
// ACADEMIC YEARS ACTIONS
// ==========================================

export async function getAcademicYearsAction() {
  const session = await requireAdminSession();
  return await masterData.getAcademicYears(session.schoolId);
}
