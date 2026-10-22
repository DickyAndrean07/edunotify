'use client';

import React, { useState } from 'react';
import {
  StudentReportSummary,
  DetailedAttendanceLog,
} from '@/services/reportService';
import { Users, FileText, Search } from 'lucide-react';

interface ReportTableProps {
  students: StudentReportSummary[];
  logs: DetailedAttendanceLog[];
}

export function ReportTable({ students, logs }: ReportTableProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'logs'>('summary');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter students based on local search
  const filteredStudents = students.filter(
    (st) =>
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.nis.includes(searchQuery) ||
      (st.nisn && st.nisn.includes(searchQuery))
  );

  // Filter logs based on local search
  const filteredLogs = logs.filter(
    (l) =>
      l.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.nis.includes(searchQuery) ||
      l.date.includes(searchQuery)
  );

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden">
      {/* Tab Switcher & Search Bar */}
      <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800/80 w-fit">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'summary'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Rekap per Siswa ({students.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'logs'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Log Harian Rinci ({logs.length})</span>
          </button>
        </div>

        {/* Local Table Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama atau NIS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
          />
        </div>
      </div>

      {/* TABLE 1: REKAP PER SISWA */}
      {activeTab === 'summary' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/40 text-neutral-400 font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">NIS / NISN</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4 text-center">L/P</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4 text-center">Hadir</th>
                <th className="py-3 px-4 text-center">Sakit</th>
                <th className="py-3 px-4 text-center">Izin</th>
                <th className="py-3 px-4 text-center">Alpa</th>
                <th className="py-3 px-4 text-right">% Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-neutral-400">
                    Tidak ada rekaman data siswa yang sesuai filter atau pencarian.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => {
                  const rate = st.attendanceRate;
                  const isLow = rate < 80;
                  const isWarn = rate < 90 && rate >= 80;

                  return (
                    <tr
                      key={st.studentId}
                      className="hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-center text-neutral-500 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-400">
                        <div>{st.nis}</div>
                        {st.nisn && (
                          <div className="text-[10px] text-neutral-600">
                            {st.nisn}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-neutral-200">
                        {st.name}
                      </td>
                      <td className="py-3 px-4 text-center text-neutral-400">
                        {st.gender}
                      </td>
                      <td className="py-3 px-4 text-neutral-300">
                        Kelas {st.className}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-emerald-400 font-semibold">
                        {st.hadir}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-blue-400">
                        {st.sakit}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-amber-400">
                        {st.izin}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        <span
                          className={
                            st.alpa > 0 ? 'text-rose-400 font-bold' : 'text-neutral-500'
                          }
                        >
                          {st.alpa}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            isLow
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : isWarn
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {rate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TABLE 2: LOG HARIAN RINCI */}
      {activeTab === 'logs' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/40 text-neutral-400 font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">NIS</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Catatan</th>
                <th className="py-3 px-4">Penginput</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-400">
                    Tidak ada log kehadiran pada kriteria yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => {
                  let badge = (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-800 text-neutral-400">
                      {log.status}
                    </span>
                  );

                  if (log.status === 'PRESENT') {
                    badge = (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        Hadir
                      </span>
                    );
                  } else if (log.status === 'SICK') {
                    badge = (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                        Sakit
                      </span>
                    );
                  } else if (log.status === 'PERMIT') {
                    badge = (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                        Izin
                      </span>
                    );
                  } else if (log.status === 'ABSENT_ALPA') {
                    badge = (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                        Alpa
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-center text-neutral-500 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-300">
                        {log.date}
                      </td>
                      <td className="py-3 px-4 text-neutral-300">
                        Kelas {log.className}
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-400">
                        {log.nis}
                      </td>
                      <td className="py-3 px-4 font-semibold text-neutral-200">
                        {log.studentName}
                      </td>
                      <td className="py-3 px-4 text-center">{badge}</td>
                      <td className="py-3 px-4 text-neutral-400">
                        {log.notes || '-'}
                      </td>
                      <td className="py-3 px-4 text-neutral-400">
                        {log.submittedByTeacherName || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
