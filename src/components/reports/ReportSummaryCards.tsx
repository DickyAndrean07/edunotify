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
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm">
        <div className="flex items-center justify-between text-[#72849D] dark:text-[#91A9C6] mb-2">
          <span className="text-[11px] font-semibold">Siswa Terfilter</span>
          <Users className="w-4 h-4 text-blue-600 dark:text-[#04B9E8]" />
        </div>
        <div className="text-xl font-extrabold font-mono text-[#172944] dark:text-[#EAF5FF]">
          {summary.totalStudents}
        </div>
        <span className="text-[10px] text-[#72849D] dark:text-[#91A9C6] mt-1 block font-medium">
          {summary.totalRecords} rekaman data
        </span>
      </div>

      {/* 2. Persentase Kehadiran */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm">
        <div className="flex items-center justify-between text-[#72849D] dark:text-[#91A9C6] mb-2">
          <span className="text-[11px] font-semibold">% Kehadiran</span>
          <Percent className="w-4 h-4 text-emerald-600 dark:text-[#35E6BD]" />
        </div>
        <div className="text-xl font-extrabold font-mono text-emerald-600 dark:text-[#35E6BD]">
          {summary.attendancePercentage.toFixed(1)}%
        </div>
        <span className="text-[10px] text-[#72849D] dark:text-[#91A9C6] mt-1 block font-medium">
          Target sekolah: &ge; 90%
        </span>
      </div>

      {/* 3. Hadir */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm">
        <div className="flex items-center justify-between text-[#72849D] dark:text-[#91A9C6] mb-2">
          <span className="text-[11px] font-semibold">Hadir</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#35E6BD]" />
        </div>
        <div className="text-xl font-extrabold font-mono text-[#172944] dark:text-[#EAF5FF]">
          {summary.totalHadir}
        </div>
        <span className="text-[10px] text-emerald-600 dark:text-[#35E6BD] mt-1 block font-medium">
          Presensi tercatat hadir
        </span>
      </div>

      {/* 4. Sakit */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm">
        <div className="flex items-center justify-between text-[#72849D] dark:text-[#91A9C6] mb-2">
          <span className="text-[11px] font-semibold">Sakit</span>
          <HeartPulse className="w-4 h-4 text-blue-600 dark:text-[#04B9E8]" />
        </div>
        <div className="text-xl font-extrabold font-mono text-[#172944] dark:text-[#EAF5FF]">
          {summary.totalSakit}
        </div>
        <span className="text-[10px] text-blue-600 dark:text-[#04B9E8] mt-1 block font-medium">
          Surat dokter / izin sakit
        </span>
      </div>

      {/* 5. Izin */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm">
        <div className="flex items-center justify-between text-[#72849D] dark:text-[#91A9C6] mb-2">
          <span className="text-[11px] font-semibold">Izin</span>
          <FileText className="w-4 h-4 text-amber-600 dark:text-[#FFAA00]" />
        </div>
        <div className="text-xl font-extrabold font-mono text-[#172944] dark:text-[#EAF5FF]">
          {summary.totalIzin}
        </div>
        <span className="text-[10px] text-amber-600 dark:text-[#FFAA00] mt-1 block font-medium">
          Izin resmi terverifikasi
        </span>
      </div>

      {/* 6. Alpa */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm">
        <div className="flex items-center justify-between text-[#72849D] dark:text-[#91A9C6] mb-2">
          <span className="text-[11px] font-semibold">Alpa</span>
          <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-[#FF7087]" />
        </div>
        <div
          className={`text-xl font-extrabold font-mono ${
            summary.totalAlpa > 0 ? 'text-rose-600 dark:text-[#FF7087]' : 'text-[#172944] dark:text-[#EAF5FF]'
          }`}
        >
          {summary.totalAlpa}
        </div>
        <span className="text-[10px] text-rose-600 dark:text-[#FF7087] mt-1 block font-medium">
          {summary.totalAlpa > 0 ? 'Butuh tindak lanjut' : 'Nol alpa'}
        </span>
      </div>
    </div>
  );
}
