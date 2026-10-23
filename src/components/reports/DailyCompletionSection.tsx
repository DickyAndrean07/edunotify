'use client';

import React from 'react';
import { AdminDailyCompletenessOverview } from '@/services/reportService';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

interface DailyCompletionSectionProps {
  overview: AdminDailyCompletenessOverview;
}

export function DailyCompletionSection({ overview }: DailyCompletionSectionProps) {
  const { summary, classes, date, isHoliday, holidayDescription, currentTime } =
    overview;

  const hasAlertClasses = summary.alertClasses > 0;
  const isPast12pm = currentTime >= '12:00';

  return (
    <div className="space-y-4">
      {/* 1. Header & Quick Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#172944] dark:text-[#EAF5FF]">
              Kelengkapan Presensi Harian Seluruh Kelas
            </h2>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#071325] text-[#1351C6] dark:text-[#04B9E8] border border-[#E4EBF6] dark:border-[#1D3756]">
              {date}
            </span>
          </div>
          <p className="text-xs text-[#72849D] dark:text-[#91A9C6] mt-0.5">
            Monitoring pengisian presensi estafet secara waktu nyata (Waktu server: {currentTime} WIB)
          </p>
        </div>

        <Link
          href="/admin/reports"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1351C6] dark:text-[#04B9E8] hover:underline transition-colors"
        >
          <span>Buka Rekapitulasi Laporan Lengkap</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 2. Banner Peringatan 12.00 & Uncompleted Alert */}
      {hasAlertClasses && !isHoliday && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-start gap-3 text-amber-900 dark:text-amber-200 shadow-sm transition-colors">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-amber-800 dark:text-amber-300">
              Peringatan Operasional Presensi ({summary.alertClasses} Kelas Belum Lengkap):
            </span>
            <p className="text-amber-800/90 dark:text-amber-200/90 mt-0.5 leading-relaxed">
              {isPast12pm
                ? `Waktu telah melewati pukul 12.00 WIB. Terdapat ${summary.alertClasses} rombongan belajar yang belum menyelesaikan pengisian presensi resmi.`
                : `Terdapat kelas yang mendekati atau telah melewati jam KBM terakhir namun belum tersimpan secara resmi.`}
            </p>
          </div>
        </div>
      )}

      {/* Holiday Banner if applicable */}
      {isHoliday && (
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 flex items-center gap-3 text-blue-900 dark:text-blue-200 text-xs shadow-sm">
          <Calendar className="w-5 h-5 shrink-0 text-blue-600 dark:text-[#04B9E8]" />
          <span>
            Hari ini ditandai sebagai hari libur (<strong>{holidayDescription || 'Libur Sekolah'}</strong>). Seluruh kelas dibebaskan dari kewajiban presensi.
          </span>
        </div>
      )}

      {/* 3. KPI Kelengkapan Baris Ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Progress Kelengkapan */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm">
          <div className="text-xs font-semibold text-[#72849D] dark:text-[#91A9C6]">Tingkat Kelengkapan</div>
          <div className="text-xl font-extrabold font-mono text-[#172944] dark:text-[#EAF5FF] mt-1 flex items-baseline gap-1.5">
            <span>{summary.completenessRate}%</span>
            <span className="text-xs font-normal text-[#72849D] dark:text-[#91A9C6]">
              ({summary.completedClasses}/{summary.totalClasses} Rombel)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#071325] mt-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                summary.completenessRate === 100
                  ? 'bg-[#35E6BD]'
                  : summary.completenessRate >= 50
                  ? 'bg-[#1351C6]'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${summary.completenessRate}%` }}
            />
          </div>
        </div>

        {/* Kehadiran Hari Ini */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm">
          <div className="text-xs font-semibold text-[#72849D] dark:text-[#91A9C6]">Tingkat Hadir Sekolah</div>
          <div className="text-xl font-extrabold font-mono text-emerald-600 dark:text-[#35E6BD] mt-1">
            {summary.attendanceRate}%
          </div>
          <div className="text-[11px] text-[#72849D] dark:text-[#91A9C6] mt-1 font-medium">
            {summary.totalPresent} dari {summary.totalStudentsEnrolled} siswa hadir
          </div>
        </div>

        {/* Kelas Belum Selesai */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm">
          <div className="text-xs font-semibold text-[#72849D] dark:text-[#91A9C6]">Belum Selesai</div>
          <div
            className={`text-xl font-extrabold font-mono mt-1 ${
              summary.uncompletedClasses > 0 ? 'text-rose-600 dark:text-[#FF7087]' : 'text-[#172944] dark:text-[#EAF5FF]'
            }`}
          >
            {summary.uncompletedClasses} Rombel
          </div>
          <div className="text-[11px] text-[#72849D] dark:text-[#91A9C6] mt-1 font-medium">
            {summary.alertClasses} berstatus alert/eskalasi
          </div>
        </div>

        {/* Rekap Sakit/Izin/Alpa */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm">
          <div className="text-xs font-semibold text-[#72849D] dark:text-[#91A9C6]">Sakit / Izin / Alpa</div>
          <div className="text-xl font-extrabold font-mono text-[#172944] dark:text-[#EAF5FF] mt-1">
            {summary.totalSick} / {summary.totalPermit} / {summary.totalAlpa}
          </div>
          <div className="text-[11px] text-[#72849D] dark:text-[#91A9C6] mt-1 font-medium">
            {summary.totalAlpa > 0 ? (
              <span className="text-rose-600 dark:text-[#FF7087] font-bold">{summary.totalAlpa} Alpa butuh tindak lanjut</span>
            ) : (
              'Nol siswa berstatus Alpa'
            )}
          </div>
        </div>
      </div>

      {/* 4. Tabel Kelengkapan per Kelas */}
      <div className="rounded-2xl border border-[#E4EBF6] dark:border-[#1D3756] bg-white dark:bg-[#0D2037] overflow-hidden shadow-sm transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E4EBF6] dark:border-[#1D3756] bg-slate-50 dark:bg-[#071325]/80 text-[#72849D] dark:text-[#91A9C6] font-bold">
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Wali Kelas</th>
                <th className="py-3 px-4">Status Pengisian</th>
                <th className="py-3 px-4">Guru Penginput</th>
                <th className="py-3 px-4 text-center">Kehadiran (H/S/I/A)</th>
                <th className="py-3 px-4 text-right">Kelengkapan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EBF6] dark:divide-[#1D3756]/60">
              {classes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#72849D] dark:text-[#91A9C6]">
                    Belum ada kelas yang terdaftar.
                  </td>
                </tr>
              ) : (
                classes.map((cls) => {
                  let badge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-[#071325] text-slate-500 dark:text-[#91A9C6] border border-slate-200 dark:border-[#1D3756]">
                      Belum Diisi
                    </span>
                  );

                  if (cls.sessionStatus === 'SUBMITTED') {
                    badge = (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-[#35E6BD] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" />
                        Selesai
                        {cls.isLateSubmission && ' (Susulan)'}
                      </span>
                    );
                  } else if (cls.sessionStatus === 'UNCOMPLETED_ALERT' || cls.isAlert) {
                    badge = (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-[#FF7087] border border-rose-200 dark:border-rose-800 flex items-center gap-1 w-fit animate-pulse">
                        <ShieldAlert className="w-3 h-3" />
                        Peringatan Belum Selesai
                      </span>
                    );
                  } else if (cls.sessionStatus === 'DRAFT') {
                    badge = (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-[#FFAA00] border border-amber-200 dark:border-amber-800 flex items-center gap-1 w-fit">
                        <Clock className="w-3 h-3" />
                        Draft Sedang Mengisi
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={cls.classId}
                      className={`hover:bg-slate-50 dark:hover:bg-[#11233B]/40 transition-colors ${
                        cls.isAlert ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-[#172944] dark:text-[#EAF5FF]">
                        Kelas {cls.className}
                      </td>
                      <td className="py-3 px-4 text-[#72849D] dark:text-[#91A9C6]">
                        {cls.homeroomTeacherName || '-'}
                      </td>
                      <td className="py-3 px-4">{badge}</td>
                      <td className="py-3 px-4 text-[#172944] dark:text-[#EAF5FF]">
                        {cls.submittedByTeacherName ? (
                          <div>
                            <div className="font-semibold">{cls.submittedByTeacherName}</div>
                            {cls.submittedAt && (
                              <div className="text-[10px] text-[#72849D] dark:text-[#91A9C6] font-mono">
                                {new Date(cls.submittedAt).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })} WIB
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#94A3B8]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {cls.isCompleted ? (
                          <span>
                            <span className="text-emerald-600 dark:text-[#35E6BD] font-bold">{cls.presentCount}</span>
                            {' / '}
                            <span className="text-blue-600 dark:text-[#04B9E8]">{cls.sickCount}</span>
                            {' / '}
                            <span className="text-amber-600 dark:text-[#FFAA00]">{cls.permitCount}</span>
                            {' / '}
                            <span className="text-rose-600 dark:text-[#FF7087] font-bold">{cls.alpaCount}</span>
                          </span>
                        ) : (
                          <span className="text-[#72849D] dark:text-[#91A9C6]">
                            {cls.unrecordedCount} Siswa Belum Diabsen
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {cls.isCompleted ? (
                          <span className="text-emerald-600 dark:text-[#35E6BD] font-mono font-bold">100%</span>
                        ) : (
                          <span className="text-[#72849D] dark:text-[#91A9C6] font-mono">0%</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
