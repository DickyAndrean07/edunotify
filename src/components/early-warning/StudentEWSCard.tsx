'use client';

import React from 'react';
import { StudentEWSResult, AIActionableGuidance } from './types';
import { EarlyWarningBadge } from './EarlyWarningBadge';
import {
  User,
  AlertTriangle,
  Info,
  CheckCircle2,
  CalendarDays,
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
  let cardBorder = 'border-neutral-800';
  let badgeHeader = null;

  if (student.highestSeverity === 'TINGGI') {
    cardBorder = 'border-red-900/60 bg-gradient-to-b from-red-950/20 to-neutral-900/90';
  } else if (student.highestSeverity === 'SEDANG') {
    cardBorder = 'border-amber-900/60 bg-gradient-to-b from-amber-950/20 to-neutral-900/90';
  } else {
    cardBorder = 'border-neutral-800 bg-neutral-900/80';
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
      className={`rounded-2xl p-5 border transition-all duration-200 hover:border-neutral-700 ${cardBorder}`}
    >
      {/* Top Header: Student Info & Attendance Rate */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-300 font-bold border border-neutral-700">
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-neutral-100">
                {student.name}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                {student.gender}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
              <span>NIS: <strong className="text-neutral-300 font-mono">{student.nis}</strong></span>
              <span>•</span>
              <span>{student.totalActiveDays} hari aktif</span>
            </div>
          </div>
        </div>

        {/* Attendance Rate Pill */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="text-right">
            <div className="text-xs text-neutral-400">Tingkat Hadir</div>
            <div
              className={`text-lg font-bold font-mono ${
                student.attendanceRate >= 90
                  ? 'text-emerald-400'
                  : student.attendanceRate >= 75
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            >
              {student.attendanceRate.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Numerical Attendance Breakdown */}
      <div className="grid grid-cols-4 gap-2 my-4 text-center">
        <div className="p-2 rounded-xl bg-neutral-950/60 border border-neutral-800">
          <div className="text-[11px] text-neutral-400">Hadir</div>
          <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
            {student.hadirCount}
          </div>
        </div>
        <div className="p-2 rounded-xl bg-neutral-950/60 border border-neutral-800">
          <div className="text-[11px] text-neutral-400">Sakit</div>
          <div className="text-sm font-bold text-amber-400 font-mono mt-0.5">
            {student.sakitCount}
          </div>
        </div>
        <div className="p-2 rounded-xl bg-neutral-950/60 border border-neutral-800">
          <div className="text-[11px] text-neutral-400">Izin</div>
          <div className="text-sm font-bold text-blue-400 font-mono mt-0.5">
            {student.izinCount}
          </div>
        </div>
        <div className="p-2 rounded-xl bg-neutral-950/60 border border-neutral-800">
          <div className="text-[11px] text-neutral-400">Alpa</div>
          <div
            className={`text-sm font-bold font-mono mt-0.5 ${
              student.alpaCount > 0 ? 'text-red-400' : 'text-neutral-500'
            }`}
          >
            {student.alpaCount}
          </div>
        </div>
      </div>

      {/* Cold Start Banner if applicable */}
      {student.coldStartProtected && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 text-neutral-400 text-xs mb-3">
          <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
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
      <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Rekomendasi Tindak Lanjut:</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            {recommendation}
          </p>
        </div>

        {onActionClick && (
          <button
            onClick={() => onActionClick(student)}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Tindak Lanjut</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
