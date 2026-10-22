import { db } from '@/db';
import { students, classes, classEnrollments, academicYears } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { parseSpreadsheetBuffer, ParseOptions } from './csvExcelParser';
import { sanitizeString, sanitizeGender, sanitizePhone } from './sanitizer';
import { ImportError, ImportResult, RawStudentRow } from './types';

function findColumnValue(row: Record<string, string>, possibleHeaders: string[]): string {
  const rowKeys = Object.keys(row);
  for (const target of possibleHeaders) {
    const matchedKey = rowKeys.find(
      (k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === target.toLowerCase().replace(/[^a-z0-9]/g, '')
    );
    if (matchedKey && row[matchedKey] !== undefined) {
      return row[matchedKey];
    }
  }
  return '';
}

export interface StudentImportOptions extends ParseOptions {
  schoolId: string;
  academicYearId?: string;
  defaultClassId?: string;
  dryRun?: boolean;
}

export async function parseAndValidateStudents(
  buffer: Buffer | ArrayBuffer | Uint8Array | string,
  options: StudentImportOptions
): Promise<ImportResult<RawStudentRow>> {
  const parsed = parseSpreadsheetBuffer(buffer, {
    filename: options.filename,
    mimeType: options.mimeType,
  });

  const errors: ImportError[] = [];
  const validRows: Array<{ rowNumber: number; data: RawStudentRow }> = [];
  const seenNis = new Map<string, number>();

  // 1. Client-level / Row-level validation
  for (const { rowNumber, data } of parsed.rawRows) {
    const rawNis = findColumnValue(data, ['nis', 'noinduk', 'nomorinduk', 'nissiswa']);
    const rawNisn = findColumnValue(data, ['nisn', 'nomorinduksiswanasional']);
    const rawName = findColumnValue(data, ['nama', 'namasiswa', 'name', 'namalengkap']);
    const rawGender = findColumnValue(data, ['gender', 'jeniskelamin', 'jk', 'sex']);
    const rawGuardianName = findColumnValue(data, ['namawali', 'namaorangtua', 'wali', 'guardian', 'orangtua']);
    const rawGuardianPhone = findColumnValue(data, [
      'nohpwali',
      'teleponwali',
      'kontakortu',
      'guardianphone',
      'nowa',
      'nohp',
      'phone',
    ]);
    const rawClassName = findColumnValue(data, ['kelas', 'rombel', 'class', 'namakelas']);

    const nis = sanitizeString(rawNis);
    const nisn = sanitizeString(rawNisn);
    const name = sanitizeString(rawName);
    const gender = sanitizeGender(rawGender);
    const guardianName = sanitizeString(rawGuardianName);
    const guardianPhone = sanitizePhone(rawGuardianPhone);
    const className = sanitizeString(rawClassName);

    // NIS validation
    if (!nis) {
      errors.push({
        row: rowNumber,
        column: 'nis',
        value: rawNis,
        message: 'NIS wajib diisi.',
      });
    } else if (nis.length < 2 || nis.length > 30) {
      errors.push({
        row: rowNumber,
        column: 'nis',
        value: nis,
        message: 'NIS harus antara 2 hingga 30 karakter.',
      });
    } else if (seenNis.has(nis)) {
      errors.push({
        row: rowNumber,
        column: 'nis',
        value: nis,
        message: `Duplikat NIS '${nis}' terdeteksi pada file (sama dengan baris ${seenNis.get(nis)}).`,
      });
    } else {
      seenNis.set(nis, rowNumber);
    }

    // Name validation
    if (!name) {
      errors.push({
        row: rowNumber,
        column: 'nama',
        value: rawName,
        message: 'Nama siswa wajib diisi.',
      });
    } else if (name.length < 2) {
      errors.push({
        row: rowNumber,
        column: 'nama',
        value: name,
        message: 'Nama siswa terlalu pendek (minimal 2 karakter).',
      });
    }

    // Gender validation
    if (!gender) {
      errors.push({
        row: rowNumber,
        column: 'gender',
        value: rawGender,
        message: 'Jenis kelamin wajib diisi (L atau P / Laki-laki atau Perempuan).',
      });
    }

    if (nis && name && gender && !seenNis.get(nis + '_has_err')) {
      validRows.push({
        rowNumber,
        data: {
          nis,
          nisn: nisn || undefined,
          name,
          gender,
          guardianName: guardianName || undefined,
          guardianPhone: guardianPhone || undefined,
          className: className || undefined,
        },
      });
    }
  }

  // 2. Database-level Duplicate Check (School-scoped)
  const nisList = Array.from(seenNis.keys());
  if (nisList.length > 0) {
    const existingStudents = await db
      .select({ nis: students.nis })
      .from(students)
      .where(
        and(
          eq(students.schoolId, options.schoolId),
          inArray(students.nis, nisList)
        )
      );

    const existingNisSet = new Set(existingStudents.map((s) => s.nis));

    for (const item of validRows) {
      if (existingNisSet.has(item.data.nis)) {
        errors.push({
          row: item.rowNumber,
          column: 'nis',
          value: item.data.nis,
          message: `NIS '${item.data.nis}' sudah terdaftar di database sekolah ini.`,
        });
      }
    }
  }

  // Sort errors by rowNumber ascending
  errors.sort((a, b) => a.row - b.row);

  const totalRows = parsed.rawRows.length;
  const hasErrors = errors.length > 0;

  if (hasErrors || options.dryRun) {
    return {
      success: !hasErrors,
      totalRows,
      validRows: hasErrors ? totalRows - errors.length : validRows.length,
      errorCount: errors.length,
      errors,
      importedCount: 0,
      data: validRows.map((r) => r.data),
    };
  }

  // 3. Execution: Insert into DB (All rows valid)
  // Fetch existing classes in this school for class name mapping if provided
  const schoolClasses = await db
    .select()
    .from(classes)
    .where(eq(classes.schoolId, options.schoolId));
  const classMap = new Map(schoolClasses.map((c) => [c.name.toUpperCase(), c.id]));

  let academicYearId = options.academicYearId;
  if (!academicYearId) {
    const activeAy = await db
      .select()
      .from(academicYears)
      .where(
        and(
          eq(academicYears.schoolId, options.schoolId),
          eq(academicYears.isActive, true)
        )
      )
      .limit(1);
    if (activeAy.length > 0) {
      academicYearId = activeAy[0].id;
    }
  }

  let importedCount = 0;

  await db.transaction(async (tx) => {
    for (const item of validRows) {
      const studentData = item.data;
      const [newStudent] = await tx
        .insert(students)
        .values({
          schoolId: options.schoolId,
          nis: studentData.nis,
          nisn: studentData.nisn,
          name: studentData.name,
          gender: studentData.gender,
          guardianName: studentData.guardianName,
          guardianPhone: studentData.guardianPhone,
          isActive: true,
        })
        .returning();

      importedCount++;

      // Handle class enrollment if specified
      let targetClassId = options.defaultClassId;
      if (studentData.className && classMap.has(studentData.className.toUpperCase())) {
        targetClassId = classMap.get(studentData.className.toUpperCase());
      }

      if (targetClassId && academicYearId) {
        await tx.insert(classEnrollments).values({
          schoolId: options.schoolId,
          classId: targetClassId,
          studentId: newStudent.id,
          academicYearId,
        });
      }
    }
  });

  return {
    success: true,
    totalRows,
    validRows: validRows.length,
    errorCount: 0,
    errors: [],
    importedCount,
    data: validRows.map((r) => r.data),
  };
}
