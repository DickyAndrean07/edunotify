'use client';

import React from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';

export function LandingFooter() {
  return (
    <footer className="w-full border-t border-[#E4EBF6] dark:border-[#1D3756] bg-white/50 dark:bg-[#071325]/80 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand & Mission */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2">
          <BrandLogo size="md" showWordmark={true} subtitle="Presensi Siswa & EWS Multitenant" />
          <p className="text-xs text-[#72849D] dark:text-[#91A9C6] max-w-sm mt-1">
            Platform presensi siswa berbasis alur jadwal pelajaran estafet dengan Early Warning System dan narasi analitik AI kepedulian.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-medium text-[#72849D] dark:text-[#91A9C6]">
          <a href="#scrollytelling" className="hover:text-[#1351C6] dark:hover:text-[#04B9E8] transition-colors">
            Alur Estafet
          </a>
          <a href="#ai-care" className="hover:text-[#1351C6] dark:hover:text-[#04B9E8] transition-colors">
            AI Early Warning
          </a>
          <a href="#wa-bridge" className="hover:text-[#1351C6] dark:hover:text-[#04B9E8] transition-colors">
            Jembatan WA
          </a>
          <a href="#fitur" className="hover:text-[#1351C6] dark:hover:text-[#04B9E8] transition-colors">
            Fitur
          </a>
          <Link href="/login" className="hover:text-[#1351C6] dark:hover:text-[#04B9E8] transition-colors">
            Masuk Dashboard
          </Link>
        </div>

        {/* Copyright */}
        <div className="text-xs text-[#72849D] dark:text-[#91A9C6] text-center md:text-right">
          <div>© {new Date().getFullYear()} EduNotify. Hak cipta dilindungi undang-undang.</div>
          <div className="text-[11px] text-[#72849D]/70 dark:text-[#91A9C6]/60 mt-0.5">
            Dibuat untuk ekosistem pendidikan modern Indonesia.
          </div>
        </div>
      </div>
    </footer>
  );
}