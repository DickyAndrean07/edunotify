import { describe, it, expect } from 'vitest';
import * as schema from '@/db/schema';
import { getTableColumns } from 'drizzle-orm';
import { db } from '@/db';
import { eq } from 'drizzle-orm';

describe('Drizzle Multitenant Schema Requirements', () => {
  const operationalTables = [
    { name: 'users', table: schema.users },
    { name: 'classes', table: schema.classes },
    { name: 'students', table: schema.students },
    { name: 'academicYears', table: schema.academicYears },
    { name: 'academicCalendars', table: schema.academicCalendars },
    { name: 'teachingSchedules', table: schema.teachingSchedules },
    { name: 'attendanceSessions', table: schema.attendanceSessions },
    { name: 'attendanceRecords', table: schema.attendanceRecords },
    { name: 'attendanceCorrections', table: schema.attendanceCorrections },
    { name: 'attendanceFollowUps', table: schema.attendanceFollowUps },
    { name: 'earlyWarningLogs', table: schema.earlyWarningLogs },
    { name: 'auditLogs', table: schema.auditLogs },
    { name: 'classEnrollments', table: schema.classEnrollments },
  ];

  it('should define schools table as root multitenant entity', () => {
    const columns = getTableColumns(schema.schools);
    expect(columns).toHaveProperty('id');
    expect(columns).toHaveProperty('name');
    expect(columns).toHaveProperty('npsn');
    expect(columns).toHaveProperty('timezone');
  });

  it.each(operationalTables)(
    'operational table $name must have school_id (schoolId) column for tenant isolation',
    ({ table }) => {
      const columns = getTableColumns(table);
      expect(columns).toHaveProperty('schoolId');
    }
  );

  it('should isolate queries by school_id in PostgreSQL', async () => {
    const allSchools = await db.select().from(schema.schools).limit(1);
    expect(allSchools.length).toBeGreaterThan(0);
    const activeSchool = allSchools[0];

    // Query users scoped to active school
    const scopedUsers = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.schoolId, activeSchool.id));

    expect(scopedUsers.length).toBeGreaterThan(0);
    for (const u of scopedUsers) {
      expect(u.schoolId).toBe(activeSchool.id);
    }

    // Query with non-existent school ID must return 0 records
    const nonExistentSchoolId = '00000000-0000-0000-0000-000000000000';
    const emptyResult = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.schoolId, nonExistentSchoolId));

    expect(emptyResult).toHaveLength(0);
  });
});
