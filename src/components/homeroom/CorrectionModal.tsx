'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  FileEdit,
  AlertTriangle,
  History,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Loader2,
  UserCheck,
  HeartPulse,
  FileText,
  AlertCircle,
} from 'lucide-react';
import type { AttendanceStatus } from './types';
import { ATTENDANCE_STATUS_LABELS } from './types';
import {
  correctAttendanceAction,
  getCorrectionHistoryAction,
} from '@/app/(dashboard)/homeroom/actions';
import type { CorrectionEligibilityResult } from '@/services/correctionService';

interface StudentToCorrect {
  attendanceRecordId: string;
  studentId: string;
  studentName: string;
  nis: string;
  className: string;
  currentStatus: AttendanceStatus;
  dateStr: string;
  correctionEligibility?: CorrectionEligibilityResult;
}

interface Props {
  student: StudentToCorrect | null;
  classId: string;
  currentUserRole: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CorrectionModal({
  student,
  classId,
  currentUserRole,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [newStatus, setNewStatus] = useState<AttendanceStatus>('PRESENT');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (student) {
      // Pick first status that is different from current status
      const candidate: AttendanceStatus =
        student.currentStatus === 'PRESENT' ? 'SICK' : 'PRESENT';
      setNewStatus(candidate);
      setReason('');
      setError(null);

      // Load correction history for this record
      setIsLoadingHistory(true);
      getCorrectionHistoryAction(student.attendanceRecordId)
        .then((res) => setHistory(res || []))
        .catch(() => setHistory([]))
        .finally(() => setIsLoadingHistory(false));
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const reasonTrimmedLength = reason.trim().length;
  const isReasonValid = reasonTrimmedLength >= 10;
  const isStatusChanged = newStatus !== student.currentStatus;
  const eligibility = student.correctionEligibility;
  const isEligible = eligibility ? eligibility.isEligible : true;

  const getWindowBadge = () => {
    if (!eligibility) return null;
    switch (eligibility.window) {
      case 'HARI_H':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
            Koreksi Hari H (Guru Pengisi / Wali Kelas)
          </span>
        );
      case 'H_MIN_1_TO_3':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-950 text-blue-300 border border-blue-800">
            Koreksi H-1 s/d H-3 (Hanya Wali Kelas)
          </span>
        );
      case 'MORE_THAN_H_MIN_3':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-950 text-purple-300 border border-purple-800">
            Koreksi &gt; H-3 (Hanya Admin Sekolah)
          </span>
        );
      case 'FUTURE_DATE':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950 text-rose-300 border border-rose-800">
            Tanggal Mendatang (Terkunci)
          </span>
        );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReasonValid || !isStatusChanged || !isEligible) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await correctAttendanceAction({
        attendanceRecordId: student.attendanceRecordId,
        classId,
        newStatus,
        reason: reason.trim(),
        currentDate: new Date().toISOString().split('T')[0],
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan koreksi presensi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-800 flex items-center justify-center text-blue-400">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100">
                Formulir Koreksi Presensi Siswa
              </h2>
              <div className="text-xs text-neutral-400 mt-0.5">
                Audit trail terenkapsulasi &middot; Data lama tidak dihapus
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Target Student Information */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-neutral-200 text-sm">
                  {student.studentName}
                </span>
                <span className="text-neutral-500 ml-2 font-mono">
                  ({student.nis})
                </span>
              </div>
              <div>{getWindowBadge()}</div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-neutral-400 pt-1 border-t border-neutral-900">
              <span>
                Kelas: <strong className="text-neutral-200">{student.className}</strong>
              </span>
              <span>
                Tanggal Presensi:{' '}
                <strong className="text-neutral-200">{student.dateStr}</strong>
              </span>
              <span>
                Status Saat Ini:{' '}
                <strong className="text-neutral-200">
                  {ATTENDANCE_STATUS_LABELS[student.currentStatus] ||
                    student.currentStatus}
                </strong>
              </span>
            </div>
          </div>

          {/* RBAC Warning if not eligible */}
          {!isEligible && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-rose-300">
                  Akses Koreksi Ditolak (RBAC):
                </span>{' '}
                {eligibility?.message ||
                  'Anda tidak memiliki wewenang untuk mengoreksi presensi pada rentang tanggal ini.'}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Status Selector */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-2">
                Pilih Status Kehadiran Baru
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    value: 'PRESENT',
                    label: 'Hadir',
                    icon: UserCheck,
                    activeClass:
                      'bg-emerald-950 text-emerald-300 border-emerald-600',
                  },
                  {
                    value: 'SICK',
                    label: 'Sakit',
                    icon: HeartPulse,
                    activeClass: 'bg-amber-950 text-amber-300 border-amber-600',
                  },
                  {
                    value: 'PERMIT',
                    label: 'Izin',
                    icon: FileText,
                    activeClass: 'bg-blue-950 text-blue-300 border-blue-600',
                  },
                  {
                    value: 'ABSENT_ALPA',
                    label: 'Alpa',
                    icon: AlertCircle,
                    activeClass: 'bg-rose-950 text-rose-300 border-rose-600',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = newStatus === item.value;
                  const isCurrent = student.currentStatus === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      disabled={!isEligible}
                      onClick={() => setNewStatus(item.value as AttendanceStatus)}
                      className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                        isSelected
                          ? item.activeClass
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      } ${!isEligible ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {isCurrent && (
                        <span className="text-[10px] text-neutral-500 font-normal">
                          (Saat ini)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reason Textarea (Min 10 Chars) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-neutral-300">
                  Alasan Koreksi <span className="text-rose-400">*</span>
                </label>
                <span
                  className={`text-[11px] font-mono ${
                    isReasonValid ? 'text-emerald-400' : 'text-neutral-500'
                  }`}
                >
                  {reasonTrimmedLength} / min. 10 karakter
                </span>
              </div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={!isEligible || isSubmitting}
                placeholder="Contoh: Orang tua telah mengirimkan surat dokter resmi via WA / Siswa terlambat karena ban bocor."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-600 text-xs focus:outline-none focus:border-blue-500 transition disabled:opacity-50"
              />
              {!isReasonValid && reasonTrimmedLength > 0 && (
                <p className="text-[11px] text-rose-400 mt-1">
                  Alasan koreksi kurang dari 10 karakter ({10 - reasonTrimmedLength}{' '}
                  karakter lagi).
                </p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={
                  !isEligible ||
                  !isReasonValid ||
                  !isStatusChanged ||
                  isSubmitting
                }
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition ${
                  isEligible && isReasonValid && isStatusChanged && !isSubmitting
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Simpan Koreksi Presensi</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Previous Corrections History Audit Trail (DoD 7) */}
          <div className="pt-4 border-t border-neutral-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
              <History className="w-4 h-4 text-neutral-400" />
              <span>Riwayat Audit Koreksi Presensi Siswa Ini</span>
            </div>

            {isLoadingHistory ? (
              <div className="text-center py-4 text-xs text-neutral-500 flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Memuat riwayat koreksi...</span>
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 rounded-lg bg-neutral-950 border border-neutral-800/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-neutral-200">
                        {h.correctedBy?.name} ({h.correctedBy?.role})
                      </span>
                      <span className="text-neutral-500">
                        {new Date(h.createdAt).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                        {ATTENDANCE_STATUS_LABELS[h.oldStatus as AttendanceStatus] ||
                          h.oldStatus}
                      </span>
                      <span className="text-neutral-500">&rarr;</span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-semibold border border-blue-800">
                        {ATTENDANCE_STATUS_LABELS[h.newStatus as AttendanceStatus] ||
                          h.newStatus}
                      </span>
                    </div>

                    <p className="text-neutral-300 text-[11px] bg-neutral-900/60 p-2 rounded mt-1 border border-neutral-800/50">
                      &ldquo;{h.reason}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-neutral-500 italic p-3 rounded-lg bg-neutral-950/60 border border-neutral-900 text-center">
                Belum pernah ada riwayat koreksi untuk catatan presensi ini.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
