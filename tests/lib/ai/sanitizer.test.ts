import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createSanitizedPayload,
  assertNoPII,
  scrubPII,
  maskApiKey,
  remapAIResponse,
} from '@/lib/ai/sanitizer';
import { buildAIPrompt, AI_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { ConcurrencyLimiter } from '@/lib/ai/concurrency';
import { getAIProvider, setMockAIProvider } from '@/lib/ai/factory';
import {
  generateAIClassInsights,
  FALLBACK_EXECUTIVE_SUMMARY,
  generateDeterministicFallbackGuidance,
} from '@/lib/ai/service';
import {
  StudentEWSResult,
  AICompletionProvider,
  AIInsightResponse,
} from '@/lib/ai/types';

describe('EDUNOTIFY-05: AI Service, Privacy Sanitizer & Provider Agnostic', () => {
  const mockStudents: StudentEWSResult[] = [
    {
      studentId: 'uuid-std-001',
      name: 'Muhammad Rizky Pratama',
      nis: '20261001',
      gender: 'L',
      totalActiveDays: 20,
      coldStartProtected: false,
      hadirCount: 16,
      sakitCount: 1,
      izinCount: 1,
      alpaCount: 2,
      attendanceRate: 80.0,
      highestSeverity: 'TINGGI',
      indicators: [
        {
          code: 'EWS_ALPA_STREAK',
          name: 'Alpa Beruntun',
          severity: 'TINGGI',
          triggered: true,
          minDataDays: 2,
          value: 2,
          threshold: 2,
          unit: 'hari',
          description: 'Alpa 2 hari beruntun',
          suggestedAction: 'Hubungi ortu hari ini; jadwalkan konfirmasi langsung.',
        },
      ],
      triggeredCount: 1,
      lastCalculatedAt: '2026-10-22T00:00:00Z',
    },
    {
      studentId: 'uuid-std-002',
      name: 'Siti Nurhaliza',
      nis: '20261002',
      gender: 'P',
      totalActiveDays: 22,
      coldStartProtected: false,
      hadirCount: 17,
      sakitCount: 0,
      izinCount: 1,
      alpaCount: 4,
      attendanceRate: 77.3,
      highestSeverity: 'SEDANG',
      indicators: [
        {
          code: 'EWS_ALPA_MONTHLY',
          name: 'Akumulasi Alpa Bulanan',
          severity: 'SEDANG',
          triggered: true,
          minDataDays: 14,
          value: 4,
          threshold: 3,
          unit: 'hari',
          description: 'Alpa 4 hari dalam 30 hari',
          suggestedAction: 'Diskusi empat mata dengan siswa; catat kendala.',
        },
      ],
      triggeredCount: 1,
      lastCalculatedAt: '2026-10-22T00:00:00Z',
    },
  ];

  const mockIdentities = [
    {
      studentId: 'uuid-std-001',
      phone: '081234567890',
      guardianName: 'Bambang Pratama',
      guardianPhone: '081298765432',
    },
    {
      studentId: 'uuid-std-002',
      phone: '082199887766',
      guardianName: 'Aisyah',
      guardianPhone: '085711223344',
    },
  ];

  // ========================================================
  // 1. DATA MINIMIZATION & PSEUDONYMIZATION
  // ========================================================

  describe('1. Sanitasi Data PII & Pseudonimisasi', () => {
    it('menghapus seluruh PII asli dan menggantinya dengan nama samaran Siswa_1, Siswa_2', () => {
      const { sanitizedStudents, reverseMap, forbiddenTerms } =
        createSanitizedPayload(mockStudents, mockIdentities);

      expect(sanitizedStudents.length).toBe(2);
      expect(sanitizedStudents[0].pseudonym).toBe('Siswa_1');
      expect(sanitizedStudents[1].pseudonym).toBe('Siswa_2');

      // Check that sanitized object does not contain PII fields
      expect((sanitizedStudents[0] as any).name).toBeUndefined();
      expect((sanitizedStudents[0] as any).nis).toBeUndefined();
      expect((sanitizedStudents[0] as any).phone).toBeUndefined();
      expect((sanitizedStudents[0] as any).guardianName).toBeUndefined();

      // Check reverse map exists for local re-identification
      const mapItem1 = reverseMap.get('Siswa_1');
      expect(mapItem1?.realName).toBe('Muhammad Rizky Pratama');
      expect(mapItem1?.nis).toBe('20261001');

      // Check forbidden terms collection
      expect(forbiddenTerms).toContain('Muhammad Rizky Pratama');
      expect(forbiddenTerms).toContain('20261001');
      expect(forbiddenTerms).toContain('081234567890');
    });

    it('memastikan prompt AI tidak mengandung nama asli, NIS, atau nomor telepon (Zero-PII Assertion)', () => {
      const sanitizedPayload = createSanitizedPayload(mockStudents, mockIdentities);

      const promptResult = buildAIPrompt({
        className: 'X-IPA 1',
        totalStudents: 30,
        averageAttendanceRate: 88.5,
        sanitizedPayload,
      });

      expect(promptResult.isSafe).toBe(true);
      expect(promptResult.violations.length).toBe(0);

      // Verify prompt text explicitly does NOT contain real names or NIS
      expect(promptResult.fullPromptText).not.toContain('Muhammad Rizky Pratama');
      expect(promptResult.fullPromptText).not.toContain('Siti Nurhaliza');
      expect(promptResult.fullPromptText).not.toContain('20261001');
      expect(promptResult.fullPromptText).not.toContain('081234567890');

      // But contains pseudonyms
      expect(promptResult.fullPromptText).toContain('Siswa_1');
      expect(promptResult.fullPromptText).toContain('Siswa_2');
    });

    it('mendeteksi pelanggaran jika PII bocor ke dalam prompt', () => {
      const leakText = 'Laporan siswa Muhammad Rizky Pratama dengan NIS 20261001 telp 081234567890';
      const check = assertNoPII(leakText, ['Muhammad Rizky Pratama', '20261001']);

      expect(check.safe).toBe(false);
      expect(check.violations.length).toBeGreaterThanOrEqual(2);
    });

    it('meredaksi nomor telepon dan nama sensitif dengan scrubPII', () => {
      const text = 'Hubungi 081234567890 atau email guru@sekolah.sch.id mengenai Budi.';
      const scrubbed = scrubPII(text, ['Budi']);

      expect(scrubbed).not.toContain('081234567890');
      expect(scrubbed).not.toContain('guru@sekolah.sch.id');
      expect(scrubbed).not.toContain('Budi');
      expect(scrubbed).toContain('[NO_TELP_TERDAFTAR_DIREDAKSI]');
      expect(scrubbed).toContain('[EMAIL_DIREDAKSI]');
    });

    it('memetakan kembali nama samaran Siswa_1 ke identitas asli saat render UI', () => {
      const { reverseMap } = createSanitizedPayload(mockStudents, mockIdentities);

      const mockAIResponse: AIInsightResponse = {
        executiveSummary: 'Terdapat anomali pada beberapa siswa.',
        actionableGuidance: [
          {
            pseudonym: 'Siswa_1',
            urgency: 'TINGGI',
            recommendation: 'Lakukan konfirmasi ke keluarga hari ini.',
          },
        ],
        generalRecommendations: ['Tingkatkan pemantauan.'],
        providerUsed: '9router',
        generatedAt: '2026-10-22T00:00:00Z',
        isFallback: false,
      };

      const remapped = remapAIResponse(mockAIResponse, reverseMap);
      expect(remapped.actionableGuidance[0].studentName).toBe('Muhammad Rizky Pratama');
      expect(remapped.actionableGuidance[0].nis).toBe('20261001');
      expect(remapped.actionableGuidance[0].studentId).toBe('uuid-std-001');
    });
  });

  // ========================================================
  // 2. PROMPT GUARDRAILS & NON-PUNITIVE COMPLIANCE
  // ========================================================

  describe('2. Prompt AI & Guardrail Larangan Diagnosis/Label Negatif', () => {
    it('memuat larangan keras mendiagnosis kondisi medis/mental', () => {
      expect(AI_SYSTEM_PROMPT).toContain(
        'DILARANG KERAS mendiagnosis kondisi medis, gangguan mental, psikologis, atau psikiatris siswa'
      );
    });

    it('memuat larangan keras memberi label negatif kepada siswa', () => {
      expect(AI_SYSTEM_PROMPT).toContain(
        'DILARANG KERAS memberikan label negatif, stigma, atau merendahkan karakter siswa'
      );
      expect(AI_SYSTEM_PROMPT).toContain('pemalas');
      expect(AI_SYSTEM_PROMPT).toContain('bermasalah');
      expect(AI_SYSTEM_PROMPT).toContain('nakal');
    });

    it('memuat larangan merekomendasikan sanksi fisik atau skorsing sepihak', () => {
      expect(AI_SYSTEM_PROMPT).toContain(
        'DILARANG KERAS merekomendasikan sanksi fisik, pengeluaran sepihak, skorsing sepihak tanpa pembinaan'
      );
    });
  });

  // ========================================================
  // 3. API KEY MASKING & SECURITY CONSTRAINTS
  // ========================================================

  describe('3. Masking API Key & Keamanan Log', () => {
    it('menyamarkan sk- API key agar tidak bocor ke log aplikasi', () => {
      expect(maskApiKey('sk-proj-1234567890abcdef')).toBe('sk-***cdef');
      expect(maskApiKey('sk-ant-api03-abcdef1234567890xyz')).toBe('sk-***0xyz');
      expect(maskApiKey('short')).toBe('***');
      expect(maskApiKey('')).toBe('');
      expect(maskApiKey(null)).toBe('');
    });
  });

  // ========================================================
  // 4. CONCURRENCY LIMITER (MAX 1-2 CONCURRENT REQUESTS)
  // ========================================================

  describe('4. Concurrency Limiter Queue', () => {
    it('membatasi konkurensi maksimal sesuai konfigurasi dan mengeksekusi antrean secara bergantian', async () => {
      const limiter = new ConcurrencyLimiter(2);
      let running = 0;
      let maxSeenRunning = 0;

      const task = async (duration: number) => {
        return limiter.execute(async () => {
          running++;
          maxSeenRunning = Math.max(maxSeenRunning, running);
          await new Promise((r) => setTimeout(r, duration));
          running--;
          return true;
        });
      };

      // Launch 5 tasks concurrently
      const promises = [
        task(40),
        task(40),
        task(40),
        task(40),
        task(40),
      ];

      await Promise.all(promises);

      expect(maxSeenRunning).toBeLessThanOrEqual(2);
      expect(limiter.activeCount).toBe(0);
      expect(limiter.pendingCount).toBe(0);
    });
  });

  // ========================================================
  // 5. PROVIDER-AGNOSTIC ADAPTERS & FACTORY
  // ========================================================

  describe('5. Provider-Agnostic Adapter Switching via .env', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
      setMockAIProvider(null);
    });

    it('membuat NineRouterAdapter secara default atau ketika AI_PROVIDER=9router', () => {
      process.env.AI_PROVIDER = '9router';
      const provider = getAIProvider();
      expect(provider.providerType).toBe('9router');
      expect(provider.name).toContain('9Router');
    });

    it('membuat OpenAIAdapter ketika AI_PROVIDER=openai', () => {
      process.env.AI_PROVIDER = 'openai';
      const provider = getAIProvider();
      expect(provider.providerType).toBe('openai');
      expect(provider.name).toContain('OpenAI');
    });

    it('membuat OllamaAdapter ketika AI_PROVIDER=ollama', () => {
      process.env.AI_PROVIDER = 'ollama';
      const provider = getAIProvider();
      expect(provider.providerType).toBe('ollama');
      expect(provider.name).toContain('Ollama');
    });

    it('membuat AnthropicAdapter ketika AI_PROVIDER=anthropic', () => {
      process.env.AI_PROVIDER = 'anthropic';
      const provider = getAIProvider();
      expect(provider.providerType).toBe('anthropic');
      expect(provider.name).toContain('Anthropic');
    });
  });

  // ========================================================
  // 6. FAIL-SAFE FALLBACK & OFFLINE RESILIENCE
  // ========================================================

  describe('6. Fail-Safe Fallback Saat AI Error/Offline (PRD 9.5 & DoD 6)', () => {
    afterEach(() => {
      setMockAIProvider(null);
    });

    it('mengembalikan pesan fallback ramah dan rekomendasi deterministik jika provider AI timeout / error', async () => {
      // Mock provider that throws error
      const mockFailingProvider: AICompletionProvider = {
        name: 'Mock Offline Provider',
        providerType: '9router',
        generateText: vi.fn().mockRejectedValue(new Error('Connection refused at port 20128')),
        healthCheck: vi.fn().mockResolvedValue(false),
      };

      setMockAIProvider(mockFailingProvider);

      const result = await generateAIClassInsights({
        className: 'XI-MIPA 1',
        totalStudents: 32,
        averageAttendanceRate: 82.5,
        students: mockStudents,
      });

      // Verify Fail-Safe fallback
      expect(result.isFallback).toBe(true);
      expect(result.executiveSummary).toBe(FALLBACK_EXECUTIVE_SUMMARY);
      expect(result.executiveSummary).toBe(
        'Ringkasan AI sementara tidak tersedia. Data statistik di bawah tetap valid dan akurat.'
      );

      // Verify deterministic recommendations are still generated without crash
      expect(result.actionableGuidance.length).toBe(2);
      expect(result.actionableGuidance[0].recommendation).toContain('Hubungi ortu hari ini');
      expect(result.actionableGuidance[1].recommendation).toContain('Diskusi empat mata');
    });

    it('menghasilkan insight sukses dan memetakan nama siswa saat provider AI berjalan normal', async () => {
      const mockSuccessProvider: AICompletionProvider = {
        name: 'Mock Working 9Router',
        providerType: '9router',
        generateText: vi.fn().mockResolvedValue(
          JSON.stringify({
            executiveSummary: 'Tingkat kehadiran kelas stabil dengan sedikit anomali Alpa beruntun.',
            actionableGuidance: [
              {
                pseudonym: 'Siswa_1',
                urgency: 'TINGGI',
                recommendation: 'Ajak diskusi empat mata dengan ramah.',
              },
            ],
            generalRecommendations: ['Koordinasi mingguan wali kelas.'],
          })
        ),
        healthCheck: vi.fn().mockResolvedValue(true),
      };

      setMockAIProvider(mockSuccessProvider);

      const result = await generateAIClassInsights({
        className: 'XI-MIPA 1',
        totalStudents: 32,
        averageAttendanceRate: 82.5,
        students: mockStudents,
      });

      expect(result.isFallback).toBe(false);
      expect(result.executiveSummary).toContain('Tingkat kehadiran kelas stabil');
      // The pseudonym Siswa_1 must be re-mapped to Muhammad Rizky Pratama
      expect(result.actionableGuidance[0].studentName).toBe('Muhammad Rizky Pratama');
      expect(result.actionableGuidance[0].recommendation).toBe('Ajak diskusi empat mata dengan ramah.');
    });
  });
});
