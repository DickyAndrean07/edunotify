'use client';

import React from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  FileCheck,
  HeartPulse,
  UserCheck,
  FileText,
} from 'lucide-react';
import type { ClassAttendanceOverview } from '@/services/attendanceService';

interface Props {
  overview: ClassAttendanceOverview;
  className: string;
}

export function AttendanceSummaryCards({ overview, className }: Props) {
  const getStatusBadge = () => {
    switch (overview.sessionStatus) {
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Presensi Resmi Tersimpan
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800">
            <Clock className="w-3.5 h-3.5" />
            Sedang Berjalan (Draft)
          </span>
        );
      case 'UNCOMPLETED_ALERT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-400 border border-rose-800">
            <AlertCircle className="w-3.5 h-3.5" />
            Eskalasi: Belum Selesai
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
            Belum Diabsen
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Warning Banner if 12:00 passed and not submitted */}
      {overview.isWarning12pm && !overview.isSubmitted && (
        <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-800/80 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold text-amber-300">
              Peringatan Presensi Pukul 12.00:{' '}
            </span>
            <span className="text-amber-200">
              Kelas {className} belum memiliki presensi berstatus tersimpan resmi hingga pukul 12.00 waktu sekolah. Harap segera tindak lanjuti pengisian bersama guru pengampu.
            </span>
          </div>
        </div>
      )}

      {/* Uncompleted Escalation Alert */}
      {overview.isUncompletedAlert && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold text-rose-300">
              Eskalasi Akhir Hari:{' '}
            </span>
            <span className="text-rose-200">
              Jam KBM untuk hari ini telah selesai, namun presensi kelas {className} belum tersimpan lengkap. Wali Kelas atau guru pengampu dapat melakukan pengisian susulan (late submission).
            </span>
          </div>
        </div>
      )}

      {/* Grid of Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Students */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Total Siswa</span>
            <Users className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold text-neutral-100 mt-2">
            {overview.totalStudents}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Siswa terdaftar</div>
        </div>

        {/* Hadir */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-400">Hadir</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300 mt-2">
            {overview.presentCount}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            {overview.totalStudents > 0
              ? `${Math.round((overview.presentCount / overview.totalStudents) * 100)}% kehadiran`
              : '0%'}
          </div>
        </div>

        {/* Sakit */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-400">Sakit</span>
            <HeartPulse className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 mt-2">
            {overview.sickCount}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Surat / keterangan</div>
        </div>

        {/* Izin */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-400">Izin</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-300 mt-2">
            {overview.permitCount}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Dispensasi / izin</div>
        </div>

        {/* Alpa */}
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400">Alpa</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2">
            {overview.alpaCount}
          </div>
          <div className="text-[11px] text-rose-300/80 mt-1">
            {overview.alpaCount > 0 ? 'Perlu tindak lanjut WA' : 'Nihil Alpa'}
          </div>
        </div>

        {/* Belum Diabsen */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Belum Diabsen</span>
            <Clock className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-300 mt-2">
            {overview.unrecordedCount}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Menunggu sesi KBM</div>
        </div>
      </div>

      {/* Session status info strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-neutral-900/70 border border-neutral-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-neutral-400">Status Sesi Hari Ini:</span>
          {getStatusBadge()}
        </div>

        {overview.submittedBy && (
          <div className="text-neutral-400">
            Disimpan oleh:{' '}
            <span className="font-medium text-neutral-200">
              {overview.submittedBy.name}
            </span>
            {overview.submittedAt && (
              <span className="text-neutral-500 ml-1">
                ({new Date(overview.submittedAt).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })})
              </span>
            )}
            {overview.isLateSubmission && (
              <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-400 border border-amber-800 font-semibold">
                Susulan (Late)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
