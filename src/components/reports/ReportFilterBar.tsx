'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, Calendar, Users, DoorOpen, Activity, RotateCcw } from 'lucide-react';

interface ReportFilterBarProps {
  initialStartDate: string;
  initialEndDate: string;
  initialClassId?: string;
  initialStudentId?: string;
  initialStatus?: string;
  availableClasses: Array<{ id: string; name: string }>;
  availableStudents: Array<{ id: string; name: string; classId?: string }>;
}

export function ReportFilterBar({
  initialStartDate,
  initialEndDate,
  initialClassId = '',
  initialStudentId = '',
  initialStatus = '',
  availableClasses,
  availableStudents,
}: ReportFilterBarProps) {
  const router = useRouter();

  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [classId, setClassId] = useState(initialClassId);
  const [studentId, setStudentId] = useState(initialStudentId);
  const [status, setStatus] = useState(initialStatus);
  const [dateError, setDateError] = useState<string | null>(null);

  // Filter students by selected class if classId is selected
  const filteredStudents = classId
    ? availableStudents.filter((s) => !s.classId || s.classId === classId)
    : availableStudents;

  function handleApplyFilter(e: React.FormEvent) {
    e.preventDefault();
    setDateError(null);

    // Validate date
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setDateError('Tanggal tidak valid.');
      return;
    }

    if (start > end) {
      setDateError('Tanggal mulai tidak boleh melebihi tanggal akhir.');
      return;
    }

    const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays > 366) {
      setDateError('Rentang tanggal maksimal 1 tahun ajaran (366 hari).');
      return;
    }

    const params = new URLSearchParams();
    params.set('startDate', startDate);
    params.set('endDate', endDate);
    if (classId) params.set('classId', classId);
    if (studentId) params.set('studentId', studentId);
    if (status) params.set('status', status);

    router.push(`?${params.toString()}`);
  }

  function handleReset() {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0];

    setStartDate(firstDayOfMonth);
    setEndDate(today);
    setClassId('');
    setStudentId('');
    setStatus('');
    setDateError(null);

    router.push(`?startDate=${firstDayOfMonth}&endDate=${today}`);
  }

  return (
    <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
            Filter Multi-Dimensi Presensi
          </h3>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Filter</span>
        </button>
      </div>

      <form onSubmit={handleApplyFilter} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-neutral-500" />
              <span>Tanggal Mulai</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-neutral-500" />
              <span>Tanggal Akhir</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          {/* Kelas */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
              <DoorOpen className="w-3 h-3 text-neutral-500" />
              <span>Kelas / Rombel</span>
            </label>
            <select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setStudentId(''); // Reset student when class changes
              }}
              className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Semua Kelas</option>
              {availableClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  Kelas {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Siswa */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
              <Users className="w-3 h-3 text-neutral-500" />
              <span>Siswa Spesifik</span>
            </label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Semua Siswa</option>
              {filteredStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Kehadiran */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
              <Activity className="w-3 h-3 text-neutral-500" />
              <span>Status Kehadiran</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Semua Status</option>
              <option value="PRESENT">Hadir</option>
              <option value="SICK">Sakit</option>
              <option value="PERMIT">Izin</option>
              <option value="ABSENT_ALPA">Alpa</option>
            </select>
          </div>
        </div>

        {/* Date error alert */}
        {dateError && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {dateError}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            Terapkan Filter
          </button>
        </div>
      </form>
    </div>
  );
}
