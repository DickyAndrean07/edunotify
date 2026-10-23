'use client';

import React from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Presensi Resmi Tersimpan
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Sedang Berjalan (Draft)
          </span>
        );
      case 'UNCOMPLETED_ALERT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Eskalasi: Belum Selesai
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-[#11233B] text-slate-600 dark:text-[#91A9C6] border border-slate-200 dark:border-[#1D3756]">
            Belum Diabsen
          </span>
        );
    }
  };

  const presentPercentage =
    overview.totalStudents > 0
      ? Math.round((overview.presentCount / overview.totalStudents) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Warning Banner if 12:00 passed and not submitted */}
      {overview.isWarning12pm && !overview.isSubmitted && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-start gap-3 transition-colors">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold text-amber-800 dark:text-amber-300">
              Peringatan Presensi Pukul 12.00:{' '}
            </span>
            <span className="text-amber-700 dark:text-amber-200">
              Kelas {className} belum memiliki presensi berstatus tersimpan resmi hingga pukul 12.00 waktu sekolah. Harap segera tindak lanjuti pengisian bersama guru pengampu.
            </span>
          </div>
        </div>
      )}

      {/* Uncompleted Escalation Alert */}
      {overview.isUncompletedAlert && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex items-start gap-3 transition-colors">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold text-rose-800 dark:text-rose-300">
              Eskalasi Akhir Hari:{' '}
            </span>
            <span className="text-rose-700 dark:text-rose-200">
              Jam KBM untuk hari ini telah selesai, namun presensi kelas {className} belum tersimpan lengkap. Wali Kelas atau guru pengampu dapat melakukan pengisian susulan (late submission).
            </span>
          </div>
        </div>
      )}

      {/* Grid of Stats with Soft Gradients & Rounded Modern Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Students */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm hover:border-[#CBD8EA] dark:hover:border-[#2D4E75] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#72849D] dark:text-[#91A9C6]">
              Total Siswa
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#142C49] flex items-center justify-center text-slate-500 dark:text-[#91A9C6]">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#172944] dark:text-[#EAF5FF] mt-2 tracking-tight">
            {overview.totalStudents}
          </div>
          <div className="text-[11px] text-[#72849D] dark:text-[#91A9C6] mt-1 font-medium">
            Siswa terdaftar
          </div>
        </div>

        {/* Hadir */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-emerald-100 dark:border-emerald-950/50 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800/60 transition-all bg-gradient-to-br from-emerald-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-[#35E6BD]">
              Hadir
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-[#123D3D] flex items-center justify-center text-emerald-600 dark:text-[#35E6BD]">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-[#35E6BD] mt-2 tracking-tight">
            {overview.presentCount}
          </div>
          <div className="text-[11px] text-emerald-700/80 dark:text-[#35E6BD]/80 mt-1 font-medium">
            {presentPercentage}% kehadiran
          </div>
        </div>

        {/* Sakit */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-amber-100 dark:border-amber-950/50 shadow-sm hover:border-amber-300 dark:hover:border-amber-800/60 transition-all bg-gradient-to-br from-amber-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-[#FFAA00]">
              Sakit
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-[#372B20] flex items-center justify-center text-amber-600 dark:text-[#FFAA00]">
              <HeartPulse className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-[#FFAA00] mt-2 tracking-tight">
            {overview.sickCount}
          </div>
          <div className="text-[11px] text-amber-700/80 dark:text-[#FFAA00]/80 mt-1 font-medium">
            Surat dokter
          </div>
        </div>

        {/* Izin */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-blue-100 dark:border-blue-950/50 shadow-sm hover:border-blue-300 dark:hover:border-blue-800/60 transition-all bg-gradient-to-br from-blue-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 dark:text-[#04B9E8]">
              Izin
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-[#112E58] flex items-center justify-center text-blue-600 dark:text-[#04B9E8]">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-[#04B9E8] mt-2 tracking-tight">
            {overview.permitCount}
          </div>
          <div className="text-[11px] text-blue-700/80 dark:text-[#04B9E8]/80 mt-1 font-medium">
            Dispensasi resmi
          </div>
        </div>

        {/* Alpa */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-rose-200 dark:border-rose-900/60 shadow-sm hover:border-rose-300 dark:hover:border-rose-800 transition-all bg-gradient-to-br from-rose-500/10 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-[#FF7087]">
              Alpa
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-[#3A2035] flex items-center justify-center text-rose-600 dark:text-[#FF7087]">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-[#FF7087] mt-2 tracking-tight">
            {overview.alpaCount}
          </div>
          <div className="text-[11px] text-rose-700/80 dark:text-[#FF7087]/80 mt-1 font-medium">
            {overview.alpaCount > 0 ? 'Perlu tindak lanjut' : 'Nihil Alpa'}
          </div>
        </div>

        {/* Belum Diabsen */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm hover:border-[#CBD8EA] dark:hover:border-[#2D4E75] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#72849D] dark:text-[#91A9C6]">
              Belum Diabsen
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#142C49] flex items-center justify-center text-slate-500 dark:text-[#91A9C6]">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#172944] dark:text-[#EAF5FF] mt-2 tracking-tight">
            {overview.unrecordedCount}
          </div>
          <div className="text-[11px] text-[#72849D] dark:text-[#91A9C6] mt-1 font-medium">
            Menunggu KBM
          </div>
        </div>
      </div>

      {/* Session status info strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] text-xs transition-colors shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-[#72849D] dark:text-[#91A9C6]">
            Status Sesi Hari Ini:
          </span>
          {getStatusBadge()}
        </div>

        {overview.submittedBy && (
          <div className="text-[#72849D] dark:text-[#91A9C6]">
            Disimpan oleh:{' '}
            <span className="font-bold text-[#172944] dark:text-[#EAF5FF]">
              {overview.submittedBy.name}
            </span>
            {overview.submittedAt && (
              <span className="text-[#72849D] dark:text-[#91A9C6] ml-1">
                ({new Date(overview.submittedAt).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })})
              </span>
            )}
            {overview.isLateSubmission && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 font-bold">
                Susulan (Late)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
