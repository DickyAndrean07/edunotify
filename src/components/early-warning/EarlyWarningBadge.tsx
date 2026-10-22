'use client';

import React from 'react';
import { EWSCategory, EWSSeverity } from './types';
import { Flame, Calendar, TrendingDown, Clock, AlertCircle } from 'lucide-react';

interface EarlyWarningBadgeProps {
  code: EWSCategory;
  severity: EWSSeverity;
  value: number;
  unit: string;
  className?: string;
  compact?: boolean;
}

export function EarlyWarningBadge({
  code,
  severity,
  value,
  unit,
  className = '',
  compact = false,
}: EarlyWarningBadgeProps) {
  let label = '';
  let Icon = AlertCircle;

  switch (code) {
    case 'EWS_ALPA_STREAK':
      label = `Alpa Beruntun: ${value} ${unit}`;
      Icon = Flame;
      break;
    case 'EWS_ALPA_MONTHLY':
      label = `Alpa Bulanan: ${value} ${unit}`;
      Icon = Clock;
      break;
    case 'EWS_DAY_PATTERN':
      label = `Pola Hari: ${value}${unit}`;
      Icon = Calendar;
      break;
    case 'EWS_TREND_DROP':
      label = `Drop Tren: ${value}${unit}`;
      Icon = TrendingDown;
      break;
  }

  let colorClasses = 'bg-neutral-800 text-neutral-300 border-neutral-700';
  if (severity === 'TINGGI') {
    colorClasses = 'bg-red-950/50 text-red-300 border-red-800/80';
  } else if (severity === 'SEDANG') {
    colorClasses = 'bg-amber-950/50 text-amber-300 border-amber-800/80';
  } else if (severity === 'RENDAH') {
    colorClasses = 'bg-blue-950/50 text-blue-300 border-blue-800/80';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClasses} ${className}`}
      title={label}
    >
      <Icon className={`w-3.5 h-3.5 ${severity === 'TINGGI' ? 'text-red-400' : severity === 'SEDANG' ? 'text-amber-400' : 'text-blue-400'}`} />
      <span>{label}</span>
      {!compact && (
        <span
          className={`ml-1 px-1.5 py-0.2 rounded text-[10px] uppercase font-bold tracking-wider ${
            severity === 'TINGGI'
              ? 'bg-red-800/60 text-red-200'
              : severity === 'SEDANG'
              ? 'bg-amber-800/60 text-amber-200'
              : 'bg-blue-800/60 text-blue-200'
          }`}
        >
          {severity}
        </span>
      )}
    </span>
  );
}
