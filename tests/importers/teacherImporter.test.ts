import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/db';
import { schools, users, USER_ROLES } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { parseAndValidateTeachers } from '@/lib/importers/teacherImporter';
import * as XLSX from 'xlsx';

describe('Teacher Importer Unit Tests', () => {
  let testSchoolId: string;

  beforeAll(async () => {
    const [school] = await db
      .insert(schools)
      .values({
        name: 'SMA Test Importer Guru',
        npsn: 'G' + Math.random().toString(36).substring(2, 10),
      })
      .returning();
    testSchoolId = school.id;
  });

  afterAll(async () => {
    if (testSchoolId) {
      await db.delete(schools).where(eq(schools.id, testSchoolId));
    }
  });

  it('imports valid CSV teachers, parses roles, and strips XSS', async () => {
    const csvData = [
      'NIP,Nama Guru,Email,Role,No HP',
      '19850101,<b>Dr. Subagyo</b>,subagyo@testschool.sch.id,Guru Mapel,081111222',
      '19850202,Nurul Hidayati,nurul@testschool.sch.id,Wali Kelas,081111333',
    ].join('\n');

    const result = await parseAndValidateTeachers(csvData, {
      schoolId: testSchoolId,
      filename: 'guru.csv',
      mimeType: 'text/csv',
    });

    expect(result.success).toBe(true);
    expect(result.importedCount).toBe(2);
    expect(result.errorCount).toBe(0);

    const [subagyo] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.schoolId, testSchoolId),
          eq(users.email, 'subagyo@testschool.sch.id')
        )
      );

    expect(subagyo).toBeDefined();
    expect(subagyo.name).toBe('Dr. Subagyo'); // HTML tag stripped
    expect(subagyo.role).toBe(USER_ROLES.GURU_MAPEL);
    expect(subagyo.passwordHash).toBeDefined();
    expect(subagyo.passwordHash.startsWith('$2')).toBe(true); // Bcrypt hash!
  });

  it('detects duplicate email within file', async () => {
    const csvData = [
      'Nama,Email',
      'Guru A,kembar@testschool.sch.id',
      'Guru B,kembar@testschool.sch.id',
    ].join('\n');

    const result = await parseAndValidateTeachers(csvData, {
      schoolId: testSchoolId,
      filename: 'guru_dup_email.csv',
    });

    expect(result.success).toBe(false);
    expect(result.importedCount).toBe(0);
    expect(result.errors.some((e) => e.column === 'email')).toBe(true);
  });

  it('detects duplicate NIP within file', async () => {
    const csvData = [
      'Nama,Email,NIP',
      'Guru A,guruA@testschool.sch.id,1980000001',
      'Guru B,guruB@testschool.sch.id,1980000001',
    ].join('\n');

    const result = await parseAndValidateTeachers(csvData, {
      schoolId: testSchoolId,
      filename: 'guru_dup_nip.csv',
    });

    expect(result.success).toBe(false);
    expect(result.importedCount).toBe(0);
    expect(result.errors.some((e) => e.column === 'nip')).toBe(true);
  });

  it('detects duplicate email against database', async () => {
    // subagyo@testschool.sch.id already exists
    const csvData = [
      'Nama,Email',
      'Guru Klon,subagyo@testschool.sch.id',
    ].join('\n');

    const result = await parseAndValidateTeachers(csvData, {
      schoolId: testSchoolId,
      filename: 'guru_db_dup.csv',
    });

    expect(result.success).toBe(false);
    expect(result.importedCount).toBe(0);
    expect(result.errors[0].message).toContain('sudah terdaftar');
  });

  it('validates invalid email format', async () => {
    const csvData = [
      'Nama,Email',
      'Guru Invalid,bukan-email-valid',
    ].join('\n');

    const result = await parseAndValidateTeachers(csvData, {
      schoolId: testSchoolId,
      filename: 'guru_bad_email.csv',
    });

    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.message.includes('Format email tidak valid'))).toBe(true);
  });

  it('supports XLSX format for teachers', async () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Nama', 'Email', 'Role'],
      ['Guru Fisika', 'fisika@testschool.sch.id', 'GURU_MAPEL'],
      ['Guru Kimia', 'kimia@testschool.sch.id', 'GURU_MAPEL'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Guru');
    const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const result = await parseAndValidateTeachers(xlsxBuffer, {
      schoolId: testSchoolId,
      filename: 'guru.xlsx',
    });

    expect(result.success).toBe(true);
    expect(result.importedCount).toBe(2);
  });
});
