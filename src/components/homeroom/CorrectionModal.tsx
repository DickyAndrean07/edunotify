'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  FileEdit,
  History,
  CheckCircle2,
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
      const candidate: AttendanceStatus =
        student.currentStatus === 'PRESENT' ? 'SICK' : 'PRESENT';
      setNewStatus(candidate);
      setReason('');
      setError(null);

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
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Koreksi Hari H (Guru Pengisi / Wali Kelas)
          </span>
        );
      case 'H_MIN_1_TO_3':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Koreksi H-1 s/d H-3 (Hanya Wali Kelas)
          </span>
        );
      case 'MORE_THAN_H_MIN_3':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Koreksi &gt; H-3 (Hanya Admin Sekolah)
          </span>
        );
      case 'FUTURE_DATE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
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
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E4EBF6] dark:border-[#1D3756]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-[#112E58] border border-blue-200 dark:border-[#1684FF]/40 flex items-center justify-center text-[#1351C6] dark:text-[#04B9E8]">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#172944] dark:text-[#EAF5FF]">
                Formulir Koreksi Presensi Siswa
              </h2>
              <div className="text-xs text-[#72849D] dark:text-[#91A9C6] mt-0.5">
                Audit trail terenkapsulasi &middot; Data lama tidak dihapus
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#72849D] dark:text-[#91A9C6] hover:text-[#172944] dark:hover:text-[#EAF5FF] hover:bg-slate-100 dark:hover:bg-[#11233B] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Target Student Information */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756] space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-[#172944] dark:text-[#EAF5FF] text-sm">
                  {student.studentName}
                </span>
                <span className="text-[#72849D] dark:text-[#91A9C6] ml-2 font-mono">
                  ({student.nis})
                </span>
              </div>
              <div>{getWindowBadge()}</div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#72849D] dark:text-[#91A9C6] pt-2 border-t border-[#E4EBF6] dark:border-[#1D3756]/80">
              <span>
                Kelas:{' '}
                <strong className="text-[#172944] dark:text-[#EAF5FF]">
                  {student.className}
                </strong>
              </span>
              <span>
                Tanggal Presensi:{' '}
                <strong className="text-[#172944] dark:text-[#EAF5FF]">
                  {student.dateStr}
                </strong>
              </span>
              <span>
                Status Saat Ini:{' '}
                <strong className="text-[#172944] dark:text-[#EAF5FF]">
                  {ATTENDANCE_STATUS_LABELS[student.currentStatus] ||
                    student.currentStatus}
                </strong>
              </span>
            </div>
          </div>

          {/* RBAC Warning if not eligible */}
          {!isEligible && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">
                  Akses Koreksi Ditolak (RBAC):
                </span>{' '}
                {eligibility?.message ||
                  'Anda tidak memiliki wewenang untuk mengoreksi presensi pada rentang tanggal ini.'}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Status Selector */}
            <div>
              <label className="block text-xs font-bold text-[#172944] dark:text-[#EAF5FF] mb-2">
                Pilih Status Kehadiran Baru
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    value: 'PRESENT',
                    label: 'Hadir',
                    icon: UserCheck,
                    activeClass:
                      'bg-emerald-50 dark:bg-[#123D3D] text-emerald-700 dark:text-[#45D9A7] border-emerald-500 shadow-sm',
                  },
                  {
                    value: 'SICK',
                    label: 'Sakit',
                    icon: HeartPulse,
                    activeClass:
                      'bg-amber-50 dark:bg-[#372B20] text-amber-700 dark:text-[#FFC15B] border-amber-500 shadow-sm',
                  },
                  {
                    value: 'PERMIT',
                    label: 'Izin',
                    icon: FileText,
                    activeClass:
                      'bg-blue-50 dark:bg-[#112E58] text-blue-700 dark:text-[#04B9E8] border-blue-500 shadow-sm',
                  },
                  {
                    value: 'ABSENT_ALPA',
                    label: 'Alpa',
                    icon: AlertCircle,
                    activeClass:
                      'bg-rose-50 dark:bg-[#3A2035] text-rose-700 dark:text-[#FF7087] border-rose-500 shadow-sm',
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
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                        isSelected
                          ? item.activeClass
                          : 'bg-white dark:bg-[#071325] border-[#E4EBF6] dark:border-[#1D3756] text-[#72849D] dark:text-[#91A9C6] hover:border-[#1351C6]'
                      } ${!isEligible ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {isCurrent && (
                        <span className="text-[10px] text-[#94A3B8] font-normal">
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
                <label className="text-xs font-bold text-[#172944] dark:text-[#EAF5FF]">
                  Alasan Koreksi <span className="text-rose-500">*</span>
                </label>
                <span
                  className={`text-[11px] font-mono ${
                    isReasonValid
                      ? 'text-emerald-600 dark:text-[#35E6BD]'
                      : 'text-[#94A3B8]'
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756] text-[#172944] dark:text-[#EAF5FF] placeholder-[#94A3B8] text-xs focus:outline-none focus:border-[#1351C6] dark:focus:border-[#04B9E8] transition disabled:opacity-50"
              />
              {!isReasonValid && reasonTrimmedLength > 0 && (
                <p className="text-[11px] text-rose-500 mt-1">
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
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#72849D] dark:text-[#91A9C6] hover:text-[#172944] dark:hover:text-[#EAF5FF] hover:bg-slate-100 dark:hover:bg-[#11233B] transition"
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
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                  isEligible && isReasonValid && isStatusChanged && !isSubmitting
                    ? 'bg-gradient-to-r from-[#1351C6] to-[#04B9E8] text-white hover:opacity-95'
                    : 'bg-slate-200 dark:bg-[#11233B] text-slate-400 dark:text-[#91A9C6] cursor-not-allowed'
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
          <div className="pt-4 border-t border-[#E4EBF6] dark:border-[#1D3756] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#172944] dark:text-[#EAF5FF]">
              <History className="w-4 h-4 text-[#72849D] dark:text-[#91A9C6]" />
              <span>Riwayat Audit Koreksi Presensi Siswa Ini</span>
            </div>

            {isLoadingHistory ? (
              <div className="text-center py-4 text-xs text-[#72849D] dark:text-[#91A9C6] flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Memuat riwayat koreksi...</span>
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#172944] dark:text-[#EAF5FF]">
                        {h.correctedBy?.name} ({h.correctedBy?.role})
                      </span>
                      <span className="text-[#72849D] dark:text-[#91A9C6]">
                        {new Date(h.createdAt).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-[#11233B] text-slate-700 dark:text-slate-300">
                        {ATTENDANCE_STATUS_LABELS[h.oldStatus as AttendanceStatus] ||
                          h.oldStatus}
                      </span>
                      <span className="text-[#94A3B8]">&rarr;</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-[#112E58] text-blue-700 dark:text-[#04B9E8] font-bold border border-blue-200 dark:border-[#1684FF]/40">
                        {ATTENDANCE_STATUS_LABELS[h.newStatus as AttendanceStatus] ||
                          h.newStatus}
                      </span>
                    </div>

                    <p className="text-[#72849D] dark:text-[#91A9C6] text-[11px] bg-white dark:bg-[#0D2037] p-2.5 rounded-lg mt-1 border border-[#E4EBF6] dark:border-[#1D3756]">
                      &ldquo;{h.reason}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[#72849D] dark:text-[#91A9C6] italic p-3 rounded-xl bg-slate-50 dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756] text-center">
                Belum pernah ada riwayat koreksi untuk catatan presensi ini.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
