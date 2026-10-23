'use client';

import React from 'react';
import { Database, CalendarRange, Cpu, MessageSquareText, FileSpreadsheet, Users2, ShieldCheck, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export function LandingFeatures() {
  const features = [
    {
      icon: Database,
      title: 'Isolasi Multitenant Sekolah',
      desc: 'Setiap sekolah memiliki ruang data independen dengan school_id isolation tingkat query, menjamin privasi siswa dan guru terjaga secara mutlak.',
      color: '#1351C6',
      badge: 'Keamanan Data',
    },
    {
      icon: CalendarRange,
      title: 'Presensi Estafet Anti-Konflik',
      desc: 'Pengisian absensi per jam pelajaran terhubung langsung dengan jadwal dan kalender akademik aktif, mencegah bentrok antar pengajar.',
      color: '#04B9E8',
      badge: 'Alur Fleksibel',
    },
    {
      icon: Cpu,
      title: 'AI Early Warning & Empati',
      desc: 'Deteksi dini pola absensi berisiko (alpa 3 hari beruntun) dengan rekomendasi intervensi solutif bagi wali kelas dan guru bimbingan konseling.',
      color: '#35E6BD',
      badge: 'AI Care',
    },
    {
      icon: MessageSquareText,
      title: 'WhatsApp Click-to-Chat Etis',
      desc: 'Draft pesan santun dan akurat otomatis terbentuk untuk wali murid tanpa klaim pengiriman palsu, menjaga transparansi komunikasi dua arah.',
      color: '#04B9E8',
      badge: 'Kemitraan Ortu',
    },
    {
      icon: FileSpreadsheet,
      title: 'Laporan Eksekutif Excel & PDF',
      desc: 'Kepala sekolah dan dinas dapat mengunduh rekap kehadiran multi-dimensi per kelas, tingkat, atau semester dalam format resmi siap cetak.',
      color: '#1351C6',
      badge: 'Eksekutif',
    },
    {
      icon: Users2,
      title: 'Peran Terpadu RBAC (4 Peran)',
      desc: 'Hak akses presisi untuk Admin Sekolah, Guru Mata Pelajaran, Wali Kelas, dan Kepala Sekolah dengan antarmuka yang disesuaikan kebutuhan.',
      color: '#35E6BD',
      badge: 'Akses Tepat',
    },
  ];

  return (
    <section id="fitur" className="relative py-24 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1351C6]/10 dark:bg-[#04B9E8]/10 border border-[#1351C6]/20 dark:border-[#04B9E8]/30 text-[#1351C6] dark:text-[#04B9E8] text-xs font-bold uppercase tracking-wider mb-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Keunggulan Terpadu</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#172944] dark:text-white tracking-tight leading-tight mb-4">
          Dirancang untuk Kebutuhan Riil Sekolah
        </h2>

        <p className="text-base sm:text-lg text-[#72849D] dark:text-[#91A9C6] leading-relaxed">
          Bukan sekadar lembar absensi digital biasa, EduNotify menghubungkan setiap peran di institusi pendidikan dalam satu ekosistem yang teratur dan penuh empati.
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div
              key={idx}
              className="group relative p-7 rounded-3xl backdrop-blur-xl bg-white/70 dark:bg-[#0D2037]/70 border border-[#E4EBF6] dark:border-[#1D3756] hover:border-[#04B9E8]/50 shadow-lg shadow-black/5 dark:shadow-black/20 hover:shadow-xl hover:shadow-[#1351C6]/10 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Top Badge & Icon */}
                <div className="flex items-center justify-between mb-6">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${feat.color}15`, color: feat.color }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-[#F3F7FE] dark:bg-[#071325] text-[#72849D] dark:text-[#91A9C6] border border-[#E4EBF6] dark:border-[#1D3756]">
                    {feat.badge}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg sm:text-xl font-bold text-[#172944] dark:text-white tracking-tight mb-3">
                  {feat.title}
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-[#72849D] dark:text-[#91A9C6] leading-relaxed">
                  {feat.desc}
                </p>
              </div>

              {/* Bottom Subtle Link */}
              <div className="mt-6 pt-4 border-t border-[#E4EBF6] dark:border-[#1D3756] flex items-center justify-between text-xs font-semibold text-[#1351C6] dark:text-[#04B9E8] group-hover:translate-x-1 transition-transform">
                <span>Pelajari Selengkapnya</span>
                <ArrowUpRight className="w-4 h-4 opacity-70 group-hover:opacity-100" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}