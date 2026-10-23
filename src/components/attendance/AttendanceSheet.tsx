'use client';

import React, { useState } from 'react';
import {
  X,
  Check,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Loader2,
  UserCheck,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { RelayBadge } from './RelayBadge';
import { WarningBanner } from './WarningBanner';

export type AttendanceStatus =
  | 'UNRECORDED'
  | 'PRESENT'
  | 'SICK'
  | 'PERMIT'
  | 'ABSENT_ALPA';

export interface StudentItem {
  id?: string;
  studentId: string;
  nis: string;
  nisn?: string | null;
  name: string;
  gender: string;
  guardianName?: string | null;
  guardianPhone?: string | null;
  status: AttendanceStatus;
  notes?: string | null;
}

interface AttendanceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  classId: string;
  className: string;
  subjectName: string;
  date: string;
  periodOrder?: number;
  initialRecords: StudentItem[];
  isReadOnly?: boolean;
  sessionStatus?: string;
  submittedByName?: string | null;
  submittedAt?: string | null;
  isLateSubmission?: boolean;
  isWarning12pm?: boolean;
  isUncompletedAlert?: boolean;
}

export function AttendanceSheet({
  isOpen,
  onClose,
  onSuccess,
  classId,
  className,
  subjectName,
  date,
  periodOrder,
  initialRecords,
  isReadOnly = false,
  sessionStatus = 'DRAFT',
  submittedByName,
  submittedAt,
  isLateSubmission = false,
  isWarning12pm = false,
  isUncompletedAlert = false,
}: AttendanceSheetProps) {
  const [records, setRecords] = useState<StudentItem[]>(initialRecords);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [isLockedLocal, setIsLockedLocal] = useState<boolean>(isReadOnly);
  const [localSubmitter, setLocalSubmitter] = useState<string | null>(
    submittedByName || null
  );

  if (!isOpen) return null;

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (isLockedLocal) return;
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    );
  };

  const handleNoteChange = (studentId: string, notes: string) => {
    if (isLockedLocal) return;
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, notes } : r))
    );
  };

  const handleMarkAllPresent = () => {
    if (isLockedLocal) return;
    setRecords((prev) =>
      prev.map((r) => ({
        ...r,
        status: 'PRESENT',
      }))
    );
  };

  // Aggregated Counts
  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const sickCount = records.filter((r) => r.status === 'SICK').length;
  const permitCount = records.filter((r) => r.status === 'PERMIT').length;
  const alpaCount = records.filter((r) => r.status === 'ABSENT_ALPA').length;
  const unrecordedCount = records.filter((r) => r.status === 'UNRECORDED').length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedLocal) return;

    setErrorBanner(null);
    setSuccessBanner(null);
    setIsSubmitting(true);

    try {
      const payload = {
        classId,
        date,
        records: records.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          notes: r.notes || null,
        })),
        idempotencyKey: `${classId}-${date}-${Date.now()}`,
      };

      const res = await fetch('/api/attendance/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 409) {
        // Concurrency error handling
        setErrorBanner(
          data.error ||
            'Presensi untuk kelas ini telah disubmit oleh guru lain. Data Anda tidak disimpan untuk mencegah duplikasi.'
        );
        setIsLockedLocal(true);
        if (data.submittedByName) {
          setLocalSubmitter(data.submittedByName);
        }
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan presensi.');
      }

      setSuccessBanner(
        `Presensi resmi berhasil disimpan! ${
          data.isLateSubmission ? '(Tercatat sebagai Pengisian Susulan)' : ''
        }`
      );
      setIsLockedLocal(true);
      if (data.submittedByName) {
        setLocalSubmitter(data.submittedByName);
      }

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1200);
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Terjadi kesalahan saat menyimpan presensi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="p-5 border-b border-[#E4EBF6] dark:border-[#1D3756] flex items-center justify-between bg-slate-50/80 dark:bg-[#071325]/80">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-[#172944] dark:text-[#EAF5FF]">{className}</h2>
              <RelayBadge
                sessionStatus={isLockedLocal ? 'SUBMITTED' : sessionStatus}
                isReadOnly={isLockedLocal}
                canEdit={!isLockedLocal}
                periodOrder={periodOrder}
                isLateSubmission={isLateSubmission}
              />
            </div>
            <p className="text-xs text-[#72849D] dark:text-[#91A9C6] mt-1 font-medium">
              Mata Pelajaran: <span className="text-[#172944] dark:text-[#EAF5FF] font-bold">{subjectName}</span> &bull; Tanggal: <span className="text-[#172944] dark:text-[#EAF5FF] font-bold">{date}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#72849D] dark:text-[#91A9C6] hover:text-[#172944] dark:hover:text-[#EAF5FF] hover:bg-slate-100 dark:hover:bg-[#11233B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banners Area */}
        <div className="p-5 pb-0 space-y-3">
          {errorBanner && (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-rose-300">Konflik Konkurensi / Galat:</p>
                <p className="mt-0.5">{errorBanner}</p>
              </div>
            </div>
          )}

          {successBanner && (
            <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-300">Berhasil Disimpan:</p>
                <p className="mt-0.5">{successBanner}</p>
              </div>
            </div>
          )}

          {isLockedLocal && (
            <div className="p-4 rounded-xl bg-neutral-800/80 border border-neutral-700 text-neutral-200 text-sm flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-neutral-100">
                  Sesi Presensi Telah Dikunci (Read-Only)
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Presensi resmi kelas ini telah disubmit oleh{' '}
                  <span className="text-emerald-400 font-medium">
                    {localSubmitter || 'guru pengampu'}
                  </span>
                  {submittedAt ? ` pada ${new Date(submittedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB` : ''}
                  . Perubahan hanya dapat dilakukan melalui alur koreksi presensi.
                </p>
              </div>
            </div>
          )}

          <WarningBanner
            isWarning12pm={!isLockedLocal && isWarning12pm}
            isUncompletedAlert={!isLockedLocal && isUncompletedAlert}
            isLateSubmission={isLateSubmission}
          />
        </div>

        {/* Summary Stats & Quick Actions */}
        <div className="p-5 border-b border-[#E4EBF6] dark:border-[#1D3756] flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-[#071325]/40">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-[#35E6BD] border border-emerald-200 dark:border-emerald-800 font-bold">
              Hadir: <span>{presentCount}</span>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-[#04B9E8] border border-blue-200 dark:border-blue-800 font-bold">
              Sakit: <span>{sickCount}</span>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-[#FFAA00] border border-amber-200 dark:border-amber-800 font-bold">
              Izin: <span>{permitCount}</span>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-[#FF7087] border border-rose-200 dark:border-rose-800 font-bold">
              Alpa: <span>{alpaCount}</span>
            </span>
            {unrecordedCount > 0 && (
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#071325] text-slate-600 dark:text-[#91A9C6] border border-slate-200 dark:border-[#1D3756] font-semibold">
                Belum Diabsen: <span>{unrecordedCount}</span>
              </span>
            )}
          </div>

          {!isLockedLocal && (
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-[#1351C6]/10 text-[#1351C6] dark:text-[#04B9E8] border border-[#1351C6]/30 dark:border-[#1684FF]/40 hover:bg-[#1351C6]/20 transition-all shadow-sm"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Tandai Semua Hadir
            </button>
          )}
        </div>

        {/* Student List Form */}
        <div className="flex-1 overflow-y-auto p-5 divide-y divide-[#E4EBF6] dark:divide-[#1D3756]/60">
          {records.length === 0 ? (
            <div className="text-center py-12 text-sm text-neutral-500">
              Tidak ada siswa yang terdaftar di kelas ini.
            </div>
          ) : (
            records.map((student, idx) => {
              return (
                <div
                  key={student.studentId}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <span className="text-xs font-mono text-[#72849D] dark:text-[#91A9C6] w-6">
                      {idx + 1}.
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#172944] dark:text-[#EAF5FF]">
                          {student.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            student.gender === 'L'
                              ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                              : 'bg-pink-500/20 text-pink-600 dark:text-pink-400'
                          }`}
                        >
                          {student.gender}
                        </span>
                      </div>
                      <span className="text-xs text-[#72849D] dark:text-[#91A9C6] font-mono">
                        NIS: {student.nis}
                      </span>
                    </div>
                  </div>

                  {/* Status Buttons Group */}
                  <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                    <button
                      type="button"
                      disabled={isLockedLocal}
                      onClick={() => handleStatusChange(student.studentId, 'PRESENT')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        student.status === 'PRESENT'
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-slate-100 dark:bg-[#11233B] text-slate-600 dark:text-[#91A9C6] hover:bg-slate-200 dark:hover:bg-[#142C49]'
                      } ${isLockedLocal ? 'opacity-80 cursor-not-allowed' : ''}`}
                    >
                      Hadir (H)
                    </button>

                    <button
                      type="button"
                      disabled={isLockedLocal}
                      onClick={() => handleStatusChange(student.studentId, 'SICK')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        student.status === 'SICK'
                          ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                          : 'bg-slate-100 dark:bg-[#11233B] text-slate-600 dark:text-[#91A9C6] hover:bg-slate-200 dark:hover:bg-[#142C49]'
                      } ${isLockedLocal ? 'opacity-80 cursor-not-allowed' : ''}`}
                    >
                      Sakit (S)
                    </button>

                    <button
                      type="button"
                      disabled={isLockedLocal}
                      onClick={() => handleStatusChange(student.studentId, 'PERMIT')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        student.status === 'PERMIT'
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                          : 'bg-slate-100 dark:bg-[#11233B] text-slate-600 dark:text-[#91A9C6] hover:bg-slate-200 dark:hover:bg-[#142C49]'
                      } ${isLockedLocal ? 'opacity-80 cursor-not-allowed' : ''}`}
                    >
                      Izin (I)
                    </button>

                    <button
                      type="button"
                      disabled={isLockedLocal}
                      onClick={() => handleStatusChange(student.studentId, 'ABSENT_ALPA')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        student.status === 'ABSENT_ALPA'
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                          : 'bg-slate-100 dark:bg-[#11233B] text-slate-600 dark:text-[#91A9C6] hover:bg-slate-200 dark:hover:bg-[#142C49]'
                      } ${isLockedLocal ? 'opacity-80 cursor-not-allowed' : ''}`}
                    >
                      Alpa (A)
                    </button>

                    {student.status === 'UNRECORDED' && (
                      <span className="text-[11px] text-[#94A3B8] px-2 italic font-medium">
                        Belum Diabsen
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#E4EBF6] dark:border-[#1D3756] bg-slate-50 dark:bg-[#071325]/80 flex items-center justify-between gap-4">
          <div className="text-xs text-[#72849D] dark:text-[#91A9C6] font-medium">
            {isLockedLocal ? (
              <span>
                Data presensi terkunci setelah submit resmi.
              </span>
            ) : unrecordedCount > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                Perhatian: Masih ada {unrecordedCount} siswa berstatus &quot;Belum Diabsen&quot;.
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-[#35E6BD] font-bold">
                Semua siswa ({records.length}) telah terdata.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#11233B] text-[#172944] dark:text-[#EAF5FF] hover:bg-slate-100 dark:hover:bg-[#142C49] border border-[#E4EBF6] dark:border-[#1D3756] transition-all shadow-sm"
            >
              {isLockedLocal ? 'Tutup' : 'Batal'}
            </button>

            {!isLockedLocal && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || records.length === 0}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#1351C6] to-[#04B9E8] text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Simpan Presensi Resmi</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
