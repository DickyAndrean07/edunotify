'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  ExternalLink,
  Users,
  FileEdit,
  Phone,
  Loader2,
  Check,
} from 'lucide-react';
import { AlpaStudentItem } from '@/app/(dashboard)/homeroom/actions';
import type { InterventionStatus } from './types';

interface Props {
  student: AlpaStudentItem;
  classId: string;
  onWhatsAppClick: (recordId: string, url: string) => Promise<void>;
  onMarkContacted: (recordId: string) => Promise<void>;
  onOpenCorrectionModal: (student: AlpaStudentItem) => void;
}

export function AlpaStudentInterventionCard({
  student,
  classId,
  onWhatsAppClick,
  onMarkContacted,
  onOpenCorrectionModal,
}: Props) {
  const [isOpeningWA, setIsOpeningWA] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  const getStatusBadge = (status: InterventionStatus) => {
    switch (status) {
      case 'WHATSAPP_OPENED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-[#372B20] text-amber-700 dark:text-[#FFC15B] border border-amber-200 dark:border-transparent">
            <ExternalLink className="w-3 h-3" />
            WA Dibuka
          </span>
        );
      case 'MARKED_CONTACTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-[#123D3D] text-emerald-700 dark:text-[#45D9A7] border border-emerald-200 dark:border-transparent">
            <CheckCircle2 className="w-3 h-3" />
            Sudah Dihubungi
          </span>
        );
      case 'NOT_OPENED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-[#3A2035] text-rose-700 dark:text-[#FF7087] border border-rose-200 dark:border-transparent">
            Belum Dibuka
          </span>
        );
    }
  };

  const initials = student.name
    ? student.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AP';

  const handleSendWhatsApp = async () => {
    if (!student.whatsAppUrl) return;
    setIsOpeningWA(true);
    try {
      window.open(student.whatsAppUrl, '_blank', 'noopener,noreferrer');
      await onWhatsAppClick(student.attendanceRecordId, student.whatsAppUrl);
    } finally {
      setIsOpeningWA(false);
    }
  };

  const handleMarkContacted = async () => {
    setIsMarking(true);
    try {
      await onMarkContacted(student.attendanceRecordId);
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] hover:border-[#CBD8EA] dark:hover:border-[#2D4E75] transition-all flex flex-col justify-between space-y-4 shadow-sm">
      {/* Top Header & Status */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1351C6]/10 dark:bg-[#112E58] text-[#1351C6] dark:text-[#04B9E8] font-extrabold text-xs flex items-center justify-center shrink-0 border border-[#1351C6]/20 dark:border-[#1684FF]/30">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#071325] text-slate-600 dark:text-[#91A9C6] font-mono border border-slate-200 dark:border-[#1D3756]">
                  {student.nis}
                </span>
                <span className="text-[11px] text-[#72849D] dark:text-[#91A9C6] font-medium">
                  {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#172944] dark:text-[#EAF5FF] mt-1 leading-snug">
                {student.name}
              </h3>
            </div>
          </div>
          <div className="shrink-0">
            {getStatusBadge(student.interventionStatus)}
          </div>
        </div>

        {/* Guardian Info */}
        <div className="mt-3.5 pt-3 border-t border-[#E4EBF6] dark:border-[#1D3756] space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#72849D] dark:text-[#91A9C6]">Orang Tua / Wali:</span>
            <span className="font-semibold text-[#172944] dark:text-[#EAF5FF]">
              {student.guardianName || 'Belum terdata'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#72849D] dark:text-[#91A9C6]">WhatsApp:</span>
            <span className="font-mono text-[#172944] dark:text-[#EAF5FF] flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-[#25D366]" />
              {student.guardianPhone || 'Tidak ada nomor'}
            </span>
          </div>
        </div>

        {/* Sibling / Multi-student single contact notice */}
        {student.isMultiStudentContact && (
          <div className="mt-3 p-2.5 rounded-xl bg-blue-50 dark:bg-[#112E58]/40 border border-blue-200 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
            <Users className="w-3.5 h-3.5 text-blue-600 dark:text-[#04B9E8] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Kontak Bersama:</span> Nomor ini juga terdaftar untuk{' '}
              <span className="font-bold">{student.sharedWithStudents.join(', ')}</span>.
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-3 border-t border-[#E4EBF6] dark:border-[#1D3756]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Kirim WhatsApp button */}
          <button
            type="button"
            onClick={handleSendWhatsApp}
            disabled={!student.whatsAppUrl || isOpeningWA}
            className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
              student.whatsAppUrl
                ? 'bg-[#25D366] hover:bg-[#20ba5a] text-white'
                : 'bg-slate-100 dark:bg-[#11233B] text-slate-400 dark:text-[#91A9C6] cursor-not-allowed border border-slate-200 dark:border-[#1D3756]'
            }`}
            title={
              student.whatsAppUrl
                ? 'Buka tautan wa.me di tab baru'
                : 'Nomor telepon tidak valid/belum terdata'
            }
          >
            {isOpeningWA ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <MessageSquare className="w-3.5 h-3.5" />
            )}
            <span>Buka WhatsApp</span>
          </button>

          {/* Tandai Sudah Dihubungi button */}
          <button
            type="button"
            onClick={handleMarkContacted}
            disabled={isMarking || student.interventionStatus === 'MARKED_CONTACTED'}
            className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition ${
              student.interventionStatus === 'MARKED_CONTACTED'
                ? 'bg-emerald-50 dark:bg-[#123D3D] text-emerald-700 dark:text-[#45D9A7] border-emerald-200 dark:border-emerald-800 cursor-default'
                : 'bg-white dark:bg-[#071325] hover:bg-slate-50 dark:hover:bg-[#11233B] text-[#172944] dark:text-[#EAF5FF] border-[#E4EBF6] dark:border-[#1D3756]'
            }`}
          >
            {isMarking ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : student.interventionStatus === 'MARKED_CONTACTED' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#45D9A7]" />
                <span>Sudah Dihubungi</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tandai Dihubungi</span>
              </>
            )}
          </button>
        </div>

        {/* Koreksi status quick button */}
        <button
          type="button"
          onClick={() => onOpenCorrectionModal(student)}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#72849D] dark:text-[#91A9C6] hover:text-[#172944] dark:hover:text-[#EAF5FF] hover:bg-slate-100 dark:hover:bg-[#11233B] transition border border-transparent hover:border-[#E4EBF6] dark:hover:border-[#1D3756]"
        >
          <FileEdit className="w-3.5 h-3.5" />
          <span>Koreksi Presensi (Alasan Wajib)</span>
        </button>
      </div>
    </div>
  );
}
