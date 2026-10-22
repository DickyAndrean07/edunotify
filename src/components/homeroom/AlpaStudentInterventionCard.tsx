'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  ExternalLink,
  Users,
  FileEdit,
  Phone,
  AlertCircle,
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-950/80 text-sky-400 border border-sky-800">
            <ExternalLink className="w-3 h-3" />
            WhatsApp Dibuka
          </span>
        );
      case 'MARKED_CONTACTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Ditandai Sudah Dihubungi
          </span>
        );
      case 'NOT_OPENED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700">
            Belum Dibuka
          </span>
        );
    }
  };

  const handleSendWhatsApp = async () => {
    if (!student.whatsAppUrl) return;
    setIsOpeningWA(true);
    try {
      // 1. Open WA link in new tab
      window.open(student.whatsAppUrl, '_blank', 'noopener,noreferrer');
      // 2. Trigger server tracking
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
    <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 transition flex flex-col justify-between space-y-4">
      {/* Top Header & Status */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                {student.nis}
              </span>
              <span className="text-xs text-neutral-400 font-medium">
                {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
              </span>
            </div>
            <h3 className="text-base font-bold text-neutral-100 mt-1">
              {student.name}
            </h3>
          </div>
          <div className="flex-shrink-0">
            {getStatusBadge(student.interventionStatus)}
          </div>
        </div>

        {/* Guardian Info */}
        <div className="mt-3 pt-3 border-t border-neutral-800/80 space-y-1.5 text-xs text-neutral-300">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Orang Tua/Wali:</span>
            <span className="font-medium text-neutral-200">
              {student.guardianName || 'Belum terdata'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Nomor WhatsApp:</span>
            <span className="font-mono text-neutral-200 flex items-center gap-1">
              <Phone className="w-3 h-3 text-emerald-400" />
              {student.guardianPhone || 'Tidak ada nomor'}
            </span>
          </div>
        </div>

        {/* Sibling / Multi-student single contact notice */}
        {student.isMultiStudentContact && (
          <div className="mt-3 p-2.5 rounded-lg bg-sky-950/40 border border-sky-800/60 text-[11px] text-sky-300 flex items-start gap-2">
            <Users className="w-3.5 h-3.5 text-sky-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-sky-200">Kontak Bersama:</span>{' '}
              Nomor ini juga terdaftar untuk{' '}
              <span className="font-semibold text-sky-200">
                {student.sharedWithStudents.join(', ')}
              </span>
              . Tautan WhatsApp ini secara spesifik hanya memuat template untuk ananda{' '}
              <span className="font-semibold underline">{student.name}</span>.
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-neutral-800/80">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Kirim WhatsApp button */}
          <button
            onClick={handleSendWhatsApp}
            disabled={!student.whatsAppUrl || isOpeningWA}
            className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              student.whatsAppUrl
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-900/30'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
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
            <span>Kirim WhatsApp</span>
          </button>

          {/* Tandai Sudah Dihubungi button */}
          <button
            onClick={handleMarkContacted}
            disabled={
              isMarking || student.interventionStatus === 'MARKED_CONTACTED'
            }
            className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
              student.interventionStatus === 'MARKED_CONTACTED'
                ? 'bg-neutral-900 text-emerald-400 border-emerald-900/60 cursor-default'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
            }`}
          >
            {isMarking ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : student.interventionStatus === 'MARKED_CONTACTED' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
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
          onClick={() => onOpenCorrectionModal(student)}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/80 transition border border-transparent hover:border-neutral-700"
        >
          <FileEdit className="w-3.5 h-3.5 text-neutral-400" />
          <span>Koreksi Presensi (Alasan Wajib)</span>
        </button>
      </div>
    </div>
  );
}
