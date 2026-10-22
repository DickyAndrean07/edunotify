import {
  StudentEWSResult,
  StudentIdentityMap,
  SanitizedStudentItem,
  SanitizedPayloadResult,
  AIInsightResponse,
  EWSCategory,
} from './types';

/**
 * Mask an API key for safe logging (e.g. "sk-proj-1234567890abcdef" -> "sk-***cdef")
 */
export function maskApiKey(key?: string | null): string {
  if (!key) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) {
    return '***';
  }
  const prefix = trimmed.startsWith('sk-') ? 'sk-***' : trimmed.substring(0, 3) + '***';
  const suffix = trimmed.substring(trimmed.length - 4);
  return `${prefix}${suffix}`;
}

/**
 * Regex patterns for standard PII (Indonesian phone numbers, emails, NIS patterns)
 */
const PHONE_REGEX = /(\+?62|08)[0-9]{8,13}/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/**
 * Build sanitized payload & pseudonym reverse mapping from raw student EWS records.
 * Strips: Real Name, NIS, NISN, Phone, Guardian Phone/Name, Freeform Notes.
 * Leaves ONLY: Pseudonym ("Siswa_1"), Gender, Numerics, EWS codes, Day of week.
 */
export function createSanitizedPayload(
  students: StudentEWSResult[],
  additionalIdentities?: Array<{
    studentId: string;
    phone?: string | null;
    guardianName?: string | null;
    guardianPhone?: string | null;
  }>
): SanitizedPayloadResult {
  const sanitizedStudents: SanitizedStudentItem[] = [];
  const reverseMap = new Map<string, StudentIdentityMap>();
  const forbiddenTermsSet = new Set<string>();

  const identityLookup = new Map<string, {
    phone?: string | null;
    guardianName?: string | null;
    guardianPhone?: string | null;
  }>();

  if (additionalIdentities) {
    for (const item of additionalIdentities) {
      identityLookup.set(item.studentId, item);
    }
  }

  students.forEach((student, index) => {
    const pseudonym = `Siswa_${index + 1}`;
    const extra = identityLookup.get(student.studentId);

    // Save identity mapping for LOCAL re-identification only
    reverseMap.set(pseudonym, {
      studentId: student.studentId,
      pseudonym,
      realName: student.name,
      nis: student.nis,
      gender: student.gender,
      phone: extra?.phone || null,
      guardianName: extra?.guardianName || null,
      guardianPhone: extra?.guardianPhone || null,
    });

    // Collect forbidden PII terms for assertion
    if (student.name) {
      // Add full name and each individual word >= 3 chars
      forbiddenTermsSet.add(student.name.trim());
      const words = student.name.trim().split(/\s+/);
      for (const w of words) {
        if (w.length >= 3) {
          forbiddenTermsSet.add(w);
        }
      }
    }
    if (student.nis && student.nis.length >= 3) {
      forbiddenTermsSet.add(student.nis.trim());
    }
    if (extra?.phone && extra.phone.length >= 5) {
      forbiddenTermsSet.add(extra.phone.trim());
    }
    if (extra?.guardianName) {
      forbiddenTermsSet.add(extra.guardianName.trim());
      const gWords = extra.guardianName.trim().split(/\s+/);
      for (const w of gWords) {
        if (w.length >= 3) forbiddenTermsSet.add(w);
      }
    }
    if (extra?.guardianPhone && extra.guardianPhone.length >= 5) {
      forbiddenTermsSet.add(extra.guardianPhone.trim());
    }

    // Identify dominant day pattern if triggered
    const dayPatternIndicator = student.indicators.find(
      (ind) => ind.code === 'EWS_DAY_PATTERN' && ind.triggered
    );
    const dominantDay = dayPatternIndicator?.details?.dominantDay as string | undefined;

    // Filter triggered indicators with sanitized details
    const sanitizedIndicators = student.indicators
      .filter((ind) => ind.triggered)
      .map((ind) => ({
        code: ind.code,
        severity: ind.severity,
        value: ind.value,
        unit: ind.unit,
        description: ind.description,
        suggestedAction: ind.suggestedAction,
      }));

    sanitizedStudents.push({
      pseudonym,
      gender: student.gender,
      totalActiveDays: student.totalActiveDays,
      hadirCount: student.hadirCount,
      sakitCount: student.sakitCount,
      izinCount: student.izinCount,
      alpaCount: student.alpaCount,
      attendanceRate: student.attendanceRate,
      triggeredIndicators: sanitizedIndicators,
      dayPattern: dominantDay,
      coldStartProtected: student.coldStartProtected,
    });
  });

  return {
    sanitizedStudents,
    reverseMap,
    forbiddenTerms: Array.from(forbiddenTermsSet),
  };
}

/**
 * Asserts that a given string does not contain any forbidden PII words, phone numbers, or emails.
 */
export function assertNoPII(
  text: string,
  forbiddenTerms: string[] = []
): { safe: boolean; violations: string[] } {
  const violations: string[] = [];

  // Check phone numbers
  const phoneMatches = text.match(PHONE_REGEX);
  if (phoneMatches && phoneMatches.length > 0) {
    violations.push(...phoneMatches.map((m) => `Nomor Telepon: ${m}`));
  }

  // Check emails
  const emailMatches = text.match(EMAIL_REGEX);
  if (emailMatches && emailMatches.length > 0) {
    violations.push(...emailMatches.map((m) => `Email: ${m}`));
  }

  // Check forbidden names / NIS terms
  const lowerText = text.toLowerCase();
  for (const term of forbiddenTerms) {
    if (!term || term.length < 3) continue;
    const lowerTerm = term.toLowerCase();
    // Regex for whole-word or boundary match
    const escaped = lowerTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(lowerText)) {
      violations.push(`Kata Sensitif / Nama / NIS: ${term}`);
    }
  }

  return {
    safe: violations.length === 0,
    violations,
  };
}

/**
 * Replace sensitive PII in text with [REDACTED].
 */
export function scrubPII(text: string, forbiddenTerms: string[] = []): string {
  let scrubbed = text
    .replace(PHONE_REGEX, '[NO_TELP_TERDAFTAR_DIREDAKSI]')
    .replace(EMAIL_REGEX, '[EMAIL_DIREDAKSI]');

  for (const term of forbiddenTerms) {
    if (!term || term.length < 3) continue;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    scrubbed = scrubbed.replace(regex, '[NAMA/NIS_DIREDAKSI]');
  }

  return scrubbed;
}

/**
 * Remap AI guidance containing pseudonyms (e.g. "Siswa_1") back to real student identities.
 * Performed strictly on local server / UI rendering tier.
 */
export function remapAIResponse(
  aiResponse: AIInsightResponse,
  reverseMap: Map<string, StudentIdentityMap>
): AIInsightResponse {
  const remappedGuidance = aiResponse.actionableGuidance.map((item) => {
    const realStudent = reverseMap.get(item.pseudonym);
    if (!realStudent) {
      return item;
    }
    return {
      ...item,
      studentId: realStudent.studentId,
      studentName: realStudent.realName,
      nis: realStudent.nis,
    };
  });

  return {
    ...aiResponse,
    actionableGuidance: remappedGuidance,
  };
}

/**
 * Redacted safe error logger that prevents leakage of API keys, prompts, or sensitive stack traces.
 */
export function safeLogError(message: string, error: unknown): void {
  let errorMessage = 'Unknown error';
  let stack = '';

  if (error instanceof Error) {
    errorMessage = error.message;
    stack = error.stack || '';
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  // Scrub any sk-... or apiKey patterns from message & stack
  const apiKeyRegex = /sk-[a-zA-Z0-9_-]{8,}/g;
  const scrubbedMsg = errorMessage.replace(apiKeyRegex, 'sk-***[MASKED]');
  const scrubbedStack = stack.replace(apiKeyRegex, 'sk-***[MASKED]');

  // In production / test, do not dump full payloads
  console.error(`[EDUNOTIFY_AI_ERROR] ${message}: ${scrubbedMsg}`);
  if (process.env.NODE_ENV === 'development' && scrubbedStack) {
    console.error(`[EDUNOTIFY_AI_STACK] ${scrubbedStack.split('\n').slice(0, 3).join('\n')}`);
  }
}

/**
 * Redacted safe info logger
 */
export function safeLogInfo(message: string, meta?: Record<string, any>): void {
  if (meta) {
    const sanitizedMeta: Record<string, any> = {};
    for (const [key, value] of Object.entries(meta)) {
      if (/key|secret|token|password|auth/i.test(key)) {
        sanitizedMeta[key] = maskApiKey(String(value));
      } else {
        sanitizedMeta[key] = value;
      }
    }
    console.log(`[EDUNOTIFY_AI_INFO] ${message}`, sanitizedMeta);
  } else {
    console.log(`[EDUNOTIFY_AI_INFO] ${message}`);
  }
}
