import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/db';
import { schools, students, academicYears, classes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { parseAndValidateStudents } from '@/lib/importers/studentImporter';
import * as XLSX from 'xlsx';

describe('Student Importer Unit Tests', () => {
  let testSchoolId: string;
  let testAcademicYearId: string;
  let testClassId: string;

  beforeAll(async () => {
    // Create dedicated test school
    const [school] = await db
      .insert(schools)
      .values({
        name: 'SMA Test Importer Siswa',
        npsn: 'S' + Math.random().toString(36).substring(2, 10),
      })
      .returning();
    testSchoolId = school.id;

    // Create academic year
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
    testAcademicYearId = ay.id;

    // Create class X-A
    const [cls] = await db
      .insert(classes)
      .values({
        schoolId: testSchoolId,
        academicYearId: testAcademicYearId,
        name: 'X-A',
        gradeLevel: '10',
      })
      .returning();
    testClassId = cls.id;
  });

  afterAll(async () => {
    // Cascade delete school will clean up test data
    if (testSchoolId) {
      await db.delete(schools).where(eq(schools.id, testSchoolId));
    }
  });

  it('imports valid CSV data successfully and strips XSS from names', async () => {
    const csvData = [
      'NIS,Nama,Gender,Nama Wali,No HP Wali,Kelas',
      '2026001,<script>alert(1)</script>Budi Pratama,Laki-laki,Pak Joko,081234567890,X-A',
      '2026002,Siti Aminah,Perempuan,Ibu Siti,081234567891,X-A',
    ].join('\n');

    const result = await parseAndValidateStudents(csvData, {
      schoolId: testSchoolId,
      filename: 'siswa.csv',
      mimeType: 'text/csv',
    });

    expect(result.success).toBe(true);
    expect(result.importedCount).toBe(2);
    expect(result.errorCount).toBe(0);
    expect(result.errors).toHaveLength(0);

    // Verify DB
    const [budi] = await db
      .select()
      .from(students)
      .where(and(eq(students.schoolId, testSchoolId), eq(students.nis, '2026001')));

    expect(budi).toBeDefined();
    expect(budi.name).toBe('Budi Pratama'); // XSS stripped!
    expect(budi.gender).toBe('L');
  });

  it('detects duplicate NIS within the uploaded file and rejects without importing', async () => {
    const csvDuplicate = [
      'NIS,Nama,Gender',
      '2026010,Siswa Pertama,L',
      '2026011,Siswa Kedua,P',
      '2026010,Siswa Duplikat Baris 2,L', // Same NIS as row 2
    ].join('\n');

    const result = await parseAndValidateStudents(csvDuplicate, {
      schoolId: testSchoolId,
      filename: 'siswa_duplikat.csv',
    });

    expect(result.success).toBe(false);
    expect(result.importedCount).toBe(0);
    expect(result.errorCount).toBeGreaterThan(0);

    const dupError = result.errors.find((e) => e.column === 'nis');
    expect(dupError).toBeDefined();
    expect(dupError?.row).toBe(4);
    expect(dupError?.message).toContain('Duplikat NIS');

    // Verify DB does not contain 2026010 or 2026011
    const checkDb = await db
      .select()
      .from(students)
      .where(and(eq(students.schoolId, testSchoolId), eq(students.nis, '2026011')));
    expect(checkDb).toHaveLength(0);
  });

  it('detects duplicate NIS against existing records in DB', async () => {
    // 2026001 was already inserted in first test
    const csvDbDuplicate = [
      'NIS,Nama,Gender',
      '2026001,Nama Baru Tapi NIS Sama,L',
    ].join('\n');

    const result = await parseAndValidateStudents(csvDbDuplicate, {
      schoolId: testSchoolId,
      filename: 'siswa_db_dup.csv',
    });

    expect(result.success).toBe(false);
    expect(result.importedCount).toBe(0);
    const dbError = result.errors.find((e) => e.column === 'nis');
    expect(dbError).toBeDefined();
    expect(dbError?.message).toContain('sudah terdaftar di database');
  });

  it('reports missing required fields with exact row and column numbers', async () => {
    const csvInvalid = [
      'NIS,Nama,Gender',
      ',Siswa Tanpa NIS,L',
      '2026099,,P',
      '2026100,Siswa Salah Gender,INVALID',
    ].join('\n');

    const result = await parseAndValidateStudents(csvInvalid, {
      schoolId: testSchoolId,
      filename: 'invalid.csv',
    });

    expect(result.success).toBe(false);
    expect(result.errorCount).toBe(3);

    expect(result.errors.some((e) => e.row === 2 && e.column === 'nis')).toBe(true);
    expect(result.errors.some((e) => e.row === 3 && e.column === 'nama')).toBe(true);
    expect(result.errors.some((e) => e.row === 4 && e.column === 'gender')).toBe(true);
  });

  it('supports XLSX binary buffer successfully', async () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['NIS', 'Nama', 'Gender', 'No HP Wali'],
      ['2026301', 'Rian Hidayat', 'L', '0812999901'],
      ['2026302', 'Lina Marlina', 'P', '0812999902'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Siswa');
    const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const result = await parseAndValidateStudents(xlsxBuffer, {
      schoolId: testSchoolId,
      filename: 'siswa.xlsx',
    });

    expect(result.success).toBe(true);
    expect(result.importedCount).toBe(2);
  });
});
