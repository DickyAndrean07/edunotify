import { SanitizedPayloadResult, SanitizedStudentItem } from './types';
import { assertNoPII } from './sanitizer';

export const AI_SYSTEM_PROMPT = `Anda adalah asisten AI analitik pendidikan untuk platform EduNotify di sekolah Indonesia.
Tugas Anda adalah membaca data statistik kehadiran siswa dan indikator Early Warning System (EWS) yang telah dihitung 100% secara deterministik oleh sistem, kemudian menyusun ringkasan naratif eksekutif dan rekomendasi tindak lanjut pembinaan.

PEDOMAN UTAMA:
1. Gaya bahasa: Bahasa Indonesia baku, formal, objektif, empatik, dan berorientasi solusi pendidikan.
2. Prinsip pembinaan: Bersifat suportif dan restoratif, bertujuan merangkul siswa dan keluarga untuk mengidentifikasi kendala ketidakhadiran secara konstruktif.

LARANGAN KERAS (STRICT SAFETY GUARDRAILS - WAJIB DIPATUHI):
1. DILARANG KERAS mendiagnosis kondisi medis, gangguan mental, psikologis, atau psikiatris siswa.
2. DILARANG KERAS memberikan label negatif, stigma, atau merendahkan karakter siswa (misalnya menyebut "pemalas", "bermasalah", "nakal", "bebal", "pemberontak", "kurang ajar", atau istilah peyoratif lainnya).
3. DILARANG KERAS merekomendasikan sanksi fisik, pengeluaran sepihak, skorsing sepihak tanpa pembinaan, atau hukuman punitif.
4. Jangan pernah mengarang data presensi di luar angka statistik dan indikator deterministik yang diberikan.

FORMAT OUTPUT WAJIB:
Berikan respons dalam format JSON murni (valid JSON object) tanpa membungkus teks penjelasan di luar JSON. Format struktur:
{
  "executiveSummary": "2-3 kalimat ringkasan tingkat kehadiran kelas, tren umum, dan anomali utama yang perlu perhatian secara objektif dan empatik.",
  "actionableGuidance": [
    {
      "pseudonym": "Siswa_1",
      "urgency": "TINGGI" | "SEDANG" | "RENDAH",
      "recommendation": "1-2 kalimat langkah konkret yang disarankan untuk wali kelas/guru BK (misal: diskusi suportif empat mata, koordinasi guru BK, atau konfirmasi santun ke orang tua)."
    }
  ],
  "generalRecommendations": [
    "Poin rekomendasi manajerial tingkat kelas/sekolah 1",
    "Poin rekomendasi manajerial tingkat kelas/sekolah 2"
  ]
}`;

export interface BuildPromptParams {
  className: string;
  totalStudents: number;
  averageAttendanceRate: number;
  sanitizedPayload: SanitizedPayloadResult;
  asOfDate?: string;
}

export interface PromptBuildResult {
  systemPrompt: string;
  userPrompt: string;
  fullPromptText: string;
  isSafe: boolean;
  violations: string[];
}

/**
 * Builds the user prompt using only sanitized, anonymized student payloads.
 * Runs zero-PII assertion against all forbidden terms.
 */
export function buildAIPrompt(params: BuildPromptParams): PromptBuildResult {
  const {
    className,
    totalStudents,
    averageAttendanceRate,
    sanitizedPayload,
    asOfDate,
  } = params;

  const dateStr = asOfDate || new Date().toISOString().split('T')[0];
  const { sanitizedStudents, forbiddenTerms } = sanitizedPayload;

  // Filter students who have at least one triggered indicator or cold-start flag
  const studentsAtRisk = sanitizedStudents.filter(
    (s) => s.triggeredIndicators.length > 0 || s.coldStartProtected
  );

  const studentsJson = JSON.stringify(
    studentsAtRisk.map((s) => ({
      pseudonym: s.pseudonym,
      gender: s.gender,
      totalActiveDays: s.totalActiveDays,
      hadir: s.hadirCount,
      sakit: s.sakitCount,
      izin: s.izinCount,
      alpa: s.alpaCount,
      persentaseKehadiran: `${s.attendanceRate.toFixed(1)}%`,
      indikatorEWS: s.triggeredIndicators.map((ind) => ({
        kode: ind.code,
        tingkat: ind.severity,
        nilai: `${ind.value} ${ind.unit}`,
        deskripsi: ind.description,
      })),
      polaHari: s.dayPattern || null,
      proteksiColdStart: s.coldStartProtected
        ? 'Data historis < 14 hari aktif (alert pola/tren ditahan)'
        : 'Cukup data (>= 14 hari)',
    })),
    null,
    2
  );

  const userPrompt = `Berikut adalah data agregat presensi kelas untuk dianalisis:

Informasi Kelas:
- Kelas: ${className}
- Tanggal Analisis: ${dateStr}
- Total Siswa: ${totalStudents} orang
- Rata-rata Kehadiran Kelas: ${averageAttendanceRate.toFixed(1)}%
- Jumlah Siswa Terdeteksi Indikator EWS / Butuh Perhatian: ${studentsAtRisk.length} siswa

Data Siswa Berisiko (Telah Dianonimkan / Disanitasi):
${studentsJson}

Instruksi Khusus:
1. Evaluasi ringkas tren kehadiran kelas (Executive Summary 2-3 kalimat).
2. Berikan rekomendasi pembinaan spesifik per siswa (gunakan nama samaran persis seperti "Siswa_1", "Siswa_2", dst).
3. Pastikan mematuhi seluruh batasan etika: larangan diagnosis medis/mental, larangan pelabelan negatif, dan larangan sanksi punitif.
4. Kembalikan HANYA format JSON sesuai spesifikasi.`;

  const fullPromptText = `${AI_SYSTEM_PROMPT}\n\n${userPrompt}`;

  // Assert zero PII
  const piiCheck = assertNoPII(fullPromptText, forbiddenTerms);

  return {
    systemPrompt: AI_SYSTEM_PROMPT,
    userPrompt,
    fullPromptText,
    isSafe: piiCheck.safe,
    violations: piiCheck.violations,
  };
}
