'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles, CheckCircle2, ChevronDown, Activity, Clock } from 'lucide-react';

export function LandingHero() {
  return (
    <section className="relative min-h-[94vh] pt-32 pb-20 flex flex-col justify-center overflow-hidden">
      {/* Background Campus Sunrise with Gradient Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <Image
          src="/images/landing/hero-campus-sunrise.webp"
          alt="Gedung Kampus & Sekolah EduNotify saat Fajar"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-30 dark:opacity-40 transition-transform duration-1000 scale-105"
        />
        {/* Soft Multi-Layer Gradient Overlays for High Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F3F7FE]/90 via-[#F3F7FE]/75 to-[#F3F7FE] dark:from-[#071325]/92 dark:via-[#071325]/80 dark:to-[#071325]" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-[#F3F7FE]/40 to-[#F3F7FE] dark:via-transparent dark:to-[#071325]" />

        {/* Ambient Glow Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#04B9E8]/10 dark:bg-[#04B9E8]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[#1351C6]/10 dark:bg-[#1351C6]/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 w-full flex flex-col items-center">
        {/* Top Floating Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md bg-white/70 dark:bg-[#0D2037]/80 border border-[#04B9E8]/30 dark:border-[#04B9E8]/40 shadow-sm mb-6 animate-fade-in">
          <Sparkles className="w-4 h-4 text-[#04B9E8]" />
          <span className="text-xs sm:text-sm font-semibold tracking-wide text-[#1351C6] dark:text-[#04B9E8]">
            Platform Presensi Terpadu & Early Warning Multitenant
          </span>
        </div>

        {/* Agentix-Style Headline */}
        <h1 className="text-3xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-center text-[#172944] dark:text-white max-w-4xl leading-[1.15] mb-6 text-balance">
          Presensi Estafet &{' '}
          <span className="italic font-serif text-[#0284C7] dark:text-[#35E6BD] underline decoration-[#04B9E8]/40 underline-offset-8">
            Deteksi Dini Siswa
          </span>{' '}
          Berbasis AI Cerdas.
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-center text-[#334661] dark:text-[#91A9C6] max-w-2xl leading-relaxed mb-8">
          Transformasi alur absensi guru mata pelajaran tanpa tumpang tindih jadwal.
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-semibold text-[#172944] dark:text-[#EAF5FF] px-6 py-3.5 rounded-full backdrop-blur-md bg-white/60 dark:bg-[#0D2037]/70 border border-[#E4EBF6] dark:border-[#1D3756] hover:border-[#04B9E8]/40 hover:bg-white/80 dark:hover:bg-[#0D2037] shadow-sm transition-all duration-200"
          >
            <span>Pelajari Alur 3 Langkah</span>
            <ChevronDown className="w-4 h-4 text-[#04B9E8]" />
          </a>
        </div>

        {/* Floating Glass Showcase Card */}
        <div className="relative w-full max-w-3xl mx-auto group">
          <div className="relative rounded-3xl overflow-hidden backdrop-blur-xl bg-white/70 dark:bg-[#0D2037]/80 border border-[#E4EBF6] dark:border-[#1D3756] p-4 sm:p-6 shadow-2xl shadow-[#1351C6]/10 dark:shadow-black/50 transition-all duration-300 hover:border-[#04B9E8]/50">
            {/* Visual Glass Card Image */}
            <div className="relative w-full h-[240px] sm:h-[340px] rounded-2xl overflow-hidden bg-gradient-to-br from-white/90 to-[#F3F7FE] dark:from-[#071325] dark:to-[#0D2037] border border-[#E4EBF6] dark:border-[#1D3756] flex items-center justify-center">
              <Image
                src="/images/landing/glass-card-floating.webp"
                alt="EduNotify Floating Glass Card"
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
              />

              {/* Top Floating Badge */}
              <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md bg-white/85 dark:bg-[#071325]/85 border border-[#E4EBF6] dark:border-[#1D3756] shadow-sm text-xs font-semibold text-[#172944] dark:text-[#EAF5FF]">
                <Activity className="w-3.5 h-3.5 text-[#35E6BD]" />
                <span>Status: Presensi Real-Time Aktif</span>
              </div>

              {/* Bottom Overlaid Status Bar */}
              <div className="absolute bottom-4 left-4 right-4 p-3 sm:p-4 rounded-xl backdrop-blur-md bg-white/85 dark:bg-[#071325]/85 border border-[#E4EBF6] dark:border-[#1D3756] shadow-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#35E6BD] shadow-[0_0_10px_#35E6BD]" />
                  <div>
                    <div className="text-[11px] font-medium text-[#72849D] dark:text-[#91A9C6]">
                      Rekonsiliasi Estafet Otomatis
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-[#172944] dark:text-white">
                      100% Sinkronisasi Seluruh Jam Pelajaran
                    </div>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#1351C6] dark:text-[#04B9E8] bg-[#F3F7FE] dark:bg-[#0D2037] px-3 py-1.5 rounded-lg border border-[#04B9E8]/20">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#35E6BD]" />
                  <span>Terverifikasi</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Micro Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full max-w-4xl mt-12 pt-8 border-t border-[#E4EBF6] dark:border-[#1D3756]">
          <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/40 dark:bg-[#0D2037]/40 border border-[#E4EBF6]/60 dark:border-[#1D3756]/60">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1351C6] dark:text-[#04B9E8] tracking-tight">
              99.8%
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
              100%
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