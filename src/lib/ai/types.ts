export type AIProviderType = '9router' | 'openai' | 'ollama' | 'anthropic';

export interface AIOptions {
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface AICompletionProvider {
  readonly name: string;
  readonly providerType: AIProviderType;
  generateText(prompt: string, options?: AIOptions): Promise<string>;
  healthCheck(): Promise<boolean>;
}

export interface AIProviderConfig {
  provider: AIProviderType;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  maxConcurrency?: number;
  timeoutMs?: number;
}

// ==========================================
// EWS & Early Warning System Types
// ==========================================

export type EWSCategory =
  | 'EWS_ALPA_STREAK'
  | 'EWS_ALPA_MONTHLY'
  | 'EWS_DAY_PATTERN'
  | 'EWS_TREND_DROP';

export type EWSSeverity = 'RENDAH' | 'SEDANG' | 'TINGGI';

export interface EWSIndicator {
  code: EWSCategory;
  name: string;
  severity: EWSSeverity;
  triggered: boolean;
  minDataDays: number;
  value: number;
  threshold: number;
  unit: string;
  description: string;
  suggestedAction: string;
  details?: Record<string, any>;
}

export interface StudentDailyAttendance {
  date: string; // YYYY-MM-DD
  status: 'PRESENT' | 'SICK' | 'PERMIT' | 'ABSENT_ALPA' | 'UNRECORDED';
  dayOfWeek?: number; // 1 = Senin, ..., 7 = Minggu
}

export interface StudentEWSInput {
  studentId: string;
  name: string;
  nis: string;
  gender: string;
  phone?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  records: StudentDailyAttendance[];
}

export interface StudentEWSResult {
  studentId: string;
  name: string;
  nis: string;
  gender: string;
  totalActiveDays: number;
  coldStartProtected: boolean;
  coldStartMessage?: string;
  hadirCount: number;
  sakitCount: number;
  izinCount: number;
  alpaCount: number;
  attendanceRate: number; // percentage (0 - 100)
  highestSeverity: EWSSeverity | null;
  indicators: EWSIndicator[];
  triggeredCount: number;
  lastCalculatedAt: string;
}

// ==========================================
// Privacy & Sanitizer Types
// ==========================================

export interface StudentIdentityMap {
  studentId: string;
  pseudonym: string; // e.g. "Siswa_1"
  realName: string;
  nis: string;
  gender: string;
  phone?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
}

export interface SanitizedStudentItem {
  pseudonym: string;
  gender: string;
  totalActiveDays: number;
  hadirCount: number;
  sakitCount: number;
  izinCount: number;
  alpaCount: number;
  attendanceRate: number;
  triggeredIndicators: Array<{
    code: EWSCategory;
    severity: EWSSeverity;
    value: number;
    unit: string;
    description: string;
    suggestedAction: string;
  }>;
  dayPattern?: string;
  coldStartProtected: boolean;
}

export interface SanitizedPayloadResult {
  sanitizedStudents: SanitizedStudentItem[];
  reverseMap: Map<string, StudentIdentityMap>;
  forbiddenTerms: string[];
}

// ==========================================
// AI Insight & Recommendation Types
// ==========================================

export interface AIActionableGuidance {
  pseudonym: string;
  studentId?: string;
  studentName?: string;
  nis?: string;
  urgency: EWSSeverity;
  recommendation: string;
}

export interface AIInsightResponse {
  executiveSummary: string;
  actionableGuidance: AIActionableGuidance[];
  generalRecommendations: string[];
  providerUsed: string;
  generatedAt: string;
  isFallback: boolean;
  fallbackReason?: string;
}

export interface ClassEWSOverview {
  classId: string;
  className: string;
  schoolId: string;
  totalStudents: number;
  activeEvaluatedStudents: number;
  averageAttendanceRate: number;
  studentsAtRiskCount: number;
  highestSeverity: EWSSeverity | null;
  streakAlertCount: number;
  monthlyAlertCount: number;
  patternAlertCount: number;
  trendDropAlertCount: number;
  coldStartCount: number;
  students: StudentEWSResult[];
  aiInsight?: AIInsightResponse;
}
