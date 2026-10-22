import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getSchoolAttendanceSummary } from '@/services/reportService';
import { getAIProvider } from '@/lib/ai/factory';
import { safeLogError } from '@/lib/ai/sanitizer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (
      !session ||
      (session.role !== 'KEPALA_SEKOLAH' && session.role !== 'ADMIN_SEKOLAH')
    ) {
      return NextResponse.json(
        { error: 'Unauthorized: Hanya Kepala Sekolah atau Admin yang berhak mengakses ringkasan AI.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const startDate = body.startDate || thirtyDaysAgo;
    const endDate = body.endDate || today;

    const summary = await getSchoolAttendanceSummary(session.schoolId, {
      startDate,
      endDate,
    });

    const fallbackResponse = {
      executiveSummary: `Tingkat kehadiran sekolah periode ${startDate} s/d ${endDate} berada pada level ${summary.overallStats.overallAttendanceRate.toFixed(
        1
      )}% dari total ${summary.overallStats.totalEnrolledStudents} siswa aktif. Dari total ${
        summary.overallStats.totalRecords
      } rekaman presensi, tercatat ${summary.overallStats.totalHadir} kehadiran, ${
        summary.overallStats.totalSakit
      } sakit, ${summary.overallStats.totalIzin} izin, dan ${
        summary.overallStats.totalAlpa
      } alpa.`,
      generalRecommendations: [
        'Lakukan pemantauan dan pendampingan terarah pada rombongan belajar dengan tingkat ketidakhadiran tertinggi.',
        'Dorong wali kelas untuk segera menindaklanjuti ketidakhadiran tanpa keterangan pada hari yang sama.',
        'Beri apresiasi kepada kelas dengan performa kehadiran tertinggi untuk menjaga motivasi peserta didik.',
      ],
      isFallback: true,
      providerUsed: 'deterministic-fallback',
      generatedAt: new Date().toISOString(),
    };

    try {
      const provider = getAIProvider();

      // Zero-PII Prompt: Strictly aggregate metrics without individual student names
      const prompt = `Anda adalah asisten AI analitik pendidikan untuk Kepala Sekolah pada platform EduNotify.
Berdasarkan data statistik agregat kehadiran berikut, buatlah ringkasan eksekutif dan rekomendasi manajerial.

DATA AGREGAT SEKOLAH:
- Periode: ${startDate} s/d ${endDate}
- Rata-rata Kehadiran Sekolah: ${summary.overallStats.overallAttendanceRate.toFixed(1)}%
- Total Siswa Terdaftar: ${summary.overallStats.totalEnrolledStudents} siswa
- Total Presensi Tercatat: ${summary.overallStats.totalRecords}
- Rincian: Hadir: ${summary.overallStats.totalHadir}, Sakit: ${summary.overallStats.totalSakit}, Izin: ${summary.overallStats.totalIzin}, Alpa: ${summary.overallStats.totalAlpa}
- Performa Kelas:
${summary.classComparisons
  .map(
    (c) =>
      `  * Kelas ${c.className}: ${c.attendanceRate.toFixed(1)}% (Alpa: ${c.alpaCount}, Siswa EWS: ${c.atRiskStudentsCount})`
  )
  .join('\n')}

PEDOMAN:
1. Bahasa Indonesia formal, objektif, empatik, berorientasi solusi pendidikan.
2. Dilarang mendiagnosis gangguan medis/mental.
3. Dilarang memberi label peyoratif ("nakal", "pemalas", dsb).
4. Dilarang merekomendasikan hukuman fisik atau sanksi sepihak.

FORMAT OUTPUT WAJIB JSON:
{
  "executiveSummary": "2-3 kalimat ringkasan tingkat kehadiran dan tren sekolah secara komprehensif.",
  "generalRecommendations": [
    "Poin rekomendasi manajerial 1",
    "Poin rekomendasi manajerial 2",
    "Poin rekomendasi manajerial 3"
  ]
}`;

      const aiResponseText = await provider.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 500,
      });

      // Parse JSON from AI response
      const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          executiveSummary: parsed.executiveSummary || fallbackResponse.executiveSummary,
          generalRecommendations:
            parsed.generalRecommendations || fallbackResponse.generalRecommendations,
          isFallback: false,
          providerUsed: 'ai-provider',
          generatedAt: new Date().toISOString(),
        });
      }

      return NextResponse.json(fallbackResponse);
    } catch (aiErr: unknown) {
      safeLogError('AI Summary generation failed, using fallback:', {
        message: aiErr instanceof Error ? aiErr.message : String(aiErr),
      });
      return NextResponse.json(fallbackResponse);
    }
  } catch (err: unknown) {
    console.error('AI summary error:', err);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses ringkasan AI.' },
      { status: 500 }
    );
  }
}
