import {
  StudentEWSResult,
  AIInsightResponse,
  AIActionableGuidance,
  AIOptions,
} from './types';
import {
  createSanitizedPayload,
  remapAIResponse,
  safeLogError,
  safeLogInfo,
} from './sanitizer';
import { buildAIPrompt } from './prompts';
import { getAIProvider } from './factory';
import { globalAILimiter } from './concurrency';

export const FALLBACK_EXECUTIVE_SUMMARY =
  'Ringkasan AI sementara tidak tersedia. Data statistik di bawah tetap valid dan akurat.';

export interface GenerateAIInsightParams {
  className: string;
  totalStudents: number;
  averageAttendanceRate: number;
  students: StudentEWSResult[];
  additionalIdentities?: Array<{
    studentId: string;
    phone?: string | null;
    guardianName?: string | null;
    guardianPhone?: string | null;
  }>;
  asOfDate?: string;
  options?: AIOptions;
  providerOverride?: string;
}

/**
 * Generate deterministic fallback guidance when AI service is unavailable
 */
export function generateDeterministicFallbackGuidance(
  students: StudentEWSResult[]
): AIActionableGuidance[] {
  const guidance: AIActionableGuidance[] = [];

  students
    .filter((s) => s.indicators.some((ind) => ind.triggered) || s.coldStartProtected)
    .forEach((s) => {
      const highestInd = s.indicators.find((ind) => ind.triggered && ind.severity === 'TINGGI')
        || s.indicators.find((ind) => ind.triggered && ind.severity === 'SEDANG')
        || s.indicators.find((ind) => ind.triggered);

      let recommendation = 'Lakukan pemantauan berkala terhadap presensi siswa.';
      let urgency = s.highestSeverity || 'RENDAH';

      if (highestInd) {
        recommendation = highestInd.suggestedAction;
      } else if (s.coldStartProtected) {
        recommendation = 'Lengkapi riwayat kehadiran minimal 14 hari aktif untuk analisis tren lengkap.';
      }

      guidance.push({
        pseudonym: s.name, // Local display name
        studentId: s.studentId,
        studentName: s.name,
        nis: s.nis,
        urgency: urgency,
        recommendation,
      });
    });

  return guidance;
}

/**
 * Main service function to generate AI narrative and recommendations with
 * privacy sanitization, concurrency throttling, and fail-safe fallback.
 */
export async function generateAIClassInsights(
  params: GenerateAIInsightParams
): Promise<AIInsightResponse> {
  const {
    className,
    totalStudents,
    averageAttendanceRate,
    students,
    additionalIdentities,
    asOfDate,
    options,
    providerOverride,
  } = params;

  // 1. Sanitize payload & create local reverse mapping
  const sanitizedPayload = createSanitizedPayload(students, additionalIdentities);

  // 2. Build prompt with strict guardrails & verify zero PII
  const promptResult = buildAIPrompt({
    className,
    totalStudents,
    averageAttendanceRate,
    sanitizedPayload,
    asOfDate,
  });

  if (!promptResult.isSafe) {
    safeLogError('PII detected in AI prompt! Falling back to deterministic guidance.', {
      violations: promptResult.violations,
    });
    return {
      executiveSummary: FALLBACK_EXECUTIVE_SUMMARY,
      actionableGuidance: generateDeterministicFallbackGuidance(students),
      generalRecommendations: [
        'Lakukan evaluasi berkala terhadap siswa dengan indikator presensi aktif.',
        'Jalin komunikasi suportif dengan orang tua atau wali murid.',
      ],
      providerUsed: 'fallback-deterministic-guard',
      generatedAt: new Date().toISOString(),
      isFallback: true,
      fallbackReason: `Deteksi PII pada payload: ${promptResult.violations.join(', ')}`,
    };
  }

  // 3. Obtain configured provider
  const provider = getAIProvider(
    providerOverride ? { provider: providerOverride as any } : undefined
  );

  // 4. Execute AI call within concurrency limiter & fail-safe wrapper
  try {
    safeLogInfo(`Requesting AI insight via ${provider.name} for class ${className}`);

    const rawResponseText = await globalAILimiter.execute(async () => {
      return await provider.generateText(promptResult.fullPromptText, {
        temperature: 0.2,
        maxTokens: 1500,
        timeoutMs: options?.timeoutMs || 15000,
        ...options,
      });
    });

    // 5. Parse JSON response
    let parsed: any;
    try {
      // Clean possible markdown code fence
      const cleaned = rawResponseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      safeLogError('Failed to parse AI response as JSON, falling back', parseErr);
      return {
        executiveSummary: FALLBACK_EXECUTIVE_SUMMARY,
        actionableGuidance: generateDeterministicFallbackGuidance(students),
        generalRecommendations: [
          'Tingkatkan keteraturan presensi dan komunikasi wali kelas.',
          'Gunakan tabel data numerik untuk pengambilan keputusan langsung.',
        ],
        providerUsed: provider.name,
        generatedAt: new Date().toISOString(),
        isFallback: true,
        fallbackReason: 'Format respons AI tidak valid',
      };
    }

    const aiResponse: AIInsightResponse = {
      executiveSummary: parsed.executiveSummary || FALLBACK_EXECUTIVE_SUMMARY,
      actionableGuidance: Array.isArray(parsed.actionableGuidance)
        ? parsed.actionableGuidance.map((item: any) => ({
            pseudonym: item.pseudonym || 'Siswa',
            urgency: item.urgency === 'TINGGI' || item.urgency === 'SEDANG' ? item.urgency : 'RENDAH',
            recommendation: String(item.recommendation || 'Lakukan pembinaan rutin.'),
          }))
        : [],
      generalRecommendations: Array.isArray(parsed.generalRecommendations)
        ? parsed.generalRecommendations.map((r: any) => String(r))
        : [
            'Lakukan evaluasi berkala terhadap siswa dengan indikator presensi aktif.',
            'Tingkatkan kolaborasi antara wali kelas dan guru bimbingan konseling.',
          ],
      providerUsed: provider.name,
      generatedAt: new Date().toISOString(),
      isFallback: false,
    };

    // 6. Remap pseudonyms back to real names for local display
    return remapAIResponse(aiResponse, sanitizedPayload.reverseMap);
  } catch (error: any) {
    safeLogError('AI provider execution failed, activating fail-safe fallback', error);

    return {
      executiveSummary: FALLBACK_EXECUTIVE_SUMMARY,
      actionableGuidance: generateDeterministicFallbackGuidance(students),
      generalRecommendations: [
        'Gunakan data tabel kehadiran di bawah untuk verifikasi langsung.',
        'Hubungi orang tua siswa dengan status Alpa beruntun hari ini.',
      ],
      providerUsed: `${provider.name} (Offline/Error)`,
      generatedAt: new Date().toISOString(),
      isFallback: true,
      fallbackReason: error?.message || 'Koneksi ke penyedia AI terputus atau timeout',
    };
  }
}
