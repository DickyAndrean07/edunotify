'use client';

import React from 'react';
import { StudentEWSResult, AIActionableGuidance } from './types';
import { EarlyWarningBadge } from './EarlyWarningBadge';
import {
  Info,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface StudentEWSCardProps {
  student: StudentEWSResult;
  aiGuidance?: AIActionableGuidance;
  onActionClick?: (student: StudentEWSResult) => void;
}

export function StudentEWSCard({
  student,
  aiGuidance,
  onActionClick,
}: StudentEWSCardProps) {
  const triggeredIndicators = student.indicators.filter((i) => i.triggered);
  const hasTrigger = triggeredIndicators.length > 0;

  // Border & Accent color according to highest severity
  let cardBorder = 'border-[#E4EBF6] dark:border-[#1D3756] bg-white dark:bg-[#0D2037]';

  if (student.highestSeverity === 'TINGGI') {
    cardBorder =
      'border-rose-200 dark:border-rose-900/60 bg-gradient-to-b from-rose-50/60 to-white dark:from-rose-950/20 dark:to-[#0D2037]';
  } else if (student.highestSeverity === 'SEDANG') {
    cardBorder =
      'border-amber-200 dark:border-amber-900/60 bg-gradient-to-b from-amber-50/60 to-white dark:from-amber-950/20 dark:to-[#0D2037]';
  }

  // Determine recommendation text
  const primaryIndicator =
    triggeredIndicators.find((i) => i.severity === 'TINGGI') ||
    triggeredIndicators.find((i) => i.severity === 'SEDANG') ||
    triggeredIndicators[0];

  const recommendation =
    aiGuidance?.recommendation ||
    primaryIndicator?.suggestedAction ||
    'Pantau kehadiran siswa secara berkala.';

  return (
    <div
      className={`rounded-2xl p-5 border transition-all duration-200 shadow-sm ${cardBorder}`}
    >
      {/* Top Header: Student Info & Attendance Rate */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4EBF6] dark:border-[#1D3756]/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1351C6]/10 dark:bg-[#112E58] flex items-center justify-center text-[#1351C6] dark:text-[#04B9E8] font-bold border border-[#1351C6]/20 dark:border-[#1684FF]/30">
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#172944] dark:text-[#EAF5FF]">
                {student.name}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#071325] text-[#72849D] dark:text-[#91A9C6] font-mono border border-slate-200 dark:border-[#1D3756]">
                {student.gender}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#72849D] dark:text-[#91A9C6] mt-0.5 font-medium">
              <span>NIS: <strong className="font-mono text-[#172944] dark:text-[#EAF5FF]">{student.nis}</strong></span>
              <span>&bull;</span>
              <span>{student.totalActiveDays} hari aktif</span>
            </div>
          </div>
        </div>

        {/* Attendance Rate Pill */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="text-right">
            <div className="text-xs text-[#72849D] dark:text-[#91A9C6] font-medium">Tingkat Hadir</div>
            <div
              className={`text-lg font-extrabold font-mono ${
                student.attendanceRate >= 90
                  ? 'text-emerald-600 dark:text-[#35E6BD]'
                  : student.attendanceRate >= 75
                  ? 'text-amber-600 dark:text-[#FFAA00]'
                  : 'text-rose-600 dark:text-[#FF7087]'
              }`}
            >
              {student.attendanceRate.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Numerical Attendance Breakdown */}
      <div className="grid grid-cols-4 gap-2 my-4 text-center">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756]">
          <div className="text-[11px] font-semibold text-[#72849D] dark:text-[#91A9C6]">Hadir</div>
          <div className="text-sm font-extrabold text-emerald-600 dark:text-[#35E6BD] font-mono mt-0.5">
            {student.hadirCount}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756]">
          <div className="text-[11px] font-semibold text-[#72849D] dark:text-[#91A9C6]">Sakit</div>
          <div className="text-sm font-extrabold text-amber-600 dark:text-[#FFAA00] font-mono mt-0.5">
            {student.sakitCount}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756]">
          <div className="text-[11px] font-semibold text-[#72849D] dark:text-[#91A9C6]">Izin</div>
          <div className="text-sm font-extrabold text-blue-600 dark:text-[#04B9E8] font-mono mt-0.5">
            {student.izinCount}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756]">
          <div className="text-[11px] font-semibold text-[#72849D] dark:text-[#91A9C6]">Alpa</div>
          <div
            className={`text-sm font-extrabold font-mono mt-0.5 ${
              student.alpaCount > 0 ? 'text-rose-600 dark:text-[#FF7087]' : 'text-[#94A3B8]'
            }`}
          >
            {student.alpaCount}
          </div>
        </div>
      </div>

      {/* Cold Start Banner if applicable */}
      {student.coldStartProtected && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756] text-[#72849D] dark:text-[#91A9C6] text-xs mb-3">
          <Info className="w-4 h-4 text-[#1351C6] dark:text-[#04B9E8] shrink-0 mt-0.5" />
          <span>{student.coldStartMessage}</span>
        </div>
      )}

      {/* Triggered EWS Badges */}
      {hasTrigger && (
        <div className="flex flex-wrap gap-2 mb-4">
          {triggeredIndicators.map((ind) => (
            <EarlyWarningBadge
              key={ind.code}
              code={ind.code}
              severity={ind.severity}
              value={ind.value}
              unit={ind.unit}
            />
          ))}
        </div>
      )}

      {/* Actionable Guidance / Recommendation Box */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#172944] dark:text-[#EAF5FF]">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>Rekomendasi Tindak Lanjut:</span>
          </div>
          <p className="text-xs text-[#72849D] dark:text-[#91A9C6] leading-relaxed">
            {recommendation}
          </p>
        </div>

        {onActionClick && (
          <button
            type="button"
            onClick={() => onActionClick(student)}
            className="shrink-0 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#11233B] hover:bg-slate-100 dark:hover:bg-[#142C49] text-xs font-bold text-[#1351C6] dark:text-[#04B9E8] border border-[#E4EBF6] dark:border-[#1D3756] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Tindak Lanjut</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
