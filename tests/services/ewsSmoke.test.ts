import { describe, it, expect, vi, afterEach } from 'vitest';
import { getAIProvider, setMockAIProvider } from '@/lib/ai/factory';
import {
  generateAIClassInsights,
  FALLBACK_EXECUTIVE_SUMMARY,
  generateDeterministicFallbackGuidance,
} from '@/lib/ai/service';
import { StudentEWSResult } from '@/lib/ai/types';

describe('EDUNOTIFY-05: Smoke Test - Provider Switching & UI Fallback State', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    setMockAIProvider(null);
  });

  const sampleStudents: StudentEWSResult[] = [
    {
      studentId: 'std-smoke-1',
      name: 'Dewi Lestari',
      nis: 'SMOKE01',
      gender: 'P',
      totalActiveDays: 10,
      coldStartProtected: true,
      coldStartMessage: 'Data historis belum mencukupi untuk analisis pola kehadiran (minimal 14 hari aktif)',
      hadirCount: 8,
      sakitCount: 0,
      izinCount: 0,
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
      lastCalculatedAt: new Date().toISOString(),
    },
  ];

  it('Smoke Test 1: Provider switching via AI_PROVIDER environment variable', () => {
    // 1. Switch to 9router
    process.env.AI_PROVIDER = '9router';
    process.env.AI_BASE_URL = 'http://127.0.0.1:20128/v1';
    process.env.AI_MODEL_NAME = '9router';
    const p1 = getAIProvider();
    expect(p1.providerType).toBe('9router');

    // 2. Switch to openai
    process.env.AI_PROVIDER = 'openai';
    process.env.AI_API_KEY = 'sk-mock-key-12345';
    process.env.AI_MODEL_NAME = 'gpt-4o-mini';
    const p2 = getAIProvider();
    expect(p2.providerType).toBe('openai');

    // 3. Switch to ollama
    process.env.AI_PROVIDER = 'ollama';
    process.env.AI_BASE_URL = 'http://localhost:11434';
    process.env.AI_MODEL_NAME = 'qwen2.5:7b';
    const p3 = getAIProvider();
    expect(p3.providerType).toBe('ollama');

    // 4. Switch to anthropic
    process.env.AI_PROVIDER = 'anthropic';
    process.env.AI_API_KEY = 'sk-ant-test-key';
    const p4 = getAIProvider();
    expect(p4.providerType).toBe('anthropic');
  });

  it('Smoke Test 2: Fallback fail-safe activation when AI provider offline', async () => {
    process.env.AI_PROVIDER = '9router';
    process.env.AI_BASE_URL = 'http://127.0.0.1:99999/v1'; // unreachable

    const insight = await generateAIClassInsights({
      className: 'X-RPL 1',
      totalStudents: 30,
      averageAttendanceRate: 85.0,
      students: sampleStudents,
      options: { timeoutMs: 500 }, // fast timeout
    });

    expect(insight.isFallback).toBe(true);
    expect(insight.executiveSummary).toBe(FALLBACK_EXECUTIVE_SUMMARY);
    expect(insight.executiveSummary).toBe(
      'Ringkasan AI sementara tidak tersedia. Data statistik di bawah tetap valid dan akurat.'
    );
    expect(insight.actionableGuidance.length).toBe(1);
    expect(insight.actionableGuidance[0].recommendation).toBe(
      'Hubungi ortu hari ini; jadwalkan konfirmasi langsung.'
    );
    expect(insight.actionableGuidance[0].studentName).toBe('Dewi Lestari');
  });

  it('Smoke Test 3: Fallback guidance generator produces non-punitive recommendations', () => {
    const guidance = generateDeterministicFallbackGuidance(sampleStudents);
    expect(guidance.length).toBe(1);
    expect(guidance[0].recommendation).toBe(
      'Hubungi ortu hari ini; jadwalkan konfirmasi langsung.'
    );
    expect(guidance[0].urgency).toBe('TINGGI');
  });
});
