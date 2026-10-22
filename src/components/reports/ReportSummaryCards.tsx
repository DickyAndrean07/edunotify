'use client';

import React from 'react';
import {
  Users,
  CheckCircle2,
  HeartPulse,
  FileText,
  AlertOctagon,
  Percent,
} from 'lucide-react';

interface ReportSummaryCardsProps {
  summary: {
    totalRecords: number;
    totalStudents: number;
    totalHadir: number;
    totalSakit: number;
    totalIzin: number;
    totalAlpa: number;
    attendancePercentage: number;
  };
}

export function ReportSummaryCards({ summary }: ReportSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Total Siswa */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-[11px] font-medium">Siswa Terfilter</span>
          <Users className="w-4 h-4 text-blue-400" />
        </div>
        <div className="text-xl font-bold font-mono text-neutral-100">
          {summary.totalStudents}
        </div>
        <span className="text-[10px] text-neutral-500 mt-1 block">
          {summary.totalRecords} rekaman data
        </span>
      </div>

      {/* 2. Persentase Kehadiran */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-[11px] font-medium">% Kehadiran</span>
          <Percent className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-xl font-bold font-mono text-emerald-400">
          {summary.attendancePercentage.toFixed(1)}%
        </div>
        <span className="text-[10px] text-neutral-500 mt-1 block">
          Target sekolah: &ge; 90%
        </span>
      </div>

      {/* 3. Hadir */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-[11px] font-medium">Hadir</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-xl font-bold font-mono text-neutral-100">
          {summary.totalHadir}
        </div>
        <span className="text-[10px] text-emerald-500/80 mt-1 block">
          Presensi tercatat hadir
        </span>
      </div>

      {/* 4. Sakit */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-[11px] font-medium">Sakit</span>
          <HeartPulse className="w-4 h-4 text-blue-400" />
        </div>
        <div className="text-xl font-bold font-mono text-neutral-100">
          {summary.totalSakit}
        </div>
        <span className="text-[10px] text-blue-400/80 mt-1 block">
          Surat izin / konfirmasi sakit
        </span>
      </div>

      {/* 5. Izin */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-[11px] font-medium">Izin</span>
          <FileText className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-xl font-bold font-mono text-neutral-100">
          {summary.totalIzin}
        </div>
        <span className="text-[10px] text-amber-400/80 mt-1 block">
          Izin resmi terverifikasi
        </span>
      </div>

      {/* 6. Alpa */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-[11px] font-medium">Alpa</span>
          <AlertOctagon className="w-4 h-4 text-rose-400" />
        </div>
        <div
          className={`text-xl font-bold font-mono ${
            summary.totalAlpa > 0 ? 'text-rose-400' : 'text-neutral-100'
          }`}
        >
          {summary.totalAlpa}
        </div>
        <span className="text-[10px] text-rose-400/80 mt-1 block">
          {summary.totalAlpa > 0 ? 'Butuh tindak lanjut' : 'Nol alpa'}
        </span>
      </div>
    </div>
  );
}
