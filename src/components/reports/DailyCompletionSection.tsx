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
            <h2 className="text-lg font-bold text-neutral-100">
              Kelengkapan Presensi Harian Seluruh Kelas
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
              {date}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Monitoring pengisian presensi estafet secara waktu nyata (Waktu server: {currentTime} WIB)
          </p>
        </div>

        <Link
          href="/admin/reports"
          className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <span>Buka Rekapitulasi Laporan Lengkap</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 2. Banner Peringatan 12.00 & Uncompleted Alert */}
      {hasAlertClasses && !isHoliday && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold">
              Peringatan Operasional Presensi ({summary.alertClasses} Kelas Belum Lengkap):
            </span>
            <p className="text-amber-200/90 mt-0.5 leading-relaxed">
              {isPast12pm
                ? `Waktu telah melewati pukul 12.00 WIB. Terdapat ${summary.alertClasses} rombongan belajar yang belum menyelesaikan pengisian presensi resmi.`
                : `Terdapat kelas yang mendekati atau telah melewati jam KBM terakhir namun belum tersimpan secara resmi.`}
            </p>
          </div>
        </div>
      )}

      {/* Holiday Banner if applicable */}
      {isHoliday && (
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-3 text-blue-300 text-xs">
          <Calendar className="w-5 h-5 shrink-0 text-blue-400" />
          <span>
            Hari ini ditandai sebagai hari libur (<strong>{holidayDescription || 'Libur Sekolah'}</strong>). Seluruh kelas dibebaskan dari kewajiban presensi.
          </span>
        </div>
      )}

      {/* 3. KPI Kelengkapan Baris Ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Progress Kelengkapan */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="text-xs text-neutral-400">Tingkat Kelengkapan</div>
          <div className="text-xl font-bold font-mono text-neutral-100 mt-1 flex items-baseline gap-1.5">
            <span>{summary.completenessRate}%</span>
            <span className="text-xs font-normal text-neutral-400">
              ({summary.completedClasses}/{summary.totalClasses} Rombel)
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-neutral-800 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                summary.completenessRate === 100
                  ? 'bg-emerald-500'
                  : summary.completenessRate >= 50
                  ? 'bg-blue-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${summary.completenessRate}%` }}
            />
          </div>
        </div>

        {/* Kehadiran Hari Ini */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="text-xs text-neutral-400">Tingkat Hadir Sekolah</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {summary.attendanceRate}%
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {summary.totalPresent} dari {summary.totalStudentsEnrolled} siswa hadir
          </div>
        </div>

        {/* Kelas Belum Selesai */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="text-xs text-neutral-400">Belum Selesai</div>
          <div
            className={`text-xl font-bold font-mono mt-1 ${
              summary.uncompletedClasses > 0 ? 'text-rose-400' : 'text-neutral-300'
            }`}
          >
            {summary.uncompletedClasses} Rombel
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {summary.alertClasses} berstatus alert/eskalasi
          </div>
        </div>

        {/* Rekap Sakit/Izin/Alpa */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="text-xs text-neutral-400">Sakit / Izin / Alpa</div>
          <div className="text-xl font-bold font-mono text-neutral-200 mt-1">
            {summary.totalSick} / {summary.totalPermit} / {summary.totalAlpa}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {summary.totalAlpa > 0 ? (
              <span className="text-rose-400">{summary.totalAlpa} Alpa butuh tindak lanjut</span>
            ) : (
              'Nol siswa berstatus Alpa'
            )}
          </div>
        </div>
      </div>

      {/* 4. Tabel Kelengkapan per Kelas */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 font-semibold">
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Wali Kelas</th>
                <th className="py-3 px-4">Status Pengisian</th>
                <th className="py-3 px-4">Guru Penginput</th>
                <th className="py-3 px-4 text-center">Kehadiran (H/S/I/A)</th>
                <th className="py-3 px-4 text-right">Kelengkapan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {classes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-neutral-400">
                    Belum ada kelas yang terdaftar.
                  </td>
                </tr>
              ) : (
                classes.map((cls) => {
                  let badge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-neutral-800 text-neutral-400 border border-neutral-700">
                      Belum Diisi
                    </span>
                  );

                  if (cls.sessionStatus === 'SUBMITTED') {
                    badge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" />
                        Selesai
                        {cls.isLateSubmission && ' (Susulan)'}
                      </span>
                    );
                  } else if (cls.sessionStatus === 'UNCOMPLETED_ALERT' || cls.isAlert) {
                    badge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-fit animate-pulse">
                        <ShieldAlert className="w-3 h-3" />
                        Peringatan Belum Selesai
                      </span>
                    );
                  } else if (cls.sessionStatus === 'DRAFT') {
                    badge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit">
                        <Clock className="w-3 h-3" />
                        Draft Sedang Mengisi
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={cls.classId}
                      className={`hover:bg-neutral-800/30 transition-colors ${
                        cls.isAlert ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-semibold text-neutral-200">
                        Kelas {cls.className}
                      </td>
                      <td className="py-3 px-4 text-neutral-400">
                        {cls.homeroomTeacherName || '-'}
                      </td>
                      <td className="py-3 px-4">{badge}</td>
                      <td className="py-3 px-4 text-neutral-300">
                        {cls.submittedByTeacherName ? (
                          <div>
                            <div>{cls.submittedByTeacherName}</div>
                            {cls.submittedAt && (
                              <div className="text-[10px] text-neutral-400 font-mono">
                                {new Date(cls.submittedAt).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })} WIB
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {cls.isCompleted ? (
                          <span>
                            <span className="text-emerald-400 font-semibold">{cls.presentCount}</span>
                            {' / '}
                            <span className="text-blue-400">{cls.sickCount}</span>
                            {' / '}
                            <span className="text-amber-400">{cls.permitCount}</span>
                            {' / '}
                            <span className="text-rose-400 font-bold">{cls.alpaCount}</span>
                          </span>
                        ) : (
                          <span className="text-neutral-400">
                            {cls.unrecordedCount} Siswa Belum Diabsen
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {cls.isCompleted ? (
                          <span className="text-emerald-400 font-mono font-bold">100%</span>
                        ) : (
                          <span className="text-neutral-400 font-mono">0%</span>
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
