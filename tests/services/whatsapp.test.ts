import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/db';
import {
  schools,
  academicYears,
  classes,
  students,
  classEnrollments,
  users,
  attendanceSessions,
  attendanceRecords,
  attendanceFollowUps,
  auditLogs,
  USER_ROLES,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  sanitizePhoneNumber,
  formatIndonesianDate,
  formatWhatsAppMessage,
  generateWhatsAppUrl,
  recordWhatsAppOpened,
  markAsContacted,
  getInterventionStatuses,
  WhatsAppValidationError,
} from '@/services/whatsappService';
import { hashPassword } from '@/lib/auth/password';

describe('EDUNOTIFY-04: WhatsApp Service & Intervention Tracking', () => {
  let schoolId: string;
  let academicYearId: string;
  let classId: string;
  let homeroomTeacherId: string;
  let student1Id: string;
  let student2Id: string; // Sibling sharing same phone
  let record1Id: string;
  let record2Id: string;
  const testDate = '2026-10-19';

  beforeAll(async () => {
    // 1. Setup School
    const [school] = await db
      .insert(schools)
      .values({
        name: 'SMA Budi Luhur',
        npsn: 'WA_' + Math.random().toString(36).substring(2, 9),
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

    // 3. Setup Homeroom Teacher User
    const [teacher] = await db
      .insert(users)
      .values({
        schoolId,
        name: 'Drs. Supriyadi, M.Pd.',
        email: `wali_${Math.random().toString(36).substring(2, 8)}@test.com`,
        passwordHash: await hashPassword('password123'),
        role: 'WALI_KELAS',
        nip: '197501012000031001',
      })
      .returning();
    homeroomTeacherId = teacher.id;

    // 4. Setup Class
    const [cls] = await db
      .insert(classes)
      .values({
        schoolId,
        academicYearId,
        name: 'X-A',
        gradeLevel: '10',
        homeroomTeacherId,
      })
      .returning();
    classId = cls.id;

    // 5. Setup 2 Students who are siblings sharing the SAME guardian_phone
    const sharedGuardianPhone = '0812-3456-7890';
    const [s1] = await db
      .insert(students)
      .values({
        schoolId,
        nis: '1001',
        name: 'Ahmad Fauzi',
        gender: 'L',
        guardianName: 'Bapak Hartono',
        guardianPhone: sharedGuardianPhone,
      })
      .returning();
    student1Id = s1.id;

    const [s2] = await db
      .insert(students)
      .values({
        schoolId,
        nis: '1002',
        name: 'Siti Fauziah',
        gender: 'P',
        guardianName: 'Bapak Hartono',
        guardianPhone: sharedGuardianPhone,
      })
      .returning();
    student2Id = s2.id;

    await db.insert(classEnrollments).values([
      { schoolId, classId, studentId: student1Id, academicYearId },
      { schoolId, classId, studentId: student2Id, academicYearId },
    ]);

    // 6. Setup Attendance Session & Records with status ABSENT_ALPA
    const [session] = await db
      .insert(attendanceSessions)
      .values({
        schoolId,
        classId,
        date: testDate,
        submittedByTeacherId: homeroomTeacherId,
        status: 'SUBMITTED',
      })
      .returning();

    const [rec1] = await db
      .insert(attendanceRecords)
      .values({
        schoolId,
        sessionId: session.id,
        studentId: student1Id,
        status: 'ABSENT_ALPA',
      })
      .returning();
    record1Id = rec1.id;

    const [rec2] = await db
      .insert(attendanceRecords)
      .values({
        schoolId,
        sessionId: session.id,
        studentId: student2Id,
        status: 'ABSENT_ALPA',
      })
      .returning();
    record2Id = rec2.id;
  });

  afterAll(async () => {
    if (schoolId) {
      await db.delete(schools).where(eq(schools.id, schoolId));
    }
  });

  // ==========================================
  // 1. Phone Sanitization Tests
  // ==========================================
  describe('1. Phone Number Sanitization', () => {
    it('converts leading 08 to 628', () => {
      expect(sanitizePhoneNumber('08123456789')).toBe('628123456789');
    });

    it('strips dashes, spaces, and brackets', () => {
      expect(sanitizePhoneNumber('0812-3456-7890')).toBe('6281234567890');
      expect(sanitizePhoneNumber('(0812) 3456 7890')).toBe('6281234567890');
      expect(sanitizePhoneNumber('+62 812-3456-7890')).toBe('6281234567890');
    });

    it('handles already normalized 628 numbers', () => {
      expect(sanitizePhoneNumber('628123456789')).toBe('628123456789');
    });

    it('converts numbers starting with 8 to 628', () => {
      expect(sanitizePhoneNumber('81234567890')).toBe('6281234567890');
    });

    it('throws error for empty or invalid numbers', () => {
      expect(() => sanitizePhoneNumber('')).toThrow(WhatsAppValidationError);
      expect(() => sanitizePhoneNumber('abc')).toThrow(WhatsAppValidationError);
      expect(() => sanitizePhoneNumber('0812')).toThrow(WhatsAppValidationError); // too short
    });
  });

  // ==========================================
  // 2. Date Formatting & Message Template Tests
  // ==========================================
  describe('2. Indonesian Date & Message Template', () => {
    it('formats date string YYYY-MM-DD to standard Indonesian date', () => {
      const formatted = formatIndonesianDate('2026-10-19');
      expect(formatted).toBe('Senin, 19 Oktober 2026');
    });

    it('builds standard PRD template message verbatim', () => {
      const msg = formatWhatsAppMessage({
        studentName: 'Ahmad Fauzi',
        className: 'X-A',
        schoolName: 'SMA Budi Luhur',
        dateStr: '2026-10-19',
        homeroomTeacherName: 'Drs. Supriyadi, M.Pd.',
      });

      expect(msg).toContain('Yth. Orang Tua / Wali dari Ahmad Fauzi (X-A),');
      expect(msg).toContain('Kami dari SMA Budi Luhur menginformasikan');
      expect(msg).toContain('pada hari ini, Senin, 19 Oktober 2026');
      expect(msg).toContain('ananda tercatat TIDAK HADIR di sekolah tanpa keterangan (Alpa).');
      expect(msg).toContain('Mohon konfirmasi mengenai kondisi ananda melalui balasan pesan ini.');
      expect(msg).toContain('Drs. Supriyadi, M.Pd.');
      expect(msg).toContain('Wali Kelas X-A');
    });
  });

  // ==========================================
  // 3. URL Generation & Character Encoding
  // ==========================================
  describe('3. wa.me URL Generator & Encoding', () => {
    it('generates proper https://wa.me/{phone}?text={encoded} URL', () => {
      const url = generateWhatsAppUrl({
        guardianPhone: '0812-3456-7890',
        studentName: 'Ahmad Fauzi',
        className: 'X-A',
        schoolName: 'SMA Budi Luhur',
        dateStr: '2026-10-19',
        homeroomTeacherName: 'Drs. Supriyadi, M.Pd.',
      });

      expect(url).toMatch(/^https:\/\/wa\.me\/6281234567890\?text=/);
      // Spaces should be encoded
      expect(url).not.toContain(' ');
      // Should contain URI encoded components
      expect(url).toContain(encodeURIComponent('Ahmad Fauzi'));
      expect(url).toContain(encodeURIComponent('SMA Budi Luhur'));
    });
  });

  // ==========================================
  // 4. Multi-Student Sibling Handling
  // ==========================================
  describe('4. Multi-Student Single Phone Handling', () => {
    it('generates distinct personalized message URLs for siblings sharing same phone', () => {
      const url1 = generateWhatsAppUrl({
        guardianPhone: '0812-3456-7890',
        studentName: 'Ahmad Fauzi',
        className: 'X-A',
        schoolName: 'SMA Budi Luhur',
        dateStr: '2026-10-19',
        homeroomTeacherName: 'Drs. Supriyadi, M.Pd.',
      });

      const url2 = generateWhatsAppUrl({
        guardianPhone: '0812-3456-7890',
        studentName: 'Siti Fauziah',
        className: 'X-A',
        schoolName: 'SMA Budi Luhur',
        dateStr: '2026-10-19',
        homeroomTeacherName: 'Drs. Supriyadi, M.Pd.',
      });

      // Both target same phone
      expect(url1.startsWith('https://wa.me/6281234567890')).toBe(true);
      expect(url2.startsWith('https://wa.me/6281234567890')).toBe(true);

      // But texts differ by student name
      expect(url1).toContain(encodeURIComponent('Ahmad Fauzi'));
      expect(url1).not.toContain(encodeURIComponent('Siti Fauziah'));

      expect(url2).toContain(encodeURIComponent('Siti Fauziah'));
      expect(url2).not.toContain(encodeURIComponent('Ahmad Fauzi'));
    });
  });

  // ==========================================
  // 5. Intervention State Tracking & Audit Logs
  // ==========================================
  describe('5. Intervention State Tracking & Audit Trail', () => {
    it('defaults to Belum Dibuka (NOT_OPENED) before click', async () => {
      const statuses = await getInterventionStatuses(schoolId, [record1Id, record2Id]);
      expect(statuses[record1Id].status).toBe('NOT_OPENED');
      expect(statuses[record1Id].label).toBe('Belum Dibuka');
      expect(statuses[record2Id].status).toBe('NOT_OPENED');
    });

    it('transitions to WhatsApp Dibuka (WHATSAPP_OPENED) when link clicked', async () => {
      const result = await recordWhatsAppOpened(schoolId, record1Id, homeroomTeacherId);
      expect(result.status).toBe('WHATSAPP_OPENED');
      expect(result.followUp.status).toBe('CLICKED');

      // Verify DB state
      const statuses = await getInterventionStatuses(schoolId, [record1Id]);
      expect(statuses[record1Id].status).toBe('WHATSAPP_OPENED');
      expect(statuses[record1Id].label).toBe('WhatsApp Dibuka');

      // Verify Audit Log
      const [audit] = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.schoolId, schoolId),
            eq(auditLogs.entityId, record1Id),
            eq(auditLogs.action, 'WHATSAPP_LINK_OPENED')
          )
        )
        .limit(1);

      expect(audit).toBeDefined();
      expect(audit.userId).toBe(homeroomTeacherId);
    });

    it('transitions to Ditandai Sudah Dihubungi (MARKED_CONTACTED) manually', async () => {
      const result = await markAsContacted(
        schoolId,
        record1Id,
        homeroomTeacherId,
        'Sudah konfirmasi dengan ibunya via telepon'
      );

      expect(result.status).toBe('MARKED_CONTACTED');
      expect(result.followUp.status).toBe('MARKED_CONTACTED');

      // Verify DB state
      const statuses = await getInterventionStatuses(schoolId, [record1Id]);
      expect(statuses[record1Id].status).toBe('MARKED_CONTACTED');
      expect(statuses[record1Id].label).toBe('Ditandai Sudah Dihubungi');

      // Verify Audit Log
      const [audit] = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.schoolId, schoolId),
            eq(auditLogs.entityId, record1Id),
            eq(auditLogs.action, 'MARKED_CONTACTED_MANUAL')
          )
        )
        .limit(1);

      expect(audit).toBeDefined();
    });

    it('does not downgrade MARKED_CONTACTED back to CLICKED if link clicked again', async () => {
      const result = await recordWhatsAppOpened(schoolId, record1Id, homeroomTeacherId);
      expect(result.status).toBe('MARKED_CONTACTED');

      const statuses = await getInterventionStatuses(schoolId, [record1Id]);
      expect(statuses[record1Id].status).toBe('MARKED_CONTACTED');
    });
  });
});
