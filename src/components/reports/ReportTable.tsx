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
    <div className="rounded-2xl border border-[#E4EBF6] dark:border-[#1D3756] bg-white dark:bg-[#0D2037] overflow-hidden shadow-sm transition-colors">
      {/* Tab Switcher & Search Bar */}
      <div className="p-4 border-b border-[#E4EBF6] dark:border-[#1D3756] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#071325] rounded-xl border border-[#E4EBF6] dark:border-[#1D3756] w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'summary'
                ? 'bg-white dark:bg-[#11233B] text-[#1351C6] dark:text-[#04B9E8] shadow-sm'
                : 'text-[#72849D] dark:text-[#91A9C6] hover:text-[#172944] dark:hover:text-[#EAF5FF]'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#1351C6] dark:text-[#04B9E8]" />
            <span>Rekap per Siswa ({students.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'logs'
                ? 'bg-white dark:bg-[#11233B] text-[#1351C6] dark:text-[#04B9E8] shadow-sm'
                : 'text-[#72849D] dark:text-[#91A9C6] hover:text-[#172944] dark:hover:text-[#EAF5FF]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            <span>Log Harian Rinci ({logs.length})</span>
          </button>
        </div>

        {/* Local Table Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#72849D] dark:text-[#91A9C6] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama atau NIS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756] text-xs text-[#172944] dark:text-[#EAF5FF] placeholder-[#94A3B8] focus:outline-none focus:border-[#1351C6] dark:focus:border-[#04B9E8]"
          />
        </div>
      </div>

      {/* TABLE 1: REKAP PER SISWA */}
      {activeTab === 'summary' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E4EBF6] dark:border-[#1D3756] bg-slate-50 dark:bg-[#071325]/80 text-[#72849D] dark:text-[#91A9C6] font-bold">
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
            <tbody className="divide-y divide-[#E4EBF6] dark:divide-[#1D3756]/60 font-sans">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#72849D] dark:text-[#91A9C6]">
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
                      className="hover:bg-slate-50 dark:hover:bg-[#11233B]/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-center text-[#72849D] dark:text-[#91A9C6] font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#72849D] dark:text-[#91A9C6]">
                        <div>{st.nis}</div>
                        {st.nisn && (
                          <div className="text-[10px] text-[#94A3B8]">
                            {st.nisn}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#172944] dark:text-[#EAF5FF]">
                        {st.name}
                      </td>
                      <td className="py-3 px-4 text-center text-[#72849D] dark:text-[#91A9C6]">
                        {st.gender}
                      </td>
                      <td className="py-3 px-4 text-[#172944] dark:text-[#EAF5FF]">
                        Kelas {st.className}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-emerald-600 dark:text-[#35E6BD] font-bold">
                        {st.hadir}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-blue-600 dark:text-[#04B9E8]">
                        {st.sakit}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-amber-600 dark:text-[#FFAA00]">
                        {st.izin}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        <span
                          className={
                            st.alpa > 0 ? 'text-rose-600 dark:text-[#FF7087]' : 'text-[#94A3B8]'
                          }
                        >
                          {st.alpa}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                            isLow
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-[#FF7087] border-rose-200 dark:border-rose-800'
                              : isWarn
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-[#FFAA00] border-amber-200 dark:border-amber-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-[#35E6BD] border-emerald-200 dark:border-emerald-800'
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
              <tr className="border-b border-[#E4EBF6] dark:border-[#1D3756] bg-slate-50 dark:bg-[#071325]/80 text-[#72849D] dark:text-[#91A9C6] font-bold">
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
            <tbody className="divide-y divide-[#E4EBF6] dark:divide-[#1D3756]/60 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#72849D] dark:text-[#91A9C6]">
                    Tidak ada log kehadiran pada kriteria yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => {
                  let badge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-[#071325] text-slate-500 dark:text-[#91A9C6]">
                      {log.status}
                    </span>
                  );

                  if (log.status === 'PRESENT') {
                    badge = (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-[#35E6BD] border border-emerald-200 dark:border-emerald-800 font-bold">
                        Hadir
                      </span>
                    );
                  } else if (log.status === 'SICK') {
                    badge = (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-[#04B9E8] border border-blue-200 dark:border-blue-800 font-bold">
                        Sakit
                      </span>
                    );
                  } else if (log.status === 'PERMIT') {
                    badge = (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-[#FFAA00] border border-amber-200 dark:border-amber-800 font-bold">
                        Izin
                      </span>
                    );
                  } else if (log.status === 'ABSENT_ALPA') {
                    badge = (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-[#FF7087] border border-rose-200 dark:border-rose-800 font-bold">
                        Alpa
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 dark:hover:bg-[#11233B]/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-center text-[#72849D] dark:text-[#91A9C6] font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#172944] dark:text-[#EAF5FF]">
                        {log.date}
                      </td>
                      <td className="py-3 px-4 text-[#172944] dark:text-[#EAF5FF]">
                        Kelas {log.className}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#72849D] dark:text-[#91A9C6]">
                        {log.nis}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#172944] dark:text-[#EAF5FF]">
                        {log.studentName}
                      </td>
                      <td className="py-3 px-4 text-center">{badge}</td>
                      <td className="py-3 px-4 text-[#72849D] dark:text-[#91A9C6]">
                        {log.notes || '-'}
                      </td>
                      <td className="py-3 px-4 text-[#72849D] dark:text-[#91A9C6]">
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
