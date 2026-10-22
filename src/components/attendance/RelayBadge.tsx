import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, AlertCircle, Lock } from 'lucide-react';

interface RelayBadgeProps {
  sessionStatus?: 'NOT_CREATED' | 'DRAFT' | 'SUBMITTED' | 'UNCOMPLETED_ALERT' | string;
  isReadOnly?: boolean;
  canEdit?: boolean;
  isLateSubmission?: boolean;
  periodOrder?: number;
}

export function RelayBadge({
  sessionStatus,
  isReadOnly,
  canEdit,
  isLateSubmission,
  periodOrder,
}: RelayBadgeProps) {
  if (sessionStatus === 'SUBMITTED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Terkirim Resmi {isLateSubmission ? '(Susulan)' : ''}
      </span>
    );
  }

  if (sessionStatus === 'UNCOMPLETED_ALERT') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <AlertCircle className="w-3.5 h-3.5" />
        Belum Diabsen (Akhir KBM)
      </span>
    );
  }

  if (canEdit) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
        <Clock className="w-3.5 h-3.5" />
        {periodOrder ? `Estafet Aktif (Jam ke-${periodOrder})` : 'Siap Diisi'}
      </span>
    );
  }

  if (isReadOnly) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
        <Lock className="w-3.5 h-3.5" />
        Terkunci (Read-Only)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-800/80 text-neutral-400 border border-neutral-700">
      <Clock className="w-3.5 h-3.5" />
      Menunggu Jadwal
    </span>
  );
}
