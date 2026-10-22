'use client';

import React from 'react';
import {
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Info,
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
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-950/60 border border-rose-800/80 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
              Tindak Lanjut Siswa Alpa (WhatsApp Click-to-Chat)
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-950 text-rose-400 border border-rose-800">
                {alpaStudents.length} Siswa
              </span>
            </h2>
            <p className="text-xs text-neutral-400">
              Konfirmasi langsung kepada wali murid melalui tautan wa.me resmi tanpa bot berbayar.
            </p>
          </div>
        </div>
      </div>

      {/* Prominent Warning & Verification Disclaimer (DoD 4 & PRD 5.3) */}
      <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs space-y-1.5">
        <div className="flex items-center gap-2 font-semibold text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>Batas Verifikasi WhatsApp (Bukan Bukti Pengiriman Pesan)</span>
        </div>
        <p className="leading-relaxed text-amber-200/90 pl-6">
          Menekan tombol <strong>&ldquo;Kirim WhatsApp&rdquo;</strong> atau status <strong>&ldquo;WhatsApp Dibuka&rdquo;</strong>{' '}
          <strong className="underline text-amber-100">SAMA SEKALI BUKAN BUKTI</strong> bahwa pesan telah terkirim atau diterima oleh orang tua siswa. Aksi tersebut hanya mencatat bahwa pengguna telah memicu navigasi ke URL <code>wa.me</code>.
        </p>
        <p className="leading-relaxed text-amber-300/80 pl-6 text-[11px]">
          Sistem secara tegas tidak menampilkan status menyesatkan seperti <em>&ldquo;Pesan Terkirim&rdquo;</em>. Tekan tombol <strong>&ldquo;Tandai Sudah Dihubungi&rdquo;</strong> hanya setelah Anda secara faktual mengirim pesan di aplikasi WhatsApp Anda.
        </p>
      </div>

      {/* Alpa Student Cards or Empty State */}
      {alpaStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alpaStudents.map((student) => (
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
        <div className="p-8 rounded-xl bg-neutral-900/60 border border-neutral-800 text-center flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-200">
            Nihil Siswa Alpa
          </h3>
          <p className="text-xs text-neutral-400 max-w-md">
            Tidak ada siswa yang berstatus Alpa pada tanggal yang dipilih. Seluruh siswa tercatat Hadir atau memiliki keterangan resmi (Sakit/Izin).
          </p>
        </div>
      )}
    </div>
  );
}
