import { db } from '@/db';
import {
  attendanceFollowUps,
  attendanceRecords,
  auditLogs,
  classes,
  students,
  schools,
  users,
} from '@/db/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';

export class WhatsAppValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WhatsAppValidationError';
  }
}

export type InterventionStatus = 'NOT_OPENED' | 'WHATSAPP_OPENED' | 'MARKED_CONTACTED';

export const INTERVENTION_STATUS_LABELS: Record<InterventionStatus, string> = {
  NOT_OPENED: 'Belum Dibuka',
  WHATSAPP_OPENED: 'WhatsApp Dibuka',
  MARKED_CONTACTED: 'Ditandai Sudah Dihubungi',
};

export interface WhatsAppMessageParams {
  studentName: string;
  className: string;
  schoolName: string;
  dateStr: string; // e.g. "2026-10-19" or formatted Indonesian date
  homeroomTeacherName: string;
}

export interface GenerateWhatsAppUrlParams extends WhatsAppMessageParams {
  guardianPhone: string;
}

/**
 * Sanitize raw phone number to Indonesian WhatsApp E.164 format (without +):
 * - Strips all non-digit characters
 * - Converts leading 08... to 628...
 * - Converts leading 0... to 62...
 * - Converts leading 8... to 628...
 * - Preserves already formatted 62...
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) {
    throw new WhatsAppValidationError('Nomor telepon tidak boleh kosong.');
  }

  // Remove non-digit characters
  let digits = phone.replace(/\D/g, '');

  if (!digits) {
    throw new WhatsAppValidationError('Nomor telepon tidak valid.');
  }

  // Convert 08... to 628...
  if (digits.startsWith('08')) {
    digits = '62' + digits.slice(1);
  } else if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  } else if (digits.startsWith('8')) {
    digits = '62' + digits;
  }

  if (digits.length < 8) {
    throw new WhatsAppValidationError('Nomor telepon terlalu pendek.');
  }

  return digits;
}

/**
 * Format date string 'YYYY-MM-DD' into standard Indonesian date format:
 * e.g. "2026-10-19" -> "Senin, 19 Oktober 2026"
 */
export function formatIndonesianDate(dateInput: string | Date): string {
  if (!dateInput) return '';

  let d: Date;
  if (typeof dateInput === 'string') {
    // If it's already a formatted string like "Senin, 19 Oktober 2026", return it
    if (dateInput.includes(',') || dateInput.includes(' ')) {
      return dateInput;
    }
    const [year, month, day] = dateInput.split('-').map(Number);
    if (!year || !month || !day) return dateInput;
    d = new Date(Date.UTC(year, month - 1, day));
  } else {
    d = dateInput;
  }

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const dayName = days[d.getUTCDay()];
  const dayNum = d.getUTCDate();
  const monthName = months[d.getUTCMonth()];
  const yearNum = d.getUTCFullYear();

  return `${dayName}, ${dayNum} ${monthName} ${yearNum}`;
}

/**
 * Format official WhatsApp message template as defined in PRD Bab 5.2:
 *
 * Yth. Orang Tua / Wali dari {nama_siswa} ({kelas}),
 * Kami dari {nama_sekolah} menginformasikan bahwa pada hari ini, {hari_tanggal}, ananda tercatat TIDAK HADIR di sekolah tanpa keterangan (Alpa).
 *
 * Mohon konfirmasi mengenai kondisi ananda melalui balasan pesan ini.
 * Terima kasih atas perhatian dan kerja samanya.
 *
 * Salam,
 * {nama_wali_kelas}
 * Wali Kelas {kelas}
 */
export function formatWhatsAppMessage(params: WhatsAppMessageParams): string {
  const formattedDate = formatIndonesianDate(params.dateStr);

  return (
    `Yth. Orang Tua / Wali dari ${params.studentName} (${params.className}),\n` +
    `Kami dari ${params.schoolName} menginformasikan bahwa pada hari ini, ${formattedDate}, ananda tercatat TIDAK HADIR di sekolah tanpa keterangan (Alpa).\n\n` +
    `Mohon konfirmasi mengenai kondisi ananda melalui balasan pesan ini.\n` +
    `Terima kasih atas perhatian dan kerja samanya.\n\n` +
    `Salam,\n` +
    `${params.homeroomTeacherName}\n` +
    `Wali Kelas ${params.className}`
  );
}

/**
 * Generate full wa.me Click-to-Chat URL:
 * https://wa.me/{phone}?text={encoded_message}
 */
export function generateWhatsAppUrl(params: GenerateWhatsAppUrlParams): string {
  const sanitizedPhone = sanitizePhoneNumber(params.guardianPhone);
  const message = formatWhatsAppMessage({
    studentName: params.studentName,
    className: params.className,
    schoolName: params.schoolName,
    dateStr: params.dateStr,
    homeroomTeacherName: params.homeroomTeacherName,
  });

  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${sanitizedPhone}?text=${encodedText}`;
}

/**
 * Record that the WhatsApp link was opened ('CLICKED').
 * Changes status to 'WHATSAPP_OPENED' ('WhatsApp Dibuka').
 * Also writes to audit log.
 */
export async function recordWhatsAppOpened(
  schoolId: string,
  attendanceRecordId: string,
  userId: string
) {
  // Check if attendance record exists
  const [record] = await db
    .select({
      id: attendanceRecords.id,
      schoolId: attendanceRecords.schoolId,
      studentId: attendanceRecords.studentId,
    })
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.id, attendanceRecordId),
        eq(attendanceRecords.schoolId, schoolId)
      )
    )
    .limit(1);

  if (!record) {
    throw new WhatsAppValidationError('Data presensi siswa tidak ditemukan.');
  }

  // Check if follow up already exists
  const existingFollowUps = await db
    .select()
    .from(attendanceFollowUps)
    .where(
      and(
        eq(attendanceFollowUps.schoolId, schoolId),
        eq(attendanceFollowUps.attendanceRecordId, attendanceRecordId)
      )
    )
    .orderBy(desc(attendanceFollowUps.createdAt))
    .limit(1);

  let followUp;

  if (existingFollowUps.length > 0) {
    const current = existingFollowUps[0];
    // If already MARKED_CONTACTED, do not downgrade to CLICKED
    if (current.status === 'MARKED_CONTACTED') {
      followUp = current;
    } else {
      const [updated] = await db
        .update(attendanceFollowUps)
        .set({
          status: 'CLICKED',
          userId,
        })
        .where(eq(attendanceFollowUps.id, current.id))
        .returning();
      followUp = updated;
    }
  } else {
    const [inserted] = await db
      .insert(attendanceFollowUps)
      .values({
        schoolId,
        attendanceRecordId,
        userId,
        channel: 'WHATSAPP',
        status: 'CLICKED',
        notes: 'Tautan WhatsApp Click-to-Chat dibuka.',
      })
      .returning();
    followUp = inserted;
  }

  // Audit log
  await db.insert(auditLogs).values({
    schoolId,
    userId,
    action: 'WHATSAPP_LINK_OPENED',
    entityType: 'attendance_record',
    entityId: attendanceRecordId,
    detailsJson: JSON.stringify({
      channel: 'WHATSAPP',
      status: followUp.status,
      timestamp: new Date().toISOString(),
    }),
  });

  return {
    followUp,
    status: (followUp.status === 'MARKED_CONTACTED'
      ? 'MARKED_CONTACTED'
      : 'WHATSAPP_OPENED') as InterventionStatus,
  };
}

/**
 * Manually mark student follow-up as contacted ('MARKED_CONTACTED').
 * Changes status to 'Ditandai Sudah Dihubungi'.
 * Also writes to audit log.
 */
export async function markAsContacted(
  schoolId: string,
  attendanceRecordId: string,
  userId: string,
  notes?: string
) {
  // Check if attendance record exists
  const [record] = await db
    .select({
      id: attendanceRecords.id,
      schoolId: attendanceRecords.schoolId,
      studentId: attendanceRecords.studentId,
    })
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.id, attendanceRecordId),
        eq(attendanceRecords.schoolId, schoolId)
      )
    )
    .limit(1);

  if (!record) {
    throw new WhatsAppValidationError('Data presensi siswa tidak ditemukan.');
  }

  // Check if follow-up exists
  const existingFollowUps = await db
    .select()
    .from(attendanceFollowUps)
    .where(
      and(
        eq(attendanceFollowUps.schoolId, schoolId),
        eq(attendanceFollowUps.attendanceRecordId, attendanceRecordId)
      )
    )
    .orderBy(desc(attendanceFollowUps.createdAt))
    .limit(1);

  let followUp;

  if (existingFollowUps.length > 0) {
    const [updated] = await db
      .update(attendanceFollowUps)
      .set({
        status: 'MARKED_CONTACTED',
        userId,
        notes: notes || 'Ditandai sudah dihubungi secara manual oleh Wali Kelas.',
      })
      .where(eq(attendanceFollowUps.id, existingFollowUps[0].id))
      .returning();
    followUp = updated;
  } else {
    const [inserted] = await db
      .insert(attendanceFollowUps)
      .values({
        schoolId,
        attendanceRecordId,
        userId,
        channel: 'WHATSAPP',
        status: 'MARKED_CONTACTED',
        notes: notes || 'Ditandai sudah dihubungi secara manual oleh Wali Kelas.',
      })
      .returning();
    followUp = inserted;
  }

  // Audit log
  await db.insert(auditLogs).values({
    schoolId,
    userId,
    action: 'MARKED_CONTACTED_MANUAL',
    entityType: 'attendance_record',
    entityId: attendanceRecordId,
    detailsJson: JSON.stringify({
      channel: 'WHATSAPP',
      status: 'MARKED_CONTACTED',
      notes: followUp.notes,
      timestamp: new Date().toISOString(),
    }),
  });

  return {
    followUp,
    status: 'MARKED_CONTACTED' as InterventionStatus,
  };
}

/**
 * Get intervention follow-up statuses for a batch of attendance record IDs.
 */
export async function getInterventionStatuses(
  schoolId: string,
  attendanceRecordIds: string[]
): Promise<Record<string, { status: InterventionStatus; label: string; updatedAt?: Date }>> {
  const result: Record<
    string,
    { status: InterventionStatus; label: string; updatedAt?: Date }
  > = {};

  // Default all to NOT_OPENED
  for (const id of attendanceRecordIds) {
    result[id] = {
      status: 'NOT_OPENED',
      label: INTERVENTION_STATUS_LABELS.NOT_OPENED,
    };
  }

  if (attendanceRecordIds.length === 0) {
    return result;
  }

  const followUps = await db
    .select()
    .from(attendanceFollowUps)
    .where(
      and(
        eq(attendanceFollowUps.schoolId, schoolId),
        inArray(attendanceFollowUps.attendanceRecordId, attendanceRecordIds)
      )
    );

  for (const fu of followUps) {
    const mappedStatus: InterventionStatus =
      fu.status === 'MARKED_CONTACTED'
        ? 'MARKED_CONTACTED'
        : fu.status === 'CLICKED'
        ? 'WHATSAPP_OPENED'
        : 'NOT_OPENED';

    result[fu.attendanceRecordId] = {
      status: mappedStatus,
      label: INTERVENTION_STATUS_LABELS[mappedStatus],
      updatedAt: fu.createdAt,
    };
  }

  return result;
}
