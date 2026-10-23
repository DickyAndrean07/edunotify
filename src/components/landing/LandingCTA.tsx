'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

export function LandingCTA() {
  return (
    <section className="relative py-20 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="relative rounded-3xl overflow-hidden p-8 sm:p-14 bg-gradient-to-br from-[#1351C6] via-[#0E3D96] to-[#071325] text-white shadow-2xl shadow-[#1351C6]/30 border border-[#04B9E8]/30 flex flex-col items-center text-center">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#04B9E8]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#35E6BD]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#D8F8FF] text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#35E6BD]" />
            <span>Mulai Langkah Pertama Sekolah Anda</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Siap Mentransformasi Presensi & Kepedulian di Sekolah Anda?
          </h2>

          <p className="text-base sm:text-lg text-[#D8F8FF]/85 leading-relaxed mb-8 max-w-2xl mx-auto">
            Wujudkan tata kelola presensi yang adil, otomatis, dan mendalam dengan Early Warning System berbasis empati. Akses dashboard sekarang juga.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-bold text-[#071325] px-8 py-4 rounded-full bg-[#35E6BD] hover:bg-[#2ed6ad] shadow-lg shadow-[#35E6BD]/30 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
            >
              <span>Masuk Dashboard Sekarang</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <a
              href="#scrollytelling"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-semibold text-white px-7 py-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 transition-all duration-200"
            >
              <span>Lihat Detail Fitur</span>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs text-[#D8F8FF]/70">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#35E6BD]" />
              <span>Multi-Tenant Data Privacy</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#35E6BD]" />
              <span>Integrasi Role-Based Access Control</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#35E6BD]" />
              <span>Zero-Setup Per Kelas</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}