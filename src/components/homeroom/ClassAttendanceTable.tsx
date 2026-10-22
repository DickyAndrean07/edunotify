'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
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
import { ATTENDANCE_STATUS_LABELS } from './types';

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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            <UserCheck className="w-3 h-3" />
            Hadir
          </span>
        );
      case 'SICK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800">
            <HeartPulse className="w-3 h-3" />
            Sakit
          </span>
        );
      case 'PERMIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-400 border border-blue-800">
            <FileText className="w-3 h-3" />
            Izin
          </span>
        );
      case 'ABSENT_ALPA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-400 border border-rose-800">
            <AlertCircle className="w-3 h-3" />
            Alpa
          </span>
        );
      case 'UNRECORDED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700">
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
          <h3 className="text-base font-bold text-neutral-100">
            Rekap Presensi Seluruh Siswa ({className})
          </h3>
          <p className="text-xs text-neutral-400">
            Daftar lengkap kehadiran dan kontrol koreksi berjenjang.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama / NIS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-700 w-44 sm:w-56"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
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
      <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4 font-semibold w-12 text-center">No</th>
                <th className="py-3 px-4 font-semibold">NIS & Nama Siswa</th>
                <th className="py-3 px-4 font-semibold">L/P</th>
                <th className="py-3 px-4 font-semibold">Kontak Orang Tua</th>
                <th className="py-3 px-4 font-semibold">Status Presensi</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, idx) => (
                  <tr
                    key={student.studentId}
                    className="hover:bg-neutral-800/40 transition"
                  >
                    <td className="py-3 px-4 text-center text-neutral-500 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-100">
                        {student.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono">
                        {student.nis}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-400">
                      {student.gender}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-neutral-300 font-medium">
                        {student.guardianName || '-'}
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5" />
                        {student.guardianPhone || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(student.status)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {student.attendanceRecordId ? (
                        <button
                          onClick={() => onOpenCorrectionModal(student)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
                        >
                          <FileEdit className="w-3 h-3 text-blue-400" />
                          <span>Koreksi</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-neutral-600 italic">
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
                    className="py-8 text-center text-neutral-500 italic"
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
