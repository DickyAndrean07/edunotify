import { db } from '@/db';
import { users, USER_ROLES, UserRole } from '@/db/schema';
import { eq, and, inArray, or } from 'drizzle-orm';
import { parseSpreadsheetBuffer, ParseOptions } from './csvExcelParser';
import { sanitizeString, sanitizeEmail, sanitizePhone, isValidEmail } from './sanitizer';
import { ImportError, ImportResult, RawTeacherRow } from './types';
import { hashPassword } from '@/lib/auth/password';

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

function parseRole(rawRole: string): UserRole {
  const upper = rawRole.toUpperCase().replace(/\s+/g, '_');
  if (upper.includes('WALI') || upper === 'WALI_KELAS') {
    return USER_ROLES.WALI_KELAS;
  }
  if (upper.includes('KEPALA') || upper.includes('KEPSEK') || upper === 'KEPALA_SEKOLAH') {
    return USER_ROLES.KEPALA_SEKOLAH;
  }
  return USER_ROLES.GURU_MAPEL;
}

export interface TeacherImportOptions extends ParseOptions {
  schoolId: string;
  defaultPassword?: string;
  dryRun?: boolean;
}

export async function parseAndValidateTeachers(
  buffer: Buffer | ArrayBuffer | Uint8Array | string,
  options: TeacherImportOptions
): Promise<ImportResult<RawTeacherRow>> {
  const parsed = parseSpreadsheetBuffer(buffer, {
    filename: options.filename,
    mimeType: options.mimeType,
  });

  const errors: ImportError[] = [];
  const validRows: Array<{ rowNumber: number; data: RawTeacherRow }> = [];
  const seenEmails = new Map<string, number>();
  const seenNips = new Map<string, number>();

  // 1. Client-level validation
  for (const { rowNumber, data } of parsed.rawRows) {
    const rawName = findColumnValue(data, ['nama', 'namaguru', 'name', 'namalengkap']);
    const rawEmail = findColumnValue(data, ['email', 'surel', 'alamatemail']);
    const rawRole = findColumnValue(data, ['role', 'peran', 'jabatan']);
    const rawNip = findColumnValue(data, ['nip', 'nomorindukpegawai', 'nonip']);
    const rawPhone = findColumnValue(data, ['phone', 'nohp', 'telepon', 'kontak', 'nowa']);

    const name = sanitizeString(rawName);
    const email = sanitizeEmail(rawEmail);
    const role = parseRole(sanitizeString(rawRole));
    const nip = sanitizeString(rawNip);
    const phone = sanitizePhone(rawPhone);

    // Name validation
    if (!name) {
      errors.push({
        row: rowNumber,
        column: 'nama',
        value: rawName,
        message: 'Nama guru wajib diisi.',
      });
    } else if (name.length < 2) {
      errors.push({
        row: rowNumber,
        column: 'nama',
        value: name,
        message: 'Nama guru terlalu pendek (minimal 2 karakter).',
      });
    }

    // Email validation
    if (!email) {
      errors.push({
        row: rowNumber,
        column: 'email',
        value: rawEmail,
        message: 'Email wajib diisi.',
      });
    } else if (!isValidEmail(email)) {
      errors.push({
        row: rowNumber,
        column: 'email',
        value: email,
        message: 'Format email tidak valid.',
      });
    } else if (seenEmails.has(email)) {
      errors.push({
        row: rowNumber,
        column: 'email',
        value: email,
        message: `Duplikat Email '${email}' terdeteksi pada file (sama dengan baris ${seenEmails.get(email)}).`,
      });
    } else {
      seenEmails.set(email, rowNumber);
    }

    // NIP validation (optional, but if provided check duplicate in file)
    if (nip) {
      if (seenNips.has(nip)) {
        errors.push({
          row: rowNumber,
          column: 'nip',
          value: nip,
          message: `Duplikat NIP '${nip}' terdeteksi pada file (sama dengan baris ${seenNips.get(nip)}).`,
        });
      } else {
        seenNips.set(nip, rowNumber);
      }
    }

    if (name && email && isValidEmail(email) && !seenEmails.get(email + '_has_err')) {
      validRows.push({
        rowNumber,
        data: {
          name,
          email,
          role,
          nip: nip || undefined,
          phone: phone || undefined,
        },
      });
    }
  }

  // 2. Database-level Duplicate Check
  const emailsToCheck = Array.from(seenEmails.keys());
  if (emailsToCheck.length > 0) {
    const existingUsers = await db
      .select({ email: users.email, nip: users.nip })
      .from(users)
      .where(inArray(users.email, emailsToCheck));

    const existingEmailSet = new Set(existingUsers.map((u) => u.email.toLowerCase()));

    for (const item of validRows) {
      if (existingEmailSet.has(item.data.email.toLowerCase())) {
        errors.push({
          row: item.rowNumber,
          column: 'email',
          value: item.data.email,
          message: `Email '${item.data.email}' sudah terdaftar dalam sistem.`,
        });
      }
    }
  }

  // Check NIP in DB for the same school
  const nipsToCheck = Array.from(seenNips.keys());
  if (nipsToCheck.length > 0) {
    const existingNipUsers = await db
      .select({ nip: users.nip })
      .from(users)
      .where(
        and(
          eq(users.schoolId, options.schoolId),
          inArray(users.nip, nipsToCheck)
        )
      );

    const existingNipSet = new Set(existingNipUsers.map((u) => u.nip));

    for (const item of validRows) {
      if (item.data.nip && existingNipSet.has(item.data.nip)) {
        errors.push({
          row: item.rowNumber,
          column: 'nip',
          value: item.data.nip,
          message: `NIP '${item.data.nip}' sudah terdaftar di sekolah ini.`,
        });
      }
    }
  }

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
  const defaultPassword = options.defaultPassword || 'EduNotify2026!';
  const hashedPassword = await hashPassword(defaultPassword);

  let importedCount = 0;

  await db.transaction(async (tx) => {
    for (const item of validRows) {
      const teacherData = item.data;
      await tx.insert(users).values({
        schoolId: options.schoolId,
        name: teacherData.name,
        email: teacherData.email,
        passwordHash: hashedPassword,
        role: teacherData.role,
        nip: teacherData.nip,
        phone: teacherData.phone,
        isActive: true,
      });
      importedCount++;
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
