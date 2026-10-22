import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  date,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Role Enum Constants
export const USER_ROLES = {
  ADMIN_SEKOLAH: 'ADMIN_SEKOLAH',
  GURU_MAPEL: 'GURU_MAPEL',
  WALI_KELAS: 'WALI_KELAS',
  KEPALA_SEKOLAH: 'KEPALA_SEKOLAH',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// 1. Schools
export const schools = pgTable('schools', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  npsn: varchar('npsn', { length: 20 }).notNull().unique(),
  address: text('address'),
  timezone: varchar('timezone', { length: 50 }).default('Asia/Jakarta').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. Users
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: uuid('school_id')
    .references(() => schools.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 }).notNull(), // ADMIN_SEKOLAH, GURU_MAPEL, WALI_KELAS, KEPALA_SEKOLAH
  nip: varchar('nip', { length: 50 }),
  phone: varchar('phone', { length: 30 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. Academic Years
export const academicYears = pgTable('academic_years', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: uuid('school_id')
    .references(() => schools.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 50 }).notNull(), // e.g. "2026/2027"
  semester: varchar('semester', { length: 20 }).notNull(), // "GANJIL" | "GENAP"
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  isActive: boolean('is_active').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 4. Academic Calendars
export const academicCalendars = pgTable(
  'academic_calendars',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    schoolId: uuid('school_id')
      .references(() => schools.id, { onDelete: 'cascade' })
      .notNull(),
    date: date('date').notNull(),
    dayType: varchar('day_type', { length: 30 }).notNull(), // 'ACTIVE_KBM' | 'HOLIDAY' | 'SPECIAL_EVENT'
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('academic_calendars_school_date_idx').on(table.schoolId, table.date),
  ]
);

// 5. Classes
export const classes = pgTable('classes', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: uuid('school_id')
    .references(() => schools.id, { onDelete: 'cascade' })
    .notNull(),
  academicYearId: uuid('academic_year_id')
    .references(() => academicYears.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 50 }).notNull(), // e.g. "X-A"
  gradeLevel: varchar('grade_level', { length: 20 }).notNull(), // "10", "11", "12"
  homeroomTeacherId: uuid('homeroom_teacher_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 6. Students
export const students = pgTable('students', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: uuid('school_id')
    .references(() => schools.id, { onDelete: 'cascade' })
    .notNull(),
  nis: varchar('nis', { length: 30 }).notNull(),
  nisn: varchar('nisn', { length: 30 }),
  name: varchar('name', { length: 255 }).notNull(),
  gender: varchar('gender', { length: 10 }).notNull(), // 'L' | 'P'
  guardianName: varchar('guardian_name', { length: 255 }),
  guardianPhone: varchar('guardian_phone', { length: 30 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 7. Class Enrollments
export const classEnrollments = pgTable(
  'class_enrollments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    schoolId: uuid('school_id')
      .references(() => schools.id, { onDelete: 'cascade' })
      .notNull(),
    classId: uuid('class_id')
      .references(() => classes.id, { onDelete: 'cascade' })
      .notNull(),
    studentId: uuid('student_id')
      .references(() => students.id, { onDelete: 'cascade' })
      .notNull(),
    academicYearId: uuid('academic_year_id')
      .references(() => academicYears.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('class_enrollments_unique_idx').on(
      table.classId,
      table.studentId,
      table.academicYearId
    ),
  ]
);

// 8. Teaching Schedules
export const teachingSchedules = pgTable('teaching_schedules', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: uuid('school_id')
    .references(() => schools.id, { onDelete: 'cascade' })
    .notNull(),
  classId: uuid('class_id')
    .references(() => classes.id, { onDelete: 'cascade' })
    .notNull(),
  teacherId: uuid('teacher_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  subjectName: varchar('subject_name', { length: 100 }).notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 1=Senin ... 7=Minggu
  periodOrder: integer('period_order').notNull(), // 1, 2, 3..
  startTime: varchar('start_time', { length: 10 }).notNull(), // "07:00"
  endTime: varchar('end_time', { length: 10 }).notNull(), // "08:30"
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 9. Attendance Sessions
export const attendanceSessions = pgTable(
  'attendance_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    schoolId: uuid('school_id')
      .references(() => schools.id, { onDelete: 'cascade' })
      .notNull(),
    classId: uuid('class_id')
      .references(() => classes.id, { onDelete: 'cascade' })
      .notNull(),
    date: date('date').notNull(),
    submittedByTeacherId: uuid('submitted_by_teacher_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    status: varchar('status', { length: 30 }).default('DRAFT').notNull(), // 'DRAFT' | 'SUBMITTED' | 'UNCOMPLETED_ALERT'
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    isLateSubmission: boolean('is_late_submission').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('attendance_sessions_school_class_date_idx').on(
      table.schoolId,
      table.classId,
      table.date
    ),
  ]
);

// 10. Attendance Records
export const attendanceRecords = pgTable(
  'attendance_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    schoolId: uuid('school_id')
      .references(() => schools.id, { onDelete: 'cascade' })
      .notNull(),
    sessionId: uuid('session_id')
      .references(() => attendanceSessions.id, { onDelete: 'cascade' })
      .notNull(),
    studentId: uuid('student_id')
      .references(() => students.id, { onDelete: 'cascade' })
      .notNull(),
    status: varchar('status', { length: 30 }).default('UNRECORDED').notNull(), // 'UNRECORDED' | 'PRESENT' | 'SICK' | 'PERMIT' | 'ABSENT_ALPA'
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('attendance_records_session_student_idx').on(
      table.sessionId,
      table.studentId
    ),
  ]
);

// 11. Attendance Corrections
export const attendanceCorrections = pgTable('attendance_corrections', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: uuid('school_id')
    .references(() => schools.id, { onDelete: 'cascade' })
    .notNull(),
  attendanceRecordId: uuid('attendance_record_id')
    .references(() => attendanceRecords.id, { onDelete: 'cascade' })
    .notNull(),
  correctedByUserId: uuid('corrected_by_user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  oldStatus: varchar('old_status', { length: 30 }).notNull(),
  newStatus: varchar('new_status', { length: 30 }).notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 12. Attendance Follow Ups
export const attendanceFollowUps = pgTable('attendance_follow_ups', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: uuid('school_id')
    .references(() => schools.id, { onDelete: 'cascade' })
    .notNull(),
  attendanceRecordId: uuid('attendance_record_id')
    .references(() => attendanceRecords.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  channel: varchar('channel', { length: 30 }).default('WHATSAPP').notNull(),
  status: varchar('status', { length: 30 }).notNull(), // 'CLICKED' | 'MARKED_CONTACTED'
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 13. Early Warning Logs
export const earlyWarningLogs = pgTable('early_warning_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: uuid('school_id')
    .references(() => schools.id, { onDelete: 'cascade' })
    .notNull(),
  studentId: uuid('student_id')
    .references(() => students.id, { onDelete: 'cascade' })
    .notNull(),
  indicatorCode: varchar('indicator_code', { length: 50 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(), // 'RENDAH' | 'SEDANG' | 'TINGGI'
  metricSnapshotJson: text('metric_snapshot_json'),
  aiNarrative: text('ai_narrative'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 14. Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: uuid('school_id')
    .references(() => schools.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: varchar('entity_id', { length: 100 }),
  detailsJson: text('details_json'),
  ipAddress: varchar('ip_address', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations Definitions
export const schoolsRelations = relations(schools, ({ many }) => ({
  users: many(users),
  classes: many(classes),
  students: many(students),
  academicYears: many(academicYears),
  academicCalendars: many(academicCalendars),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  school: one(schools, {
    fields: [users.schoolId],
    references: [schools.id],
  }),
  homeroomClasses: many(classes),
  teachingSchedules: many(teachingSchedules),
  attendanceCorrections: many(attendanceCorrections),
  attendanceFollowUps: many(attendanceFollowUps),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  school: one(schools, {
    fields: [classes.schoolId],
    references: [schools.id],
  }),
  academicYear: one(academicYears, {
    fields: [classes.academicYearId],
    references: [academicYears.id],
  }),
  homeroomTeacher: one(users, {
    fields: [classes.homeroomTeacherId],
    references: [users.id],
  }),
  enrollments: many(classEnrollments),
  teachingSchedules: many(teachingSchedules),
  attendanceSessions: many(attendanceSessions),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  school: one(schools, {
    fields: [students.schoolId],
    references: [schools.id],
  }),
  enrollments: many(classEnrollments),
  attendanceRecords: many(attendanceRecords),
  earlyWarningLogs: many(earlyWarningLogs),
}));

export const attendanceSessionsRelations = relations(attendanceSessions, ({ one, many }) => ({
  school: one(schools, {
    fields: [attendanceSessions.schoolId],
    references: [schools.id],
  }),
  class: one(classes, {
    fields: [attendanceSessions.classId],
    references: [classes.id],
  }),
  submittedByTeacher: one(users, {
    fields: [attendanceSessions.submittedByTeacherId],
    references: [users.id],
  }),
  records: many(attendanceRecords),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one, many }) => ({
  school: one(schools, {
    fields: [attendanceRecords.schoolId],
    references: [schools.id],
  }),
  session: one(attendanceSessions, {
    fields: [attendanceRecords.sessionId],
    references: [attendanceSessions.id],
  }),
  student: one(students, {
    fields: [attendanceRecords.studentId],
    references: [students.id],
  }),
  corrections: many(attendanceCorrections),
  followUps: many(attendanceFollowUps),
}));
