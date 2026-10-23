'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  Activity,
  Clock,
  AlertTriangle,
  Users,
  Sparkles,
} from 'lucide-react';

export function LandingHero() {
  const [activeTab, setActiveTab] = useState<'presensi' | 'ews'>('presensi');

  return (
    <section className="relative min-h-[94vh] pt-32 pb-20 flex flex-col justify-center overflow-hidden">
      {/* Background Hero Image with Soft Gradient Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <Image
          src="/images/landing/hero-bg-modern.jpg"
          alt="Gedung Sekolah Modern EduNotify"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-25 dark:opacity-35 transition-transform duration-1000 scale-105"
        />
        {/* Soft Multi-Layer Gradient Overlays for High Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F3F7FE]/95 via-[#F3F7FE]/80 to-[#F3F7FE] dark:from-[#071325]/95 dark:via-[#071325]/85 dark:to-[#071325]" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-[#F3F7FE]/50 to-[#F3F7FE] dark:via-transparent dark:to-[#071325]" />

        {/* Ambient Subtle Accent Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[360px] bg-[#04B9E8]/10 dark:bg-[#04B9E8]/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 w-full flex flex-col items-center">
        {/* Top Tag Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md bg-white/80 dark:bg-[#0D2037]/80 border border-[#04B9E8]/30 dark:border-[#04B9E8]/40 shadow-sm mb-6">
          <Sparkles className="w-4 h-4 text-[#04B9E8]" />
          <span className="text-xs sm:text-sm font-semibold tracking-wide text-[#1351C6] dark:text-[#04B9E8]">
            Platform Presensi Terpadu & Early Warning Multitenant
          </span>
        </div>

        {/* Headline: Clean Inter Font, Cyan Italic Accent without Underline, No Period */}
        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-center text-[#172944] dark:text-white max-w-4xl leading-[1.15] mb-6 text-balance font-sans">
          Presensi Estafet &{' '}
          <span className="italic text-[#04B9E8]">
            Deteksi Dini Siswa
          </span>{' '}
          Berbasis AI Cerdas
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-center text-[#334661] dark:text-[#91A9C6] max-w-2xl leading-relaxed mb-8">
          Transformasi alur absensi guru mata pelajaran tanpa bentrok jadwal.
          Sistem otomatis merekonsiliasi presensi dan memicu Early Warning System dengan komunikasi etis langsung ke wali murid.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto mb-14">
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-bold text-white px-7 py-3.5 rounded-full bg-gradient-to-r from-[#1351C6] via-[#1048b3] to-[#04B9E8] hover:from-[#0f43a6] hover:to-[#039ec7] shadow-lg shadow-[#1351C6]/30 hover:shadow-[#04B9E8]/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <span>Masuk Dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <a
            href="#scrollytelling"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-semibold text-[#172944] dark:text-[#EAF5FF] px-6 py-3.5 rounded-full bg-white dark:bg-[#0D2037] border border-[#CBD8EA] dark:border-[#1D3756] hover:border-[#04B9E8] dark:hover:border-[#04B9E8]/50 shadow-sm transition-all duration-200"
          >
            <span>Pelajari Alur 3 Langkah</span>
            <ChevronDown className="w-4 h-4 text-[#04B9E8]" />
          </a>
        </div>

        {/* Floating Glass Showcase Card: Pure React/Tailwind Web Component Mockup (Zero AI Slop) */}
        <div className="relative w-full max-w-4xl mx-auto group">
          <div className="relative rounded-3xl backdrop-blur-xl bg-white/80 dark:bg-[#0D2037]/90 border border-[#E4EBF6] dark:border-[#1D3756] p-4 sm:p-7 shadow-2xl shadow-[#1351C6]/10 dark:shadow-black/50 transition-all duration-300 hover:border-[#04B9E8]/50">
            {/* Mockup Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#E4EBF6] dark:border-[#1D3756] gap-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#35E6BD] shadow-[0_0_8px_#35E6BD]" />
                <div>
                  <div className="text-xs font-bold text-[#172944] dark:text-white flex items-center gap-2">
                    <span>SMA Negeri 1 EduNotify</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1351C6]/10 dark:bg-[#04B9E8]/10 text-[#1351C6] dark:text-[#04B9E8] font-semibold">
                      Kelas XII MIPA 1
                    </span>
                  </div>
                  <div className="text-[11px] text-[#72849D] dark:text-[#91A9C6]">
                    Sesi Aktif: Jam Ke-2 (07:45 - 08:30 WIB) &bull; Pengajar: Ibu Siti Rahma, M.Pd
                  </div>
                </div>
              </div>

              {/* View Switcher Pills */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F3F7FE] dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756] self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('presensi')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    activeTab === 'presensi'
                      ? 'bg-[#1351C6] text-white shadow-sm'
                      : 'text-[#72849D] dark:text-[#91A9C6] hover:text-[#172944] dark:hover:text-white'
                  }`}
                >
                  Presensi Estafet
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ews')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'ews'
                      ? 'bg-[#04B9E8] text-[#071325] shadow-sm'
                      : 'text-[#72849D] dark:text-[#91A9C6] hover:text-[#172944] dark:hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 text-[#FF4D4F]" />
                  <span>Early Warning (2)</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar inside Mockup */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-[#F3F7FE]/70 dark:bg-[#071325]/70 border border-[#E4EBF6] dark:border-[#1D3756]">
                <div className="text-[10px] font-medium text-[#72849D] dark:text-[#91A9C6]">Hadir Hari Ini</div>
                <div className="text-sm sm:text-base font-bold text-[#1351C6] dark:text-[#04B9E8]">34 / 36 Siswa (94.4%)</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F3F7FE]/70 dark:bg-[#071325]/70 border border-[#E4EBF6] dark:border-[#1D3756]">
                <div className="text-[10px] font-medium text-[#72849D] dark:text-[#91A9C6]">Izin & Sakit</div>
                <div className="text-sm sm:text-base font-bold text-[#FFAA00]">1 Siswa (Surat Ada)</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F3F7FE]/70 dark:bg-[#071325]/70 border border-[#E4EBF6] dark:border-[#1D3756]">
                <div className="text-[10px] font-medium text-[#72849D] dark:text-[#91A9C6]">Alpa Jam Berjalan</div>
                <div className="text-sm sm:text-base font-bold text-[#FF4D4F]">1 Siswa Terdeteksi</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F3F7FE]/70 dark:bg-[#071325]/70 border border-[#E4EBF6] dark:border-[#1D3756]">
                <div className="text-[10px] font-medium text-[#72849D] dark:text-[#91A9C6]">Status Estafet</div>
                <div className="text-sm sm:text-base font-bold text-[#35E6BD] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>100% Sinkron</span>
                </div>
              </div>
            </div>

            {/* Dynamic Content: Presensi Table or EWS List */}
            {activeTab === 'presensi' ? (
              <div className="overflow-x-auto rounded-2xl border border-[#E4EBF6] dark:border-[#1D3756] bg-white/90 dark:bg-[#071325]/90">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F3F7FE] dark:bg-[#0D2037] text-[#72849D] dark:text-[#91A9C6] font-semibold border-b border-[#E4EBF6] dark:border-[#1D3756]">
                    <tr>
                      <th className="p-3">Siswa</th>
                      <th className="p-3 hidden sm:table-cell">Jam 1 (07:00-07:45)</th>
                      <th className="p-3">Jam 2 (Aktif: Fisika)</th>
                      <th className="p-3">Rekonsiliasi Estafet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4EBF6] dark:divide-[#1D3756] text-[#172944] dark:text-[#EAF5FF]">
                    <tr className="hover:bg-[#F3F7FE]/50 dark:hover:bg-[#0D2037]/50 transition-colors">
                      <td className="p-3 font-medium">
                        <div>Ahmad Fauzi</div>
                        <div className="text-[10px] text-[#72849D] dark:text-[#91A9C6]">NIS: 202401</div>
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        <span className="px-2 py-0.5 rounded-md bg-[#35E6BD]/15 text-[#0F8266] dark:text-[#35E6BD] font-semibold text-[11px]">
                          Hadir (Pak Hendra)
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-[#35E6BD]/15 text-[#0F8266] dark:text-[#35E6BD] font-semibold text-[11px]">
                          Hadir
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-[11px] text-[#35E6BD] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Terestafet Mulus
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#F3F7FE]/50 dark:hover:bg-[#0D2037]/50 transition-colors">
                      <td className="p-3 font-medium">
                        <div>Citra Dewi</div>
                        <div className="text-[10px] text-[#72849D] dark:text-[#91A9C6]">NIS: 202402</div>
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        <span className="px-2 py-0.5 rounded-md bg-[#FFAA00]/15 text-[#B27200] dark:text-[#FFAA00] font-semibold text-[11px]">
                          Izin Sakit
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-[#FFAA00]/15 text-[#B27200] dark:text-[#FFAA00] font-semibold text-[11px]">
                          Izin (Otomatis)
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-[11px] text-[#FFAA00] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Surat Dokter Valid
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#F3F7FE]/50 dark:hover:bg-[#0D2037]/50 transition-colors bg-[#FF4D4F]/5">
                      <td className="p-3 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span>Farhan Maulana</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D4F]" />
                        </div>
                        <div className="text-[10px] text-[#FF4D4F]">Peringatan EWS</div>
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        <span className="px-2 py-0.5 rounded-md bg-[#FF4D4F]/15 text-[#D62828] dark:text-[#FF4D4F] font-semibold text-[11px]">
                          Alpa (Tanpa Berita)
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-[#FF4D4F]/15 text-[#D62828] dark:text-[#FF4D4F] font-semibold text-[11px]">
                          Alpa (Dikonfirmasi)
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-[11px] text-[#FF4D4F] font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Picu Notifikasi WA
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-2.5 rounded-2xl border border-[#E4EBF6] dark:border-[#1D3756] p-3.5 bg-white/90 dark:bg-[#071325]/90">
                <div className="p-3 rounded-xl bg-[#FF4D4F]/10 border border-[#FF4D4F]/25 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#FF4D4F]">Farhan Maulana (XII MIPA 1)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF4D4F] text-white font-semibold">
                        Risiko Tinggi
                      </span>
                    </div>
                    <p className="text-[11px] text-[#72849D] dark:text-[#91A9C6] mt-1">
                      Pola: Alpa 3 hari berturut-turut pada jam pertama & kedua. AI menganalisis risiko putus sekolah dini.
                    </p>
                    <div className="text-[11px] font-semibold text-[#172944] dark:text-white mt-1.5 bg-white/50 dark:bg-[#0D2037]/60 p-2 rounded-lg">
                      Rekomendasi Solutif AI: &ldquo;Lakukan verifikasi ramah ke nomor wali murid mengenai kesehatan dan kondisi tempat tinggal tanpa pendekatan punitif.&rdquo;
                    </div>
                  </div>
                  <Link
                    href="/login"
                    className="shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#25D366] text-white hover:bg-[#20bd5a] transition-colors"
                  >
                    Kirim WA
                  </Link>
                </div>
              </div>
            )}

            {/* Bottom Status Banner inside Mockup */}
            <div className="mt-4 pt-3 border-t border-[#E4EBF6] dark:border-[#1D3756] flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#72849D] dark:text-[#91A9C6] gap-2">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-[#35E6BD]" />
                <span>Mesin Rekonsiliasi Otomatis Aktif (Zero Conflict Schedule)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#1351C6] dark:text-[#04B9E8] font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[#35E6BD]" />
                <span>Privasi Data Multitenant Terenkripsi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Micro Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full max-w-4xl mt-12 pt-8 border-t border-[#E4EBF6] dark:border-[#1D3756]">
          <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/40 dark:bg-[#0D2037]/40 border border-[#E4EBF6]/60 dark:border-[#1D3756]/60">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1351C6] dark:text-[#04B9E8] tracking-tight">
              100%
            </span>
            <span className="text-xs font-medium text-[#72849D] dark:text-[#91A9C6] mt-0.5">
              Presensi Terekonsiliasi
            </span>
          </div>

          <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/40 dark:bg-[#0D2037]/40 border border-[#E4EBF6]/60 dark:border-[#1D3756]/60">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#35E6BD] tracking-tight">
              &lt; 3 Detik
            </span>
            <span className="text-xs font-medium text-[#72849D] dark:text-[#91A9C6] mt-0.5">
              Deteksi Alpa Dini
            </span>
          </div>

          <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/40 dark:bg-[#0D2037]/40 border border-[#E4EBF6]/60 dark:border-[#1D3756]/60">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#172944] dark:text-white tracking-tight">
              Query-Level
            </span>
            <span className="text-xs font-medium text-[#72849D] dark:text-[#91A9C6] mt-0.5">
              Isolasi Multitenant Sekolah
            </span>
          </div>

          <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/40 dark:bg-[#0D2037]/40 border border-[#E4EBF6]/60 dark:border-[#1D3756]/60">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#04B9E8] tracking-tight">
              4 Peran
            </span>
            <span className="text-xs font-medium text-[#72849D] dark:text-[#91A9C6] mt-0.5">
              Akses Terpadu RBAC
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
