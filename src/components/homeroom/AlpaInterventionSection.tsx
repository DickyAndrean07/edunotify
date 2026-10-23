'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Search,
} from 'lucide-react';
import { AlpaStudentItem } from '@/app/(dashboard)/homeroom/actions';
import { AlpaStudentInterventionCard } from './AlpaStudentInterventionCard';

interface Props {
  alpaStudents: AlpaStudentItem[];
  classId: string;
  onWhatsAppClick: (recordId: string, url: string) => Promise<void>;
  onMarkContacted: (recordId: string) => Promise<void>;
  onOpenCorrectionModal: (student: AlpaStudentItem) => void;
}

export function AlpaInterventionSection({
  alpaStudents,
  classId,
  onWhatsAppClick,
  onMarkContacted,
  onOpenCorrectionModal,
}: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'UNOPENED' | 'CONTACTED'>('ALL');

  const filteredStudents = alpaStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.nis.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'UNOPENED') {
      return student.interventionStatus === 'NOT_OPENED';
    }
    if (filter === 'CONTACTED') {
      return student.interventionStatus === 'MARKED_CONTACTED';
    }
    return true;
  });

  const unopenedCount = alpaStudents.filter(
    (s) => s.interventionStatus === 'NOT_OPENED'
  ).length;
  const contactedCount = alpaStudents.filter(
    (s) => s.interventionStatus === 'MARKED_CONTACTED'
  ).length;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-[#3A2035] border border-rose-200 dark:border-rose-900/40 flex items-center justify-center text-rose-600 dark:text-[#FF7087]">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#172944] dark:text-[#EAF5FF] flex items-center gap-2">
              Tindak Lanjut Siswa Alpa (WhatsApp Click-to-Chat)
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-[#3A2035] text-rose-600 dark:text-[#FF7087] border border-rose-200 dark:border-rose-900/40">
                {alpaStudents.length} Siswa
              </span>
            </h2>
            <p className="text-xs text-[#72849D] dark:text-[#91A9C6]">
              Konfirmasi langsung kepada wali murid melalui tautan wa.me resmi tanpa bot berbayar.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        {alpaStudents.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#72849D] dark:text-[#91A9C6] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama siswa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756] text-xs text-[#172944] dark:text-[#EAF5FF] placeholder-[#94A3B8] focus:outline-none focus:border-[#1351C6] dark:focus:border-[#04B9E8] w-40 sm:w-48"
              />
            </div>

            <div className="flex items-center gap-1 bg-white dark:bg-[#071325] p-1 rounded-xl border border-[#E4EBF6] dark:border-[#1D3756]">
              <button
                type="button"
                onClick={() => setFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  filter === 'ALL'
                    ? 'bg-[#1351C6] text-white shadow-sm'
                    : 'text-[#72849D] dark:text-[#91A9C6] hover:text-[#172944] dark:hover:text-[#EAF5FF]'
                }`}
              >
                Semua ({alpaStudents.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('UNOPENED')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  filter === 'UNOPENED'
                    ? 'bg-[#1351C6] text-white shadow-sm'
                    : 'text-[#72849D] dark:text-[#91A9C6] hover:text-[#172944] dark:hover:text-[#EAF5FF]'
                }`}
              >
                Belum ({unopenedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('CONTACTED')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  filter === 'CONTACTED'
                    ? 'bg-[#1351C6] text-white shadow-sm'
                    : 'text-[#72849D] dark:text-[#91A9C6] hover:text-[#172944] dark:hover:text-[#EAF5FF]'
                }`}
              >
                Ditandai ({contactedCount})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Prominent Warning & Verification Disclaimer (DoD 4 & PRD 5.3) */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs space-y-1.5 transition-colors">
        <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Batas Verifikasi WhatsApp (Bukan Bukti Pengiriman Pesan)</span>
        </div>
        <p className="leading-relaxed text-amber-800/90 dark:text-amber-200/90 pl-6">
          Menekan tombol <strong>&ldquo;Kirim WhatsApp&rdquo;</strong> atau status <strong>&ldquo;WhatsApp Dibuka&rdquo;</strong>{' '}
          <strong className="underline text-amber-950 dark:text-amber-100">SAMA SEKALI BUKAN BUKTI</strong> bahwa pesan telah terkirim atau diterima oleh orang tua siswa. Aksi tersebut hanya mencatat bahwa pengguna telah memicu navigasi ke URL <code>wa.me</code>.
        </p>
        <p className="leading-relaxed text-amber-700 dark:text-amber-300/80 pl-6 text-[11px]">
          Sistem secara tegas tidak menampilkan status menyesatkan seperti <em>&ldquo;Pesan Terkirim&rdquo;</em>. Tekan tombol <strong>&ldquo;Tandai Sudah Dihubungi&rdquo;</strong> hanya setelah Anda secara faktual mengirim pesan di aplikasi WhatsApp Anda.
        </p>
      </div>

      {/* Alpa Student Cards or Empty State */}
      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <AlpaStudentInterventionCard
              key={student.studentId}
              student={student}
              classId={classId}
              onWhatsAppClick={onWhatsAppClick}
              onMarkContacted={onMarkContacted}
              onOpenCorrectionModal={onOpenCorrectionModal}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-white dark:bg-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] text-center flex flex-col items-center justify-center space-y-2 shadow-sm transition-colors">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-[#123D3D] border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-[#35E6BD]">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#172944] dark:text-[#EAF5FF]">
            Nihil Siswa Alpa
          </h3>
          <p className="text-xs text-[#72849D] dark:text-[#91A9C6] max-w-md">
            Tidak ada siswa yang berstatus Alpa pada tanggal yang dipilih. Seluruh siswa tercatat Hadir atau memiliki keterangan resmi (Sakit/Izin).
          </p>
        </div>
      )}
    </div>
  );
}
