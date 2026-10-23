'use client';

import React, { useState } from 'react';
import {
  Search,
  FileEdit,
  UserCheck,
  HeartPulse,
  FileText,
  AlertCircle,
  Clock,
  Phone,
} from 'lucide-react';
import { ClassStudentAttendanceItem } from '@/app/(dashboard)/homeroom/actions';
import type { AttendanceStatus } from './types';

interface Props {
  students: ClassStudentAttendanceItem[];
  className: string;
  onOpenCorrectionModal: (student: ClassStudentAttendanceItem) => void;
}

export function ClassAttendanceTable({
  students,
  className,
  onOpenCorrectionModal,
}: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.nis.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-[#123D3D] text-emerald-700 dark:text-[#45D9A7] border border-emerald-200 dark:border-transparent">
            <UserCheck className="w-3 h-3" />
            Hadir
          </span>
        );
      case 'SICK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-[#372B20] text-amber-700 dark:text-[#FFC15B] border border-amber-200 dark:border-transparent">
            <HeartPulse className="w-3 h-3" />
            Sakit
          </span>
        );
      case 'PERMIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-[#112E58] text-blue-700 dark:text-[#04B9E8] border border-blue-200 dark:border-transparent">
            <FileText className="w-3 h-3" />
            Izin
          </span>
        );
      case 'ABSENT_ALPA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-[#3A2035] text-rose-700 dark:text-[#FF7087] border border-rose-200 dark:border-transparent">
            <AlertCircle className="w-3 h-3" />
            Alpa
          </span>
        );
      case 'UNRECORDED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-[#142C49] text-slate-500 dark:text-[#91A9C6] border border-slate-200 dark:border-[#1D3756]">
            <Clock className="w-3 h-3" />
            Belum Diabsen
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Header & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#172944] dark:text-[#EAF5FF]">
            Rekap Presensi Seluruh Siswa ({className})
          </h3>
          <p className="text-xs text-[#72849D] dark:text-[#91A9C6]">
            Daftar lengkap kehadiran dan kontrol koreksi berjenjang.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#72849D] dark:text-[#91A9C6] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama / NIS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756] text-xs text-[#172944] dark:text-[#EAF5FF] placeholder-[#94A3B8] focus:outline-none focus:border-[#1351C6] dark:focus:border-[#04B9E8] w-44 sm:w-56"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756] text-xs text-[#172944] dark:text-[#EAF5FF] focus:outline-none focus:border-[#1351C6] dark:focus:border-[#04B9E8]"
          >
            <option value="ALL">Semua Status</option>
            <option value="PRESENT">Hadir</option>
            <option value="SICK">Sakit</option>
            <option value="PERMIT">Izin</option>
            <option value="ABSENT_ALPA">Alpa</option>
            <option value="UNRECORDED">Belum Diabsen</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] overflow-hidden shadow-sm transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] dark:bg-[#071325]/80 text-[#72849D] dark:text-[#91A9C6] border-b border-[#E4EBF6] dark:border-[#1D3756]">
              <tr>
                <th className="py-3 px-4 font-bold w-12 text-center">No</th>
                <th className="py-3 px-4 font-bold">NIS & Nama Siswa</th>
                <th className="py-3 px-4 font-bold">L/P</th>
                <th className="py-3 px-4 font-bold">Kontak Orang Tua</th>
                <th className="py-3 px-4 font-bold">Status Presensi</th>
                <th className="py-3 px-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EBF6] dark:divide-[#1D3756]/60">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, idx) => (
                  <tr
                    key={student.studentId}
                    className="hover:bg-slate-50 dark:hover:bg-[#11233B]/40 transition-colors"
                  >
                    <td className="py-3 px-4 text-center text-[#72849D] dark:text-[#91A9C6] font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#172944] dark:text-[#EAF5FF]">
                        {student.name}
                      </div>
                      <div className="text-[11px] text-[#72849D] dark:text-[#91A9C6] font-mono">
                        {student.nis}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#72849D] dark:text-[#91A9C6]">
                      {student.gender}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[#172944] dark:text-[#EAF5FF] font-medium">
                        {student.guardianName || '-'}
                      </div>
                      <div className="text-[11px] text-[#72849D] dark:text-[#91A9C6] font-mono flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5 text-[#25D366]" />
                        {student.guardianPhone || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(student.status)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {student.attendanceRecordId ? (
                        <button
                          type="button"
                          onClick={() => onOpenCorrectionModal(student)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-[#11233B] hover:bg-slate-50 dark:hover:bg-[#142C49] text-[#1351C6] dark:text-[#04B9E8] border border-[#E4EBF6] dark:border-[#1D3756] transition shadow-sm"
                        >
                          <FileEdit className="w-3 h-3 text-[#1351C6] dark:text-[#04B9E8]" />
                          <span>Koreksi</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#94A3B8] italic">
                          Belum ada record
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-[#72849D] dark:text-[#91A9C6] italic"
                  >
                    Tidak ada siswa yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
