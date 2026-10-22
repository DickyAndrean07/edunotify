import {
  EWSCategory,
  EWSSeverity,
  EWSIndicator,
  StudentEWSResult,
  AIInsightResponse,
  AIActionableGuidance,
  ClassEWSOverview,
} from '@/lib/ai/types';

export type {
  EWSCategory,
  EWSSeverity,
  EWSIndicator,
  StudentEWSResult,
  AIInsightResponse,
  AIActionableGuidance,
  ClassEWSOverview,
};

export type EWSFilterTab = 'ALL' | 'TINGGI' | 'SEDANG' | 'COLD_START';
